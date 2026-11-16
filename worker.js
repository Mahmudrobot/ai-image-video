const DEFAULT_TPLS = {
  tpl_islamic: { name: "ইসলামিক গল্প (2D)", category: "Islamic", duration_sec: 60, style: "Golden & emerald 2D vector Islamic calligraphy", voice: "edge:v7_boy_islamic", speaker_voices: ["edge:v7_boy_islamic"], emotion: "calm", preview_file_id: null, preview_type: "video" },
  tpl_cartoon: { name: "২ডি কার্টুন (Kids)", category: "Cartoon", duration_sec: 60, style: "Colorful 2D vector cartoon characters", voice: "edge:v12_girl_cartoon", speaker_voices: ["edge:v12_girl_cartoon", "gemini:Puck"], emotion: "excited", preview_file_id: null, preview_type: "video" },
  tpl_3d_tech: { name: "৩ডি টেক মোশন", category: "3D Tech", duration_sec: 60, style: "Sleek 3D dark cyber neon cards", voice: "gemini:Puck", speaker_voices: ["gemini:Puck"], emotion: "normal", preview_file_id: null, preview_type: "video" }
};

const GEMINI_VOICES_LIST = [
  ["gemini:Zephyr", "✨ Zephyr"], ["gemini:Puck", "✨ Puck"], ["gemini:Charon", "✨ Charon"], ["gemini:Kore", "✨ Kore"], ["gemini:Fenrir", "✨ Fenrir"],
  ["gemini:Leda", "✨ Leda"], ["gemini:Orus", "✨ Orus"], ["gemini:Aoede", "✨ Aoede"], ["gemini:Callirrhoe", "✨ Callirrhoe"], ["gemini:Autonoe", "✨ Autonoe"],
  ["gemini:Enceladus", "✨ Enceladus"], ["gemini:Iapetus", "✨ Iapetus"], ["gemini:Umbriel", "✨ Umbriel"], ["gemini:Algieba", "✨ Algieba"], ["gemini:Despina", "✨ Despina"],
  ["gemini:Erinome", "✨ Erinome"], ["gemini:Algenib", "✨ Algenib"], ["gemini:Rasalgethi", "✨ Rasalgethi"], ["gemini:Laomedeia", "✨ Laomedeia"], ["gemini:Achernar", "✨ Achernar"],
  ["gemini:Alnilam", "✨ Alnilam"], ["gemini:Schedar", "✨ Schedar"], ["gemini:Gacrux", "✨ Gacrux"], ["gemini:Pulcherrima", "✨ Pulcherrima"], ["gemini:Achird", "✨ Achird"],
  ["gemini:Zubenelgenubi", "✨ Zubenelgenubi"], ["gemini:Vindemiatrix", "✨ Vindemiatrix"], ["gemini:Sadachbia", "✨ Sadachbia"], ["gemini:Sadaltager", "✨ Sadaltager"], ["gemini:Sulafat", "✨ Sulafat"]
];

const EDGE_VOICES_LIST = [
  ["edge:v1_boy_deep", "🇧🇩 Pradeep (Deep)"], ["edge:v2_boy_story", "🇧🇩 Storyteller"], ["edge:v3_boy_energetic", "🇧🇩 Energetic"], ["edge:v4_boy_calm", "🇧🇩 Calm"], ["edge:v5_boy_news", "🇧🇩 News"],
  ["edge:v6_boy_documentary", "🇧🇩 Documentary"], ["edge:v7_boy_islamic", "🇧🇩 Islamic"], ["edge:v8_boy_kolkata", "🇮🇳 Bashkar (Kolkata)"], ["edge:v9_boy_kolkata_fast", "🇮🇳 Kolkata Fast"], ["edge:v10_boy_kolkata_deep", "🇮🇳 Kolkata Deep"],
  ["edge:v11_girl_sweet", "🇧🇩 Nabanita (Sweet)"], ["edge:v12_girl_cartoon", "🇧🇩 Cartoon Girl"], ["edge:v13_girl_emotional", "🇧🇩 Emotional Girl"], ["edge:v14_girl_news", "🇧🇩 News Girl"], ["edge:v15_girl_story", "🇧🇩 Story Girl"],
  ["edge:v16_girl_promo", "🇧🇩 Promo Girl"], ["edge:v17_girl_soft", "🇧🇩 Soft Girl"], ["edge:v18_girl_kolkata", "🇮🇳 Tanishaa (Kolkata)"], ["edge:v19_girl_kolkata_energetic", "🇮🇳 Kolkata Energetic"], ["edge:v20_girl_kolkata_calm", "🇮🇳 Kolkata Calm"]
];

const EMOTIONS_LIST = [
  ["normal", "😐 Normal"], ["excited", "🤩 Excited"], ["sad", "😢 Sad"], ["dramatic", "🎭 Dramatic"], ["calm", "😌 Calm"], ["news", "📰 News"]
];

async function registerSlashCommands(env) {
  const commands = [
    { command: "start", description: "🏠 মেইন কন্ট্রোল প্যানেল" },
    { command: "video", description: "🎬 নতুন AI ভিডিও" },
    { command: "image", description: "🖼️ নতুন AI ইমেজ" },
    { command: "tts", description: "🎙️ ৫০টি কণ্ঠ ও ভয়েস স্টুডিও" },
    { command: "templates", description: "🎨 টেমপ্লেট ও প্রিভিউ ম্যানেজার" },
    { command: "vault", description: "🔐 API Key ভল্ট" },
    { command: "drives", description: "📁 Google Drive ম্যানেজার" },
    { command: "channels", description: "📺 কাস্টম চ্যানেল" },
    { command: "pending", description: "⏳ পেন্ডিং টাস্ক (Stop/Delete)" },
    { command: "emergency_reset", description: "🚨 ক্র্যাশ ক্যান্সেল ও রিস্টার্ট" },
    { command: "backup", description: "💾 ব্যাকআপ JSON" },
    { command: "restart", description: "🔄 বট রিস্টার্ট" },
    { command: "claim_admin", description: "👑 Super Admin ক্লেইম" }
  ];
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setMyCommands`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commands })
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AI Studio Pro Full Online");
    const workerUrl = new URL(request.url).origin;
    const update = await request.json();

    if (update.internal_alert) {
      let alerts = JSON.parse((await env.STUDIO_DB.get("active_alerts")) || "[]");
      const alertId = "alt_" + Date.now();
      alerts.push({ id: alertId, chat_id: update.chat_id, message: update.message, last_sent: Date.now() });
      await env.STUDIO_DB.put("active_alerts", JSON.stringify(alerts));
      await sendTG(env, update.chat_id, `🚨 **জরুরি সমস্যা!**\n\n${update.message}`, [
        [{ text: "✅ ঠিক আছে, দেখেছি (Stop)", callback_data: `ack_alert:${alertId}` }]
      ]);
      return new Response("ALERT_LOGGED");
    }
    if (update.internal_tpl_update) {
      let tpls = await getUserTemplates(env, update.uid);
      if (tpls[update.tpl_id]) {
        tpls[update.tpl_id].preview_file_id = update.file_id;
        tpls[update.tpl_id].preview_type = "video";
        tpls[update.tpl_id].duration_sec = update.duration_sec;
        await env.STUDIO_DB.put(`tpls_${update.uid}`, JSON.stringify(tpls));
      }
      return new Response("TPL_SAVED");
    }
    if (update.internal_complete) {
      let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
      tasks = tasks.filter(t => t.id !== update.task_id);
      await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
      return new Response("TASK_COMPLETED");
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const uid = String(cq.from.id);
      const chatId = cq.message.chat.id;
      const data = cq.data;
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cq.id })
      });

      if (data === "main_menu") await showMainMenu(env, chatId, uid);
      else if (data === "emergency_reset_btn" || data === "cmd_restart") {
        const keysList = await env.STUDIO_DB.list();
        for (let k of keysList.keys) {
          if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_") || k.name.startsWith("draft_") || k.name === "pending_tasks") {
            await env.STUDIO_DB.delete(k.name);
          }
        }
        await registerSlashCommands(env);
        await sendTG(env, chatId, "🚨 **ক্র্যাশ ক্লি ও ইমারজেন্সি রিস্টার্ট সফল!** সব হ্যাং হওয়া টাস্ক মুছে ফেলা হয়েছে।", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
        await showMainMenu(env, chatId, uid);
      }
      else if (data === "menu_backup") await exportUserBackup(env, chatId, uid);
      else if (data === "menu_vault") await showVaultMenu(env, chatId, uid);
      else if (data === "add_key_gemini") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_api_key", provider: "gemini" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "🟢 আপনার **Gemini API Key** পেস্ট করুন:", [[{ text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }]]);
      }
      else if (data === "menu_create_video") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_prompt" }), { expirationTtl: 900 });
        await sendTG(env, chatId, "🎬 **নতুন AI ভিডিও**\nবিষয় বা প্রম্পট লিখে পাঠান:", [[{ text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }]]);
      }
      else if (data === "menu_create_image") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_image_prompt" }), { expirationTtl: 900 });
        await sendTG(env, chatId, "🖼️ **নতুন AI ইমেজ**\nছবির বর্ণনা লিখে পাঠান:", [[{ text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }]]);
      }
      else if (data === "menu_drives") await showDrivesMenu(env, chatId, uid);
      else if (data === "menu_channels") await showChannelsMenu(env, chatId, uid);
      else if (data === "menu_tts") {
        await sendTG(env, chatId, "🎙️ **ভোয়েস স্টুডিও**", [
          [{ text: "✨ Gemini Pro Voices (৩০টি)", callback_data: "tts_list_gemini:0" }],
          [{ text: "🇧🇩 Bangla Edge-TTS (২০টি)", callback_data: "tts_list_edge:0" }],
          [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
        ]);
      }
      else if (data === "menu_templates") {
        const tpls = await getUserTemplates(env, uid);
        const btns = Object.keys(tpls).map(tid => [{ text: `🎨 ${tpls[tid].name}`, callback_data: `view_tpl:${tid}` }]);
        btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
        await sendTG(env, chatId, "🎨 **টেমপ্লেট লাইব্রেরি**", btns);
      }
      else if (data === "menu_pending") await showPendingTasks(env, chatId, uid);
      else if (data.startsWith("task_del:")) {
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks = tasks.filter(t => t.id !== data.split(":")[1]);
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        await showPendingTasks(env, chatId, uid);
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

    if (text === "/emergency_reset") {
      const keysList = await env.STUDIO_DB.list();
      for (let k of keysList.keys) {
        if (k.name.startsWith(`state_${uid}`) || k.name.startsWith("pending_") || k.name.startsWith("draft_") || k.name === "pending_tasks") {
          await env.STUDIO_DB.delete(k.name);
        }
      }
      await registerSlashCommands(env);
      await sendTG(env, chatId, "🚨 **ক্র্যাশ ক্লিয়ার ও হার্ড রিসেট সফল!**");
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }

    if (text === "/restart" || text === "/start") {
      await registerSlashCommands(env);
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }
    if (text === "/vault") { await showVaultMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/pending") { await showPendingTasks(env, chatId, uid); return new Response("OK"); }
    if (text === "/drives") { await showDrivesMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/channels") { await showChannelsMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/templates") { await sendTG(env, chatId, "🎨 টেমপ্লেট মেনু:", [[{ text: "🎨 টেমপ্লেট দেখুন", callback_data: "menu_templates:0" }]]); return new Response("OK"); }
    if (text === "/backup") { await exportUserBackup(env, chatId, uid); return new Response("OK"); }

    await showMainMenu(env, chatId, uid);
    return new Response("OK");
  }
};

async function showVaultMenu(env, chatId, uid) {
  const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
  await sendTG(env, chatId, `🔐 **API Key ভল্ট**\nGemini: ${myKeys.gemini.length}টি`, [
    [{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }],
    [{ text: "🚨 ক্র্যাশ ক্লিয়ার (Crash Cancel)", callback_data: "emergency_reset_btn" }],
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function getUserDrives(env, uid) { return JSON.parse((await env.STUDIO_DB.get(`drives_${uid}`)) || "{}"); }
async function getUserChannels(env, uid) {
  const raw = await env.STUDIO_DB.get(`channels_${uid}`);
  if (!raw) {
    const def = { ch_default: { name: "মেইন চ্যানেল (Default)", selected_tpls: [], voice: "gemini:Puck", emotion: "normal", drive_enabled: true } };
    await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(def));
    return def;
  }
  return JSON.parse(raw);
}
async function getUserTemplates(env, uid) {
  const saved = await env.STUDIO_DB.get(`tpls_${uid}`);
  if (!saved) { await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(DEFAULT_TPLS)); return DEFAULT_TPLS; }
  return JSON.parse(saved);
}

async function showDrivesMenu(env, chatId, uid) {
  const drives = await getUserDrives(env, uid);
  await sendTG(env, chatId, `📁 **Google Drive ম্যানেজার (${Object.keys(drives).length}টি)**`, [
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function showChannelsMenu(env, chatId, uid) {
  const channels = await getUserChannels(env, uid);
  const btns = Object.keys(channels).map(cid => [{ text: `📺 ${channels[cid].name}`, callback_data: `main_menu` }]);
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, "📺 **কাস্টম চ্যানেল ম্যানেজার**", btns);
}

async function showPendingTasks(env, chatId, uid) {
  const tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]").filter(t => String(t.uid) === uid);
  const btns = tasks.map(t => [{ text: `⚙️ ${t.topic.slice(0, 20)}`, callback_data: "noop" }, { text: "🗑️ Delete", callback_data: `task_del:${t.id}` }]);
  btns.push([{ text: "🚨 সব টাস্ক ও ক্র্যাশ ক্লিয়ার করুন", callback_data: "emergency_reset_btn" }]);
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, `⏳ **পেন্ডিং টাস্ক (${tasks.length}টি):**`, btns);
}

async function exportUserBackup(env, chatId, uid) {
  const backupData = { exported_at: new Date().toISOString(), uid, drives: await getUserDrives(env, uid), channels: await getUserChannels(env, uid), templates: await getUserTemplates(env, uid) };
  await sendTGDocument(env, chatId, `studio_backup_${uid}.json`, JSON.stringify(backupData, null, 2));
}

async function showMainMenu(env, chatId, uid) {
  const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
  await sendTG(env, chatId, "🏢 **AI Studio Pro — ফুল কন্ট্রোল প্যানেল**", [
    [{ text: "🎬 নতুন AI ভিডিও", callback_data: "menu_create_video" }, { text: "🖼️ নতুন AI ইমেজ", callback_data: "menu_create_image" }],
    [{ text: "🎙️ ভয়েস স্টুডিও", callback_data: "menu_tts" }, { text: "🎨 টেমপ্লেট লাইব্রেরি", callback_data: "menu_templates:0" }],
    [{ text: `🔐 API Key (${myKeys.gemini.length})`, callback_data: "menu_vault" }, { text: "📁 Drive", callback_data: "menu_drives" }],
    [{ text: "⏳ Pending Tasks", callback_data: "menu_pending" }, { text: "🚨 ক্র্যাশ ক্লিয়ার", callback_data: "emergency_reset_btn" }],
    [{ text: "💾 ব্যাকআপ", callback_data: "menu_backup" }, { text: "🔄 Restart", callback_data: "cmd_restart" }]
  ]);
}

async function sendTG(env, chatId, text, inlineKeyboard = null) {
  const payload = { chat_id: chatId, text: text, parse_mode: "Markdown" };
  if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
}
