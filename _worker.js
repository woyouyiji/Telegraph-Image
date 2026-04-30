export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 🤖 机器人逻辑插队：只要访问路径是 /tg-bot，就进入机器人逻辑
    if (url.pathname === '/tg-bot' && request.method === 'POST') {
      try {
        const update = await request.json();
        const msg = update.message || update.channel_post;

        if (msg && msg.photo) {
          const chatId = msg.chat ? msg.chat.id.toString() : '';
          const senderId = msg.from ? msg.from.id.toString() : '';

          // 身份门禁
          if (senderId !== String(env.ALLOWED_USERIDS) && chatId !== String(env.TG_CHAT_ID)) {
            return new Response('Unauthorized', { status: 200 });
          }

          // 1. 发送提示
          await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: "⏳ 正在魔改通道搬运中...", reply_to_message_id: msg.message_id })
          });

          // 2. 搬运图片
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          const fileRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          const imgRes = await fetch(`https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fileData.result.file_path}`);
          const imgBlob = await imgRes.blob();

          const formData = new FormData();
          formData.append('file', imgBlob, 'image.png');
          const uploadRes = await fetch('https://telegra.ph/upload', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();

          // 3. 返回结果
          if (uploadData[0] && uploadData[0].src) {
            const finalUrl = `${url.origin}${uploadData[0].src}`;
            await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🎉 <b>魔改成功！</b>\n\n<code>${finalUrl}</code>`,
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id
              })
            });
          }
        }
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response(e.message, { status: 200 });
      }
    }

    // 🏠 网页逻辑：如果不是机器人消息，就全部交给 Pages 原生的资源处理（维持原图床功能）
    return env.ASSETS.fetch(request);
  }
};
