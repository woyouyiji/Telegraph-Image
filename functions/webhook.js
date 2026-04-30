export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();

    if (update.message && update.message.photo) {
      const chatId = update.message.chat.id.toString();
      const senderId = update.message.from.id.toString();
      
      const fileId = update.message.photo[update.message.photo.length - 1].file_id;
      const domain = new URL(request.url).hostname;
      const imageUrl = `https://${domain}/file/${fileId}.png`;

      // 我们把门禁临时拆掉，让它把获取到的 ID 全部打印回给你！
      const debugText = `🔍 <b>诊断模式启动</b>\n\n` +
                        `👤 <b>你的真实发件人 ID：</b> <code>${senderId}</code>\n` +
                        `🏠 <b>当前聊天框/群 ID：</b> <code>${chatId}</code>\n` +
                        `🔒 <b>系统里配置的白名单 ID：</b> <code>${env.ALLOWED_USERIDS || '没读取到!'}</code>\n\n` +
                        `🔗 如果上面三个有对不上的地方，就会被拦截。但现在我先放行，你的链接是：\n<code>${imageUrl}</code>`;

      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: debugText,
          reply_to_message_id: update.message.message_id,
          parse_mode: 'HTML'
        })
      });
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
