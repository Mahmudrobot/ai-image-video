export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AI Studio Pro Live");
    
    let update;
    try {
      update = await request.json();
    } catch (e) {
      return new Response("OK");
    }

    const chatId = update.message ? update.message.chat.id : (update.callback_query ? update.callback_query.message.chat.id : null);
    if (!chatId) return new Response("OK");

    const text = update.message ? (update.message.text || "") : (update.callback_query ? update.callback_query.data : "");

    // Send Main Menu
    const payload = {
      chat_id: chatId,
      text: "🏢 **AI Studio Pro — মাস্টার কন্ট্রোল প্যানেল**\n\nবট সফলভাবে সচল আছে!",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎬 নতুন AI ভিডিও", callback_data: "menu_video" }, { text: "🖼️ নতুন AI ইমেজ", callback_data: "menu_image" }],
          [{ text: "🔐 API Key ভল্ট", callback_data: "menu_vault" }, { text: "📁 Google Drive", callback_data: "menu_drives" }],
          [{ text: "🔄 বট রিস্টার্ট", callback_data: "cmd_restart" }]
        ]
      }
    };

    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return new Response("OK");
  }
};
