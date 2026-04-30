export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    
    // 获取消息主体（私聊是 message，频道是 channel_post）
    const msg = update.message || update.channel_post;

    // 如果有人发了图片
    if (msg && msg.photo) {
      const chatId = msg.chat ? msg.chat.id.toString() : '';
      const senderId = msg.from ? msg.from.id.toString() : '';

      // 🛑 核心保安逻辑 🛑
      // 必须是你专属群的ID，或者你私聊的真实用户ID，否则直接拦截！
      if (chatId !== env.TG_CHAT_ID && senderId !== env.ALLOWED_USERIDS) {
        return new Response('Unauthorized User', { status: 200 }); // 返回200装死，不理陌生人
      }

      // 提取最高清的图片ID
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      
      // 生成你的图床链接
      const domain = new URL(request.url).hostname;
      const imageUrl = `https://${domain}/file/${fileId}.png`;

      // 准备回复的文本
      const replyText = `🎉 上传成功！\n\n🔗 链接：\n${imageUrl}\n\n📝 Markdown 格式：\n![image](${imageUrl})`;

      // 发送回复给 Telegram
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          reply_to_message_id: msg.message_id
        })
      });
    }

    // 无论发生什么，必须给 TG 返回 200，不然它会一直重试
    return new Response('OK', { status: 200 });
  } catch (e) {
    // 即使代码报错也返回 200，并在后台记录，防止死循环
    return new Response('Error but OK', { status: 200 }); 
  }
}
