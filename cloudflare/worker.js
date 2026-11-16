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
    { command: "tts", description: "🎙️ ৫০টি কণ্ঠ, Emotion ও মাল্টি-স্পিকার" },
    { command: "templates", description: "🎨 টেমপ্লেট ও প্রিভিউ ম্যানেজার" },
    { command: "vault", description: "🔐 API Key ভল্ট" },
    { command: "drives", description: "📁 Google Drive ম্যানেজার" },
    { command: "channels", description: "📺 কাস্টম চ্যানেল" },
    { command: "pending", description: "⏳ পেন্ডিং টাস্ক (Stop/Resume/Delete)" },
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
      else if (data === "menu_help") await sendHelpMenu(env, chatId);
      else if (data === "cmd_cancel") {
        await env.STUDIO_DB.delete(`state_${uid}`);
        await env.STUDIO_DB.delete(`pending_media_${uid}`);
        await sendTG(env, chatId, "❌ বাতিল করা হয়েছে।", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "cmd_restart") {
        await env.STUDIO_DB.delete(`state_${uid}`);
        await registerSlashCommands(env);
        await sendTG(env, chatId, "🔄 বট রিস্টার্ট হয়েছে!");
        await showMainMenu(env, chatId, uid);
      }
      else if (data === "menu_backup") await exportUserBackup(env, chatId, uid);
      else if (data === "menu_vault") await showVaultMenu(env, chatId, uid);
      else if (data === "add_key_gemini") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_api_key", provider: "gemini" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "🟢 আপনার **Gemini API Key** পেস্ট করুন:", [[{ text: "❌ বাতিল", callback_data: "cmd_cancel" }]]);
      }
      else if (data === "add_key_claude") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_api_key", provider: "claude" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "🟣 আপনার **Claude API Key** পেস্ট করুন:", [[{ text: "❌ বাতিল", callback_data: "cmd_cancel" }]]);
      }
      else if (data === "clear_keys_gemini" || data === "clear_keys_claude") {
        const prov = data.endsWith("gemini") ? "gemini" : "claude";
        let myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        myKeys[prov] = [];
        await env.STUDIO_DB.put(`keys_${uid}`, JSON.stringify(myKeys));
        await showVaultMenu(env, chatId, uid);
      }
      else if (data === "menu_create_video") {
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        if ((userKeys.gemini || []).length === 0 && (userKeys.claude || []).length === 0) {
          await sendTG(env, chatId, "⚠️ **আগে Gemini API Key যোগ করুন!**", [[{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }]]);
          return new Response("OK");
        }
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_prompt" }), { expirationTtl: 900 });
        await sendTG(env, chatId, "🎬 **নতুন AI ভিডিও**\nবিষয় বা প্রম্পট লিখে পাঠান:", [[{ text: "❌ বাতিল", callback_data: "cmd_cancel" }]]);
      }
      else if (data === "menu_create_image") {
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        if ((userKeys.gemini || []).length === 0) {
          await sendTG(env, chatId, "⚠️ **আগে Gemini API Key যোগ করুন!**", [[{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }]]);
          return new Response("OK");
        }
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_image_prompt" }), { expirationTtl: 900 });
        await sendTG(env, chatId, "🖼️ **নতুন AI ইমেজ**\nছবির বর্ণনা লিখে পাঠান:", [[{ text: "❌ বাতিল", callback_data: "cmd_cancel" }]]);
      }
      else if (data === "menu_drives") await showDrivesMenu(env, chatId, uid);
      else if (data === "add_drive_btn") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_drive_name" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "✍️ নতুন Google Drive-এর নাম লিখুন:");
      }
      else if (data.startsWith("del_drive:")) {
        let drives = await getUserDrives(env, uid);
        delete drives[data.split(":")[1]];
        await env.STUDIO_DB.put(`drives_${uid}`, JSON.stringify(drives));
        await showDrivesMenu(env, chatId, uid);
      }
      else if (data === "menu_channels") await showChannelsMenu(env, chatId, uid);
      else if (data === "add_channel_btn") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_new_channel" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "✍️ নতুন চ্যানেলের নাম লিখুন:");
      }
      else if (data.startsWith("cfg_ch:")) await showSingleChannelConfig(env, chatId, uid, data.split(":")[1]);
      else if (data.startsWith("toggle_ch_drv:")) {
        const cid = data.split(":")[1];
        let channels = await getUserChannels(env, uid);
        if (channels[cid]) {
          channels[cid].drive_enabled = !(channels[cid].drive_enabled !== false);
          await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
          await showSingleChannelConfig(env, chatId, uid, cid);
        }
      }
      else if (data.startsWith("ch_pick_drv_menu:")) {
        const cid = data.split(":")[1];
        const drives = await getUserDrives(env, uid);
        const dKeys = Object.keys(drives);
        if (dKeys.length === 0) {
          await sendTG(env, chatId, "⚠️ আগে Google Drive যোগ করুন:", [[{ text: "➕ ড্রাইভ যোগ করুন", callback_data: "add_drive_btn" }]]);
          return new Response("OK");
        }
        const btns = dKeys.map(did => [{ text: `📁 ${drives[did].name}`, callback_data: `set_ch_drv:${cid}:${did}` }]);
        btns.push([{ text: "🔙 পেছনে", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, "📁 ড্রাইভ সিলেক্ট করুন:", btns);
      }
      else if (data.startsWith("set_ch_drv:")) {
        const [_, cid, did] = data.split(":");
        let channels = await getUserChannels(env, uid);
        if (channels[cid]) {
          channels[cid].drive_id = did;
          channels[cid].drive_enabled = true;
          await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
          await showSingleChannelConfig(env, chatId, uid, cid);
        }
      }
      else if (data.startsWith("ch_tpls_menu:")) {
        const cid = data.split(":")[1];
        const channels = await getUserChannels(env, uid);
        const tpls = await getUserTemplates(env, uid);
        const sel = channels[cid]?.selected_tpls || [];
        const btns = Object.keys(tpls).map(tid => [{ text: `${sel.includes(tid) ? "✅" : "⬜"} ${tpls[tid].name}`, callback_data: `toggle_chtpl:${cid}:${tid}` }]);
        btns.push([{ text: "🔙 পেছনে", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, "🎨 চ্যানেল টেমপ্লেট সিলেক্ট করুন:", btns);
      }
      else if (data.startsWith("toggle_chtpl:")) {
        const [_, cid, tid] = data.split(":");
        let channels = await getUserChannels(env, uid);
        let sel = channels[cid].selected_tpls || [];
        sel = sel.includes(tid) ? sel.filter(x => x !== tid) : [...sel, tid];
        channels[cid].selected_tpls = sel;
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showSingleChannelConfig(env, chatId, uid, cid);
      }
      else if (data.startsWith("ch_emo_menu:")) {
        const cid = data.split(":")[1];
        const btns = EMOTIONS_LIST.map(e => [{ text: e[1], callback_data: `set_chemo:${cid}:${e[0]}` }]);
        btns.push([{ text: "🔙 পেছনে", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, "🎭 Emotion বেছে নিন:", btns);
      }
      else if (data.startsWith("set_chemo:")) {
        const [_, cid, emo] = data.split(":");
        let channels = await getUserChannels(env, uid);
        channels[cid].emotion = emo;
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showSingleChannelConfig(env, chatId, uid, cid);
      }
      else if (data.startsWith("del_ch:")) {
        let channels = await getUserChannels(env, uid);
        delete channels[data.split(":")[1]];
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showChannelsMenu(env, chatId, uid);
      }
      else if (data === "menu_tts") {
        await sendTG(env, chatId, "🎙️ **ভোয়েস স্টুডিও**", [
          [{ text: "✨ Gemini Pro Voices (৩০টি)", callback_data: "tts_list_gemini:0" }],
          [{ text: "🇧🇩 Bangla Edge-TTS (২০টি)", callback_data: "tts_list_edge:0" }],
          [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
        ]);
      }
      else if (data.startsWith("tts_list_gemini") || data.startsWith("tts_list_edge")) {
        const isGemini = data.startsWith("tts_list_gemini");
        const page = parseInt(data.split(":")[1] || "0");
        const list = isGemini ? GEMINI_VOICES_LIST : EDGE_VOICES_LIST;
        const slice = list.slice(page * 10, (page + 1) * 10);
        const btns = slice.map(v => [{ text: v[1], callback_data: `tts_pick:${v[0]}` }, { text: "🎧 ডেমো", callback_data: `tts_demo:${v[0]}` }]);
        btns.push([{ text: "🔙 পেছনে", callback_data: "menu_tts" }]);
        await sendTG(env, chatId, `👇 কণ্ঠ সিলেক্ট করুন (পাতা ${page + 1}):`, btns);
      }
      else if (data.startsWith("tts_demo:")) {
        const vspec = data.replace("tts_demo:", "");
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        await triggerGitHub(env, "execute", { task_id: "demo_" + Date.now().toString().slice(-5), job_mode: "tts_only", tts_text: "আসসালামু আলাইকুম! ভয়েস ডেমো টেস্ট।", voice_spec: vspec, user_keys: userKeys, chat_id: chatId, is_demo: true }, {}, workerUrl);
        await sendTG(env, chatId, `🎧 ডেমো তৈরি হচ্ছে...`);
      }
      else if (data.startsWith("tts_pick:")) {
        const vspec = data.replace("tts_pick:", "");
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_tts_text", voice_spec: vspec }), { expirationTtl: 900 });
        await sendTG(env, chatId, `✅ কণ্ঠ: \`${vspec}\`\nএখন টেক্সট পাঠান:`, [[{ text: "❌ বাতিল", callback_data: "main_menu" }]]);
      }
      else if (data === "menu_templates") {
        const tpls = await getUserTemplates(env, uid);
        const btns = Object.keys(tpls).map(tid => [{ text: `🎨 ${tpls[tid].name}`, callback_data: `view_tpl:${tid}` }]);
        btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
        await sendTG(env, chatId, "🎨 **টেমপ্লেট লাইব্রেরি**", btns);
      }
      else if (data.startsWith("view_tpl:")) {
        const tplId = data.split(":")[1];
        const tpls = await getUserTemplates(env, uid);
        const tpl = tpls[tplId];
        await sendTG(env, chatId, `🎨 **${tpl.name}**\nস্টাইল: ${tpl.style}`, [
          [{ text: "🚀 এটি দিয়ে ভিডিও বানান", callback_data: `use_tpl_now:${tplId}` }],
          [{ text: "🗑️ ডিলিট", callback_data: `del_tpl:${tplId}` }, { text: "🔙 লিস্ট", callback_data: "menu_templates:0" }]
        ]);
      }
      else if (data.startsWith("use_tpl_now:")) {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_video_with_tpl", tpl_id: data.split(":")[1] }), { expirationTtl: 900 });
        await sendTG(env, chatId, "✍️ এই টেমপ্লেট অনুযায়ী ভিডিওর বিষয় লিখে পাঠান:");
      }
      else if (data.startsWith("del_tpl:")) {
        let tpls = await getUserTemplates(env, uid);
        delete tpls[data.split(":")[1]];
        await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(tpls));
        await sendTG(env, chatId, "🗑️ টেমপ্লেট ডিলিট হয়েছে!", [[{ text: "🔙 লিস্ট", callback_data: "menu_templates:0" }]]);
      }
      else if (data === "menu_pending") await showPendingTasks(env, chatId, uid);
      else if (data.startsWith("task_del:")) {
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks = tasks.filter(t => t.id !== data.split(":")[1]);
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        await showPendingTasks(env, chatId, uid);
      }
      else if (data.startsWith("confirm_job:")) {
        const [_, jobId, cid] = data.split(":");
        const draftRaw = await env.STUDIO_DB.get(`draft_${jobId}`);
        if (!draftRaw) { await sendTG(env, chatId, "⚠️ সময় শেষ।"); return new Response("OK"); }
        const draft = JSON.parse(draftRaw);
        const channels = await getUserChannels(env, uid);
        const ch = channels[cid] || Object.values(channels)[0];
        const tpls = await getUserTemplates(env, uid);
        const chosenTpl = draft.forced_tpl_id ? tpls[draft.forced_tpl_id] : Object.values(tpls)[0];
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        const taskId = "tsk_" + Date.now().toString().slice(-6);
        const payload = {
          task_id: taskId, job_mode: "video", topic: draft.topic, duration_sec: draft.duration_sec,
          template_style: chosenTpl.style, voice_spec: ch.voice || chosenTpl.voice,
          emotion: ch.emotion || "normal", user_keys: userKeys, chat_id: chatId
        };
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks.push({ id: taskId, uid, topic: draft.topic, duration_sec: draft.duration_sec, status: "running", payload });
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        await triggerGitHub(env, "execute", payload, {}, workerUrl);
        await sendTG(env, chatId, "⚙️ ভিডিও তৈরি শুরু হয়েছে! (১-২ মিনিট অপেক্ষা করুন)");
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

    const stateRaw = await env.STUDIO_DB.get(`state_${uid}`);
    if (stateRaw && text && !text.startsWith("/")) {
      const state = JSON.parse(stateRaw);
      await env.STUDIO_DB.delete(`state_${uid}`);
      if (state.mode === "awaiting_api_key") {
        let myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        myKeys.gemini = [...new Set([...myKeys.gemini, text])];
        await env.STUDIO_DB.put(`keys_${uid}`, JSON.stringify(myKeys));
        await sendTG(env, chatId, "✅ API Key সেভ হয়েছে!", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
        return new Response("OK");
      }
      if (state.mode === "awaiting_video_prompt" || state.mode === "awaiting_video_with_tpl") {
        await promptChannelConfirmation(env, uid, chatId, text, state.tpl_id);
        return new Response("OK");
      }
      if (state.mode === "awaiting_image_prompt") {
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        await triggerGitHub(env, "execute", { task_id: "img_" + Date.now().toString().slice(-6), job_mode: "image", prompt: text, user_keys: userKeys, chat_id: chatId }, {}, workerUrl);
        await sendTG(env, chatId, "🖼️ ইমেজ তৈরি হচ্ছে...");
        return new Response("OK");
      }
      if (state.mode === "awaiting_tts_text") {
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        await triggerGitHub(env, "execute", { task_id: "tts_" + Date.now().toString().slice(-6), job_mode: "tts_only", tts_text: text, voice_spec: state.voice_spec, user_keys: userKeys, chat_id: chatId }, {}, workerUrl);
        await sendTG(env, chatId, "⚙️ ভয়েস তৈরি হচ্ছে...");
        return new Response("OK");
      }
      if (state.mode === "awaiting_drive_name") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_drive_folder", drive_name: text }), { expirationTtl: 600 });
        await sendTG(env, chatId, `📁 ড্রাইভের নাম: **${text}**\nএখন **Folder ID** পেস্ট করুন:`);
        return new Response("OK");
      }
      if (state.mode === "awaiting_drive_folder") {
        let drives = await getUserDrives(env, uid);
        drives["drv_" + Date.now().toString().slice(-5)] = { name: state.drive_name, folder_id: text, creds_json: "" };
        await env.STUDIO_DB.put(`drives_${uid}`, JSON.stringify(drives));
        await showDrivesMenu(env, chatId, uid);
        return new Response("OK");
      }
      if (state.mode === "awaiting_new_channel") {
        let channels = await getUserChannels(env, uid);
        channels["ch_" + Date.now().toString().slice(-5)] = { name: text, selected_tpls: [], voice: "gemini:Puck", emotion: "normal", drive_enabled: true };
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showChannelsMenu(env, chatId, uid);
        return new Response("OK");
      }
    }

    if (text && !text.startsWith("/")) {
      await promptChannelConfirmation(env, uid, chatId, text);
      return new Response("OK");
    }

    await showMainMenu(env, chatId, uid);
    return new Response("OK");
  }
};

async function showVaultMenu(env, chatId, uid) {
  const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
  await sendTG(env, chatId, `🔐 **API Key ভল্ট**\nGemini: ${myKeys.gemini.length}টি`, [
    [{ text: "➕ Gemini API Key যোগ করুন", callback_data: "add_key_gemini" }],
    [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]
  ]);
}

async function promptChannelConfirmation(env, uid, chatId, promptText, forcedTplId = null) {
  const jobId = Date.now().toString().slice(-6);
  await env.STUDIO_DB.put(`draft_${jobId}`, JSON.stringify({ topic: promptText, duration_sec: 60, forced_tpl_id: forcedTplId }), { expirationTtl: 1800 });
  await sendTG(env, chatId, `🎬 **বিষয়:** ${promptText}\nচ্যানেল সিলেক্ট করুন:`, [
    [{ text: "📺 মেইন চ্যানেল (Default)", callback_data: `confirm_job:${jobId}:ch_default` }],
    [{ text: "❌ বাতিল", callback_data: "main_menu" }]
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
  const btns = Object.keys(drives).map(did => [{ text: `📁 ${drives[did].name}`, callback_data: "noop" }, { text: "🗑️ ডিলিট", callback_data: `del_drive:${did}` }]);
  btns.push([{ text: "➕ নতুন Google Drive যোগ করুন", callback_data: "add_drive_btn" }], [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, `📁 **Google Drive ম্যানেজার (${Object.keys(drives).length}টি)**`, btns);
}

async function showChannelsMenu(env, chatId, uid) {
  const channels = await getUserChannels(env, uid);
  const btns = Object.keys(channels).map(cid => [{ text: `📺 ${channels[cid].name}`, callback_data: `cfg_ch:${cid}` }]);
  btns.push([{ text: "➕ নতুন চ্যানেল", callback_data: "add_channel_btn" }], [{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, "📺 **কাস্টম চ্যানেল ম্যানেজার**", btns);
}

async function showSingleChannelConfig(env, chatId, uid, cid) {
  const channels = await getUserChannels(env, uid);
  const ch = channels[cid];
  await sendTG(env, chatId, `⚙️ **${ch.name}**\n• Emotion: \`${ch.emotion || "normal"}\``, [
    [{ text: `🎭 Emotion (${ch.emotion || "normal"})`, callback_data: `ch_emo_menu:${cid}` }],
    [{ text: "🗑️ চ্যানেল ডিলিট", callback_data: `del_ch:${cid}` }],
    [{ text: "🔙 চ্যানেল লিস্ট", callback_data: "menu_channels" }]
  ]);
}

async function showPendingTasks(env, chatId, uid) {
  const tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]").filter(t => String(t.uid) === uid);
  const btns = tasks.map(t => [{ text: `⚙️ ${t.topic.slice(0, 20)}`, callback_data: "noop" }, { text: "🗑️ Delete", callback_data: `task_del:${t.id}` }]);
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, `⏳ **পেন্ডিং টাস্ক (${tasks.length}টি):**`, btns);
}

async function exportUserBackup(env, chatId, uid) {
  const backupData = { exported_at: new Date().toISOString(), uid, drives: await getUserDrives(env, uid), channels: await getUserChannels(env, uid), templates: await getUserTemplates(env, uid) };
  await sendTGDocument(env, chatId, `studio_backup_${uid}.json`, JSON.stringify(backupData, null, 2));
}

async function triggerGitHub(env, actionType, payloadObj = {}, extraObj = {}, workerUrl = "") {
  if (!env.GH_TOKEN || !env.GH_USER || !env.GH_REPO) return { ok: false, error: "GH settings missing!" };
  const res = await fetch(`https://api.github.com/repos/${env.GH_USER}/${env.GH_REPO}/actions/workflows/studio.yml/dispatches`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.GH_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "CF-Worker", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", inputs: { action_type: actionType, job_payload: JSON.stringify({ ...payloadObj, bot_token: env.TG_BOT_TOKEN, worker_url: workerUrl }), extra_json: JSON.stringify({ ...extraObj, bot_token: env.TG_BOT_TOKEN }) } })
  });
  return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
}

async function sendTGDocument(env, chatId, filename, textContent) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([textContent], { type: "text/plain" }), filename);
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendDocument`, { method: "POST", body: form });
}

async function showMainMenu(env, chatId, uid) {
  const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
  await sendTG(env, chatId, "🏢 **AI Studio Pro — ফুল কন্ট্রোল প্যানেল**", [
    [{ text: "🎬 নতুন AI ভিডিও", callback_data: "menu_create_video" }, { text: "🖼️ নতুন AI ইমেজ", callback_data: "menu_create_image" }],
    [{ text: "🎙️ ভয়েস স্টুডিও", callback_data: "menu_tts" }, { text: "🎨 টেমপ্লেট লাইব্রেরি", callback_data: "menu_templates:0" }],
    [{ text: `🔐 API Key ভল্ট (${myKeys.gemini.length}টি)`, callback_data: "menu_vault" }, { text: "📁 Google Drive", callback_data: "menu_drives" }],
    [{ text: "📺 চ্যানেল", callback_data: "menu_channels" }, { text: "⏳ Pending Tasks", callback_data: "menu_pending" }],
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
