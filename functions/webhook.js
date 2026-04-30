export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    console.log("1. 收到完整消息包:", JSON.stringify(update));

    const msg = update.message || update.channel_post;

    if (msg) {
      const chatId = msg.chat ? msg.chat.id.toString() : '未知';
      const senderId = msg.from ? msg.from.id.toString() : '未知';
      
      const envUser = env.ALLOWED_USERIDS ? String(env.ALLOWED_USERIDS) : '【未读取到！】';
      const envGroup = env.TG_CHAT_ID ? String(env.TG_CHAT_ID) : '【未读取到！】';

      console.log(`2. 提取的ID -> 发件人: ${senderId}, 聊天框: ${chatId}`);
      console.log(`3. 你的配置 -> 个人ID: ${envUser}, 群聊ID: ${envGroup}`);

      const diagText = `🚨 <b>系统拦截报告</b>\n\n` +
                       `👤 <b>我是谁（发件人）：</b> <code>${senderId}</code>\n` +
                       `🏠 <b>我在哪（聊天框）：</b> <code>${chatId}</code>\n\n` +
                       `⚙️ <b>后台配置的个人ID：</b> <code>${envUser}</code>\n` +
                       `⚙️ <b>后台配置的群聊ID：</b> <code>${envGroup}</code>\n\n` +
                       `<i>如果上面这两组数据对不上，或者显示未读取到，机器人就会把你当成陌生人！</i>`;

      // 强制发送诊断报告
      const tgRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: diagText,
          parse_mode: 'HTML'
        })
      });

      const tgData = await tgRes.json();
      console.log("4. Telegram 接口返回结果:", JSON.stringify(tgData));
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.log("【代码崩溃】:", e.message);
    return new Response('Error', { status: 200 });
  }
}
