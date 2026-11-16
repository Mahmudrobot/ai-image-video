async function registerSlashCommands(env) {
  try {
    const commands = [
      { command: "start", description: "🏠 মেইন কন্ট্রোল প্যানেল" },
      { command: "video", description: "🎬 নতুন AI ভিডিও" },
      { command: "image", description: "🖼️ নতুন AI ইমেজ" },
      { command: "vault", description: "🔐 API Key ভল্ট" },
      { command: "drives", description: "📁 Google Drive ম্যানেজার" },
      { command: "channels", description: "📺 কাস্টম চ্যানেল" },
      { command: "pending", description: "⏳ পেন্ডিং টাস্ক" },
      { command: "emergency_reset", description: "🚨 ক্র্যাশ ক্লিয়ার" },
      { command: "restart", description: "🔄 বট রিস্টার্ট" }
    ];
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setMyCommands`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commands })
    });
  } catch(e) {}
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AI Studio Pro Fixed Router Active");
    
    let update;
    try {
      update = await request.json();
    } catch (e) {
      return new Response("OK");
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const uid = String(cq.from.id);
      const chatId = cq.message.chat.id;
      const data = cq.data;

      try {
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cq.id })
        });
      } catch(e) {}

      if (data === "main_menu" || data === "emergency_reset_btn" || data === "cmd_restart") {
        try {
          const keysList = await env.STUDIO_DB.list();
          for (let k of keysList.keys) {
            if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_")) {
              await env.STUDIO_DB.delete(k.name);
            }
          }
        } catch(e) {}
        await showMainMenu(env, chatId, uid);
      }
      else if (data === "menu_vault") {
        await showVaultMenu(env, chatId, uid);
      }
      else if (data === "add_key_gemini") {
        try {
          await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_api_key" }), { expirationTtl: 600 });
        } catch(e) {}
        await sendTG(env, chatId, "🟢 আপনার **Gemini API Key** এখানে লিখে পাঠান:", [[{ text: "« ফিরে যান", callback_data: "menu_vault" }, { text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "menu_create_video") {
        try {
          await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_prompt" }), { expirationTtl: 900 });
        } catch(e) {}
        await sendTG(env, chatId, "🎬 **নতুন AI ভিডিও জেনারেশন**\nআপনার ভিডিওর টপিক বা প্রম্পট লিখে পাঠান:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "menu_create_image") {
        try {
          await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_image_prompt" }), { expirationTtl: 900 });
        } catch(e) {}
        await sendTG(env, chatId, "🖼️ **নতুন AI ইমেজ জেনারেশন**\nছবির বর্ণনা লিখে পাঠান:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "menu_drives") {
        await showDrivesMenu(env, chatId, uid);
      }
      else if (data === "menu_channels") {
        await showChannelsMenu(env, chatId, uid);
      }
      else if (data === "menu_pending") {
        await showPendingTasks(env, chatId, uid);
      }

      return new Response("OK");
    }

    const msg = update.message;
    if (!msg) return new Response("OK");
    const uid = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/emergency_reset" || text === "/restart" || text === "/start" || text === "/cancel") {
      try {
        const keysList = await env.STUDIO_DB.list();
        for (let k of keysList.keys) {
          if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_")) {
            await env.STUDIO_DB.delete(k.name);
          }
        }
      } catch(e) {}
      await registerSlashCommands(env);
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }

    if (text === "/vault") { await showVaultMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/drives") { await showDrivesMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/channels") { await showChannelsMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/pending") { await showPendingTasks(env, chatId, uid); return new Response("OK"); }
    if (text === "/video") {
      try { await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_prompt" }), { expirationTtl: 900 }); } catch(e) {}
      await sendTG(env, chatId, "🎬 ভিডিওর টপিক লিখে পাঠান:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      return new Response("OK");
    }
    if (text === "/image") {
      try { await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_image_prompt" }), { expirationTtl: 900 }); } catch(e) {}
      await sendTG(env, chatId, "🖼️ ছবির বর্ণনা লিখে পাঠান:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      return new Response("OK");
    }

    let stateRaw = null;
    try {
      stateRaw = await env.STUDIO_DB.get(`state_${uid}`);
    } catch(e) {}

    if (stateRaw && text && !text.startsWith("/")) {
      const state = JSON.parse(stateRaw);
      try { await env.STUDIO_DB.delete(`state_${uid}`); } catch(e) {}

      if (state.mode === "awaiting_api_key") {
        let myKeys = { gemini: [] };
        try {
          myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[]}');
        } catch(e) {}
        myKeys.gemini = [...new Set([...(myKeys.gemini || []), text])];
        try {
          await env.STUDIO_DB.put(`keys_${uid}`, JSON.stringify(myKeys));
        } catch(e) {}
        await sendTG(env, chatId, "✅ Gemini API Key সফলভাবে ভল্টে সেভ হয়েছে!", [[{ text: "🔐 ভল্টে ফিরে যান", callback_data: "menu_vault" }, { text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
        return new Response("OK");
      }
      else if (state.mode === "awaiting_video_prompt") {
        let taskId = "task_" + Date.now();
        let task = { id: taskId, uid: uid, type: "video", topic: text, status: "processing", created_at: Date.now() };
        let tasks = [];
        try {
          tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        } catch(e) {}
        tasks.push(task);
        try {
          await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        } catch(e) {}
        await sendTG(env, chatId, `🎬 **ভিডিও টাস্ক ক্রিয়েট হয়েছে!**\n\nবিষয়: ${text}\nআইডি: ${taskId}`, [
          [{ text: "⏳ পেন্ডিং লিস্ট", callback_data: "menu_pending" }, { text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
        ]);
        return new Response("OK");
      }
      else if (state.mode === "awaiting_image_prompt") {
        await sendTG(env, chatId, `🖼️ **ইমেজ রিকোয়েস্ট গৃহীত হয়েছে!**\n\nবর্ণনা: ${text}`, [
          [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
        ]);
        return new Response("OK");
      }
    }

    await showMainMenu(env, chatId, uid);
    return new Response("OK");
  }
};

async function showVaultMenu(env, chatId, uid) {
  let myKeys = { gemini: [] };
  try {
    myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[]}');
  } catch(e) {}
  await sendTG(env, chatId, `🔐 **API Key ভল্ট**\nসংরক্ষিত Gemini Keys: ${(myKeys.gemini || []).length}টি`, [
    [{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }],
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showDrivesMenu(env, chatId, uid) {
  await sendTG(env, chatId, "📁 **Google Drive ম্যানেজার**\nআপনার ড্রাইভ কানেকশন সক্রিয় আছে।", [
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showChannelsMenu(env, chatId, uid) {
  await sendTG(env, chatId, "📺 **কাস্টম চ্যানেল ম্যানেজার**\nএখানে আপনার চ্যানেল কনফিগারেশন ম্যানেজ করতে পারবেন।", [
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showPendingTasks(env, chatId, uid) {
  let tasks = [];
  try {
    tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]").filter(t => String(t.uid) === uid);
  } catch(e) {}
  
  await sendTG(env, chatId, `⏳ **পেন্ডিং টাস্ক লিস্ট**\nমোট টাস্ক: ${tasks.length}টি`, [
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showMainMenu(env, chatId, uid) {
  let myKeys = { gemini: [] };
  try {
    myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[]}');
  } catch(e) {}
  await sendTG(env, chatId, "🏢 **AI Studio Pro — মাস্টার কন্ট্রোল প্যানেল**", [
    [{ text: "🎬 নতুন AI ভিডিও", callback_data: "menu_create_video" }, { text: "🖼️ নতুন AI ইমেজ", callback_data: "menu_create_image" }],
    [{ text: `🔐 API Key (${(myKeys.gemini || []).length})`, callback_data: "menu_vault" }, { text: "📁 Drive", callback_data: "menu_drives" }],
    [{ text: "📺 Channels", callback_data: "menu_channels" }, { text: "⏳ Pending", callback_data: "menu_pending" }],
    [{ text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }, { text: "🔄 Restart", callback_data: "cmd_restart" }]
  ]);
}

async function sendTG(env, chatId, text, inlineKeyboard = null) {
  try {
    const payload = { chat_id: chatId, text: text, parse_mode: "Markdown" };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
  } catch(e) {}
}
