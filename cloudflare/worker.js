const DEFAULT_TPLS = {
  tpl_islamic: { name: "ইসলামিক গল্প (2D)", category: "Islamic", duration_sec: 60, style: "Golden & emerald 2D vector Islamic calligraphy", voice: "edge:v7_boy_islamic", speaker_voices: ["edge:v7_boy_islamic"], emotion: "calm", preview_file_id: null, preview_type: "video" },
  tpl_cartoon: { name: "২ডি কার্টুন (Kids)", category: "Cartoon", duration_sec: 60, style: "Colorful 2D vector cartoon characters", voice: "edge:v12_girl_cartoon", speaker_voices: ["edge:v12_girl_cartoon", "gemini:Puck"], emotion: "excited", preview_file_id: null, preview_type: "video" },
  tpl_3d_tech: { name: "৩ডি টেক মোশন", category: "3D Tech", duration_sec: 60, style: "Sleek 3D dark cyber neon cards", voice: "gemini:Puck", speaker_voices: ["gemini:Puck"], emotion: "normal", preview_file_id: null, preview_type: "video" }
};

const GEMINI_VOICES_LIST = [
  ["gemini:Zephyr", "✨ Zephyr"], ["gemini:Puck", "✨ Puck"], ["gemini:Charon", "✨ Charon"], ["gemini:Kore", "✨ Kore"], ["gemini:Fenrir", "✨ Fenrir"]
];

const EDGE_VOICES_LIST = [
  ["edge:v1_boy_deep", "🇧🇩 Pradeep (Deep)"], ["edge:v2_boy_story", "🇧🇩 Storyteller"], ["edge:v11_girl_sweet", "🇧🇩 Nabanita (Sweet)"]
];

const EMOTIONS_LIST = [
  ["normal", "😐 Normal"], ["excited", "🤩 Excited"], ["sad", "😢 Sad"], ["dramatic", "🎭 Dramatic"], ["calm", "😌 Calm"]
];

async function registerSlashCommands(env) {
  const commands = [
    { command: "start", description: "🏠 মেইন কন্ট্রোল প্যানেল" },
    { command: "video", description: "🎬 নতুন AI ভিডিও" },
    { command: "image", description: "🖼️ নতুন AI ইমেজ" },
    { command: "vault", description: "🔐 API Key ভল্ট" },
    { command: "emergency_reset", description: "🚨 ক্র্যাশ ক্লিয়ার ও রিস্টার্ট" },
    { command: "restart", description: "🔄 বট রিস্টার্ট" }
  ];
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setMyCommands`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commands })
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AI Studio Pro Online & Stable");
    const workerUrl = new URL(request.url).origin;
    const update = await request.json();

    if (update.callback_query) {
      const cq = update.callback_query;
      const uid = String(cq.from.id);
      const chatId = cq.message.chat.id;
      const data = cq.data;
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cq.id })
      });

      if (data === "main_menu" || data === "emergency_reset_btn" || data === "cmd_restart") {
        try {
          const keysList = await env.STUDIO_DB.list();
          for (let k of keysList.keys) {
            if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_") || k.name.startsWith("draft_")) {
              await env.STUDIO_DB.delete(k.name);
            }
          }
        } catch(e) {}
        await registerSlashCommands(env);
        await showMainMenu(env, chatId, uid);
      }
      else if (data === "menu_vault") await showVaultMenu(env, chatId, uid);
      else if (data === "add_key_gemini") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_api_key", provider: "gemini" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "🟢 আপনার **Gemini API Key** পেস্ট করুন:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "menu_create_video") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_prompt" }), { expirationTtl: 900 });
        await sendTG(env, chatId, "🎬 **নতুন AI ভিডিও**\nবিষয় বা প্রম্পট লিখে পাঠান:", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      return new Response("OK");
    }

    const msg = update.message;
    if (!msg) return new Response("OK");
    const uid = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/claim_admin") {
      await env.STUDIO_DB.put("super_admin_uid", uid);
      await env.STUDIO_DB.put(`user_${uid}`, JSON.stringify({ role: "super_admin" }));
      await registerSlashCommands(env);
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }

    if (text === "/emergency_reset" || text === "/restart" || text === "/start") {
      try {
        const keysList = await env.STUDIO_DB.list();
        for (let k of keysList.keys) {
          if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_") || k.name.startsWith("draft_")) {
            await env.STUDIO_DB.delete(k.name);
          }
        }
      } catch(e) {}
      await registerSlashCommands(env);
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }
    if (text === "/vault") { await showVaultMenu(env, chatId, uid); return new Response("OK"); }

    const stateRaw = await env.STUDIO_DB.get(`state_${uid}`);
    if (stateRaw && text && !text.startsWith("/")) {
      const state = JSON.parse(stateRaw);
      await env.STUDIO_DB.delete(`state_${uid}`);
      if (state.mode === "awaiting_api_key") {
        let myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[]}');
        myKeys.gemini = [...new Set([...(myKeys.gemini || []), text])];
        await env.STUDIO_DB.put(`keys_${uid}`, JSON.stringify(myKeys));
        await sendTG(env, chatId, "✅ API Key সফলভাবে সেভ হয়েছে!", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
        return new Response("OK");
      }
    }

    await showMainMenu(env, chatId, uid);
    return new Response("OK");
  }
};

async function showVaultMenu(env, chatId, uid) {
  const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[]}');
  await sendTG(env, chatId, `🔐 **API Key ভল্ট**\nGemini Keys: ${(myKeys.gemini || []).length}টি`, [
    [{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }],
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showMainMenu(env, chatId, uid) {
  await sendTG(env, chatId, "🏢 **AI Studio Pro — মাস্টার কন্ট্রোল প্যানেল**", [
    [{ text: "🎬 নতুন AI ভিডিও", callback_data: "menu_create_video" }],
    [{ text: "🔐 API Key ভল্ট", callback_data: "menu_vault" }, { text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }],
    [{ text: "🔄 Restart", callback_data: "cmd_restart" }]
  ]);
}

async function sendTG(env, chatId, text, inlineKeyboard = null) {
  const payload = { chat_id: chatId, text: text, parse_mode: "Markdown" };
  if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
}
