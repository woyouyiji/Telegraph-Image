export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();

    // 判断：如果机器人收到了带有图片的消息
    if (update.message && update.message.photo) {
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;

      // Telegram 会发送多个尺寸的图，我们取数组里最后一张（最高清的原图）
      const photos = update.message.photo;
      const fileId = photos[photos.length - 1].file_id;

      // 自动获取你的当前域名（比如 tc.vvvip.qzz.io）
      const domain = new URL(request.url).hostname;
      // 拼接成你的专属图床链接
      const imageUrl = `https://${domain}/file/${fileId}.png`;

      // 准备回复给你的文本内容
      const replyText = `🎉 上传成功！\n\n🔗 <b>图片链接：</b>\n<code>${imageUrl}</code>\n\n📝 <b>Markdown 格式：</b>\n<code>![image](${imageUrl})</code>`;

      // 调用 Telegram API 发送回复
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          reply_to_message_id: messageId,
          parse_mode: 'HTML' // 让返回的链接可以直接点击复制
        })
      });
    }

    // 必须给 Telegram 返回 200，否则它会觉得发送失败而一直重试
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
