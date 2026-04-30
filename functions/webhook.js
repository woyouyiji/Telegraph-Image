export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    const msg = update.message || update.channel_post;

    if (msg && msg.photo) {
      const chatId = msg.chat.id.toString();
      const senderId = msg.from ? msg.from.id.toString() : '';

      // 🛑 1. 严格保安门禁（强制转成字符串对比，杜绝类型识别错误）
      const allowedUser = String(env.ALLOWED_USERIDS);
      const allowedGroup = String(env.TG_CHAT_ID);
      
      if (senderId !== allowedUser && chatId !== allowedGroup) {
        return new Response('Unauthorized', { status: 200 }); // 陌生人发图直接无视
      }

      // 💡 2. 状态反馈：先给主人发条消息，证明我活着！
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "⏳ 收到图片！正在搬运至图床，请稍候...",
          reply_to_message_id: msg.message_id
        })
      });

      // 🚀 3. 提取高清原图，并向 Telegram 请求下载地址
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const getFileRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await getFileRes.json();
      const filePath = fileData.result.file_path;

      // 📥 4. 下载图片文件到 Cloudflare 服务器
      const fileUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${filePath}`;
      const imgRes = await fetch(fileUrl);
      const imgBlob = await imgRes.blob();

      // 📤 5. 模拟前端网页，将图片正式上传至 Telegraph 图床
      const formData = new FormData();
      formData.append('file', imgBlob, 'image.png');
      
      const uploadRes = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      // 🎉 6. 上传成功，生成专属链接并回复
      if (uploadData[0] && uploadData[0].src) {
        const domain = new URL(request.url).hostname;
        const finalUrl = `https://${domain}${uploadData[0].src}`;

        const replyText = `🎉 <b>上传成功！</b>\n\n🔗 <b>直接链接：</b>\n<code>${finalUrl}</code>\n\n📝 <b>Markdown 格式：</b>\n<code>![image](${finalUrl})</code>`;

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
    
    // 必须告诉 Telegram：我处理完了，别再给我重发了！
    return new Response('OK', { status: 200 });
  } catch (e) {
    // 遇到死机错误也得假装正常，免得服务器卡死
    return new Response('Error', { status: 200 });
  }
}
