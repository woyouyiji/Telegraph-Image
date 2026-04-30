export async function onRequest(context) {
  const { request, env } = context;

  // 🌍 模式 1：浏览器测试模式 (GET 请求) - 专门用来验证有没有被劫持
  if (request.method === "GET") {
    return new Response("🚀 太棒了！深层路由 /api/bot 成功避开了网页劫持，接口已打通！", {
      status: 200,
      headers: { "Content-Type": "text/plain;charset=UTF-8" }
    });
  }

  // 🤖 模式 2：Telegram 工作模式 (POST 请求) - 代替你传图
  if (request.method === "POST") {
    try {
      const update = await request.json();
      const msg = update.message || update.channel_post;

      if (msg && msg.photo) {
        const chatId = msg.chat ? msg.chat.id.toString() : '';
        const senderId = msg.from ? msg.from.id.toString() : '';

        // 🛑 门禁核验
        const allowedUser = env.ALLOWED_USERIDS ? String(env.ALLOWED_USERIDS) : '';
        const allowedGroup = env.TG_CHAT_ID ? String(env.TG_CHAT_ID) : '';

        if (senderId !== allowedUser && chatId !== allowedGroup) {
          return new Response('Unauthorized', { status: 200 });
        }

        // 💡 发送处理中提示
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: "⏳ 收到图片！正在偷偷搬运到图床，请稍候...",
            reply_to_message_id: msg.message_id
          })
        });

        // 🚀 提取并下载原图
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const getFileRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileData = await getFileRes.json();
        const filePath = fileData.result.file_path;

        const fileUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${filePath}`;
        const imgRes = await fetch(fileUrl);
        const imgBlob = await imgRes.blob();

        // 📤 模拟网页上传
        const formData = new FormData();
        formData.append('file', imgBlob, 'image.png');

        const uploadRes = await fetch('https://telegra.ph/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();

        // 🎉 生成专属链接并回复
        if (uploadData[0] && uploadData[0].src) {
          const domain = new URL(request.url).hostname;
          const finalUrl = `https://${domain}${uploadData[0].src}`;

          const replyText = `🎉 <b>上传成功！</b>\n\n🔗 <b>图片链接：</b>\n<code>${finalUrl}</code>\n\n📝 <b>Markdown 格式：</b>\n<code>![image](${finalUrl})</code>`;

          await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: 'HTML',
              reply_to_message_id: msg.message_id
            })
          });
        }
      }
      return new Response('OK', { status: 200 });
    } catch (e) {
      return new Response('Error', { status: 200 });
    }
  }
}
