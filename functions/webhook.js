export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    console.log("1. 收到 Telegram 的消息包:", JSON.stringify(update)); // 打印收到的所有内容

    // 判断是普通消息还是频道消息
    const msg = update.message || update.channel_post;

    if (msg && msg.photo) {
      console.log("2. 确认收到图片！准备提取信息...");
      const chatId = msg.chat.id.toString();
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const domain = new URL(request.url).hostname;
      const imageUrl = `https://${domain}/file/${fileId}.png`;

      console.log(`3. 准备发送给聊天框 ID: ${chatId}, 生成的图片链接: ${imageUrl}`);
      console.log(`4. 检查环境变量 Token 是否存在: ${env.TG_BOT_TOKEN ? '存在(保密)' : '【警告】没读到Token！'}`);

      const replyText = `✅ 收到图片！\n🔗 链接：${imageUrl}`;

      // 尝试发消息给 TG
      const tgResponse = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText
        })
      });

      const tgResult = await tgResponse.json();
      console.log("5. Telegram 接口返回结果:", JSON.stringify(tgResult)); // 最关键的一步，看 TG 为什么不发消息！
    } else {
      console.log("【注意】收到消息，但里面没有图片，或者机器人没权限看。");
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.log("【严重错误】代码运行崩溃:", e.message);
    return new Response(e.message, { status: 500 });
  }
}
