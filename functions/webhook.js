export async function onRequest(context) {
  const { request, env } = context;

  // 🌍 模式 1：浏览器测试模式 (GET 请求)
  if (request.method === "GET") {
    return new Response("🚀 恭喜！你的 Webhook 接口没有被屏蔽，已经成功连通！", {
      status: 200,
      headers: { "Content-Type": "text/plain;charset=UTF-8" }
    });
  }

  // 🤖 模式 2：Telegram 工作模式 (POST 请求)
  if (request.method === "POST") {
    try {
      const update = await request.json();
      console.log("终于进来了！收到消息包:", JSON.stringify(update));

      const msg = update.message || update.channel_post;
      if (msg) {
        const chatId = msg.chat ? msg.chat.id.toString() : '未知';
        const senderId = msg.from ? msg.from.id.toString() : '未知';
        
        const diagText = `🚨 终于连通了！\n发件人: ${senderId}\n群聊: ${chatId}`;

        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: diagText })
        });
      }
      return new Response('OK', { status: 200 });
    } catch (e) {
      console.log("报错:", e.message);
      return new Response('Error', { status: 200 });
    }
  }
}
