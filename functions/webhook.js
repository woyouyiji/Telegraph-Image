export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();

    // 确保收到了带有图片的消息
    if (update.message && update.message.photo) {
      // 提取消息的来源信息
      const chatId = update.message.chat.id.toString(); // 发消息的聊天框ID（群ID或私聊ID）
      const senderId = update.message.from.id.toString(); // 发件人的真实用户ID

      // 🛑 核心保安逻辑：身份门禁 🛑
      // 条件1：如果是发在你的专属群里 (chatId === env.TG_CHAT_ID) -> 放行
      // 条件2：如果是你本人私聊发给机器人 (senderId === env.ALLOWED_USERIDS) -> 放行
      // 如果两个都不是，说明是陌生人白嫖！
      if (chatId !== env.TG_CHAT_ID && senderId !== env.ALLOWED_USERIDS) {
        // 直接返回 200，假装收到了但其实什么都不做（装死）
        // 必须返回 200，否则 Telegram 会以为发送失败，一直重试轰炸服务器
        return new Response('Unauthorized user, dropped.', { status: 200 });
      }

      // 如果通过了核验，开始干活：提取最高清图片的 ID
      const messageId = update.message.message_id;
      const photos = update.message.photo;
      const fileId = photos[photos.length - 1].file_id;

      // 拼接成你的专属图床链接
      const domain = new URL(request.url).hostname;
      const imageUrl = `https://${domain}/file/${fileId}.png`;

      // 准备回复文本
      const replyText = `🎉 上传成功！\n\n🔗 <b>图片链接：</b>\n<code>${imageUrl}</code>\n\n📝 <b>Markdown 格式：</b>\n<code>![image](${imageUrl})</code>`;

      // 调用 Telegram API 发送回复
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          reply_to_message_id: messageId,
          parse_mode: 'HTML'
        })
      });
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
