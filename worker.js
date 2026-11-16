// AI Studio Pro V10 - Multi-Google Drive Manager (Named Drives + Smart 1-Drive Auto-Select + Per-Channel ON/OFF Toggle)
const DEFAULT_TPLS = {
  tpl_islamic: { name: "ইসলামিক গল্প (2D)", duration_sec: 60, style: "Golden & emerald 2D vector Islamic calligraphy", voice: "edge:v2_boy_story", preview_file_id: null },
  tpl_cartoon: { name: "২ডি কার্টুন (Kids)", duration_sec: 60, style: "Colorful 2D vector cartoon characters", voice: "edge:v7_girl_cartoon", preview_file_id: null },
  tpl_3d_tech: { name: "৩ডি টেক মোশন", duration_sec: 60, style: "Sleek 3D dark cyber neon cards", voice: "gemini:Puck", preview_file_id: null }
};

const EDGE_VOICES_LIST = [
  ["edge:v1_boy_deep", "১. ছেলে - গম্ভীর ও ভরাট"], ["edge:v2_boy_story", "২. ছেলে - গল্পকার ও আবেগী"],
  ["edge:v3_boy_energetic", "৩. ছেলে - দ্রুত ও উত্তেজনাপূর্ণ"], ["edge:v4_boy_calm", "৪. ছেলে - শান্ত ও মোটিভেশনাল"],
  ["edge:v5_boy_kolkata", "৫. ছেলে - স্মার্ট স্টাইল"], ["edge:v6_girl_sweet", "৬. মেয়ে - মিষ্টি ও স্বাভাবিক"],
  ["edge:v7_girl_cartoon", "৭. মেয়ে - কার্টুন ও প্রাণবন্ত"], ["edge:v8_girl_emotional", "৮. মেয়ে - দুঃখ ও আবেগী"],
  ["edge:v9_girl_news", "৯. মেয়ে - স্মার্ট প্রেজেন্টার"], ["edge:v10_girl_kolkata", "১০. মেয়ে - আধুনিক স্টাইল"]
];

const GEMINI_VOICES_LIST = [
  ["gemini:Puck", "✨ Gemini - Puck (Male)"], ["gemini:Charon", "✨ Gemini - Charon (Deep Male)"],
  ["gemini:Kore", "✨ Gemini - Kore (Female)"], ["gemini:Fenrir", "✨ Gemini - Fenrir (Strong Male)"],
  ["gemini:Aoede", "✨ Gemini - Aoede (Melodic Female)"], ["gemini:Zephyr", "✨ Gemini - Zephyr (Calm)"]
];

async function registerSlashCommands(env) {
  const commands = [
    { command: "start", description: "🏠 মেইন কন্ট্রোল প্যানেল খুলুন" },
    { command: "drives", description: "📁 একাধিক Google Drive যোগ ও ম্যানেজ করুন" },
    { command: "channels", description: "📺 কাস্টম চ্যানেল, ভয়েস, টেমপ্লেট ও ড্রাইভ সেট" },
    { command: "templates", description: "🎨 আনলিমিটেড টেমপ্লেট (Generate Again সহ)" },
    { command: "tts", description: "🎙️ Text-to-Speech (Voice Note স্টুডিও)" },
    { command: "pending", description: "⏳ চলমান টাস্ক (Stop/Resume/Delete)" },
    { command: "vault", description: "🔐 আনলিমিটেড API ভল্ট স্ট্যাটাস" },
    { command: "backup", description: "💾 সম্পূর্ণ ডাটাবেজ ব্যাকআপ JSON ডাউনলোড" },
    { command: "restart", description: "🔄 বট রিস্টার্ট ও মেনু রিফ্রেশ" },
    { command: "cancel", description: "❌ চলমান ইনপুট বাতিল করুন" },
    { command: "help", description: "📖 সব ফাংশনের বর্ণনা ও কপি কমান্ড" },
    { command: "claim_admin", description: "👑 প্রথমবার Super Admin ক্লেইম করুন" }
  ];
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setMyCommands`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commands })
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AI Studio Pro V10 Online");
    const update = await request.json();

    if (update.internal_alert) {
      let alerts = JSON.parse((await env.STUDIO_DB.get("active_alerts")) || "[]");
      const alertId = "alt_" + Date.now();
      alerts.push({ id: alertId, chat_id: update.chat_id, message: update.message, last_sent: Date.now() });
      await env.STUDIO_DB.put("active_alerts", JSON.stringify(alerts));
      await sendTG(env, update.chat_id, `🚨 **জরুরি সমস্যা!**

${update.message}

*(বাটনে ক্লিক না করা পর্যন্ত প্রতি ঘণ্টায় রিমাইন্ডার যাবে)*`, [
        [{ text: "✅ ঠিক আছে, দেখেছি (Stop Reminder)", callback_data: `ack_alert:${alertId}` }]
      ]);
      return new Response("ALERT_LOGGED");
    }
    if (update.internal_tpl_update) {
      let tpls = await getUserTemplates(env, update.uid);
      if (tpls[update.tpl_id]) {
        tpls[update.tpl_id].preview_file_id = update.file_id;
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
      const msgId = cq.message.message_id;
      const data = cq.data;

      if (data === "menu_help") await sendHelpMenu(env, chatId);
      else if (data === "main_menu") await showMainMenu(env, chatId, uid);
      else if (data === "cmd_cancel") {
        await env.STUDIO_DB.delete(`state_${uid}`);
        await env.STUDIO_DB.delete(`pending_tpl_vid_${uid}`);
        await sendTG(env, chatId, "❌ চলমান ইনপুট বাতিল করা হয়েছে।", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      }
      else if (data === "cmd_restart") {
        await env.STUDIO_DB.delete(`state_${uid}`);
        await registerSlashCommands(env);
        await sendTG(env, chatId, "🔄 বট সফলভাবে **Restart** হয়েছে!");
        await showMainMenu(env, chatId, uid);
      }
      else if (data === "menu_backup") {
        await exportUserBackup(env, chatId, uid);
      }

      // ১. একাধিক Google Drive ম্যানেজার (নাম দিয়ে যোগ করা ও ডিলিট)
      else if (data === "menu_drives") {
        await showDrivesMenu(env, chatId, uid);
      }
      else if (data === "add_drive_btn") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_drive_name" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "✍️ নতুন Google Drive-টির একটি নাম লিখে পাঠান (যেমন: `Main Drive 1` বা `Islamic Drive`):");
      }
      else if (data.startsWith("del_drive:")) {
        const did = data.split(":")[1];
        let drives = await getUserDrives(env, uid);
        delete drives[did];
        await env.STUDIO_DB.put(`drives_${uid}`, JSON.stringify(drives));
        await sendTG(env, chatId, "🗑️ Google Drive-টি লিস্ট থেকে ডিলিট করা হয়েছে!");
        await showDrivesMenu(env, chatId, uid);
      }

      // ২. কাস্টম চ্যানেল ম্যানেজার (Drive ON/OFF + Drive Selector + Voice + Multi-Templates)
      else if (data === "menu_channels") {
        await showChannelsMenu(env, chatId, uid);
      }
      else if (data === "add_channel_btn") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_new_channel" }), { expirationTtl: 600 });
        await sendTG(env, chatId, "✍️ নতুন চ্যানেলের নাম লিখে পাঠান (যেমন: `Islamic Bangla TV` বা `Tech Shorts`):");
      }
      else if (data.startsWith("cfg_ch:")) {
        const cid = data.split(":")[1];
        await showSingleChannelConfig(env, chatId, uid, cid);
      }
      // যেকোনো সময় চ্যানেলের Drive Upload ON বা OFF করা
      else if (data.startsWith("toggle_ch_drv:")) {
        const cid = data.split(":")[1];
        let channels = await getUserChannels(env, uid);
        if (channels[cid]) {
          channels[cid].drive_enabled = !(channels[cid].drive_enabled !== false);
          await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
          await showSingleChannelConfig(env, chatId, uid, cid);
        }
      }
      // চ্যানেলের জন্য নির্দিষ্ট Google Drive সিলেক্ট করার মেনু
      else if (data.startsWith("ch_pick_drv_menu:")) {
        const cid = data.split(":")[1];
        const drives = await getUserDrives(env, uid);
        const channels = await getUserChannels(env, uid);
        const curDid = channels[cid]?.drive_id || "";
        const dKeys = Object.keys(drives);

        if (dKeys.length === 0) {
          await sendTG(env, chatId, "⚠️ এখনো কোনো Google Drive যোগ করা হয়নি! আগে নিচের বাটনে চাপ দিয়ে ড্রাইভ যোগ করুন:", [
            [{ text: "➕ নতুন Google Drive যোগ করুন", callback_data: "add_drive_btn" }],
            [{ text: "🔙 পেছনে", callback_data: `cfg_ch:${cid}` }]
          ]);
          return new Response("OK");
        }

        const btns = dKeys.map(did => [{
          text: `${curDid === did || dKeys.length === 1 ? "✅" : "⬜"} 📁 ${drives[did].name}`,
          callback_data: `set_ch_drv:${cid}:${did}`
        }]);
        btns.push([{ text: "➕ আরও নতুন ড্রাইভ যোগ করুন", callback_data: "add_drive_btn" }]);
        btns.push([{ text: "🔙 চ্যানেল সেটিংস", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, "📁 এই চ্যানেলের ভিডিওগুলো কোন Google Drive-এ আপলোড হবে তা সিলেক্ট করুন:", btns);
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
        const btns = Object.keys(tpls).map(tid => [{
          text: `${sel.includes(tid) ? "✅" : "⬜"} ${tpls[tid].name}`,
          callback_data: `toggle_chtpl:${cid}:${tid}`
        }]);
        btns.push([{ text: `🔄 সব টেমপ্লেট অটো রোটেট (${sel.length === 0 ? "চালু ✅" : "বন্ধ"})`, callback_data: `clear_chtpl:${cid}` }]);
        btns.push([{ text: "🔙 চ্যানেল সেটিংস", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, `🎨 **${channels[cid].name} — ডিফল্ট টেমপ্লেট সিলেকশন:**`, btns);
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
      else if (data.startsWith("clear_chtpl:")) {
        const cid = data.split(":")[1];
        let channels = await getUserChannels(env, uid);
        channels[cid].selected_tpls = [];
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showSingleChannelConfig(env, chatId, uid, cid);
      }
      else if (data.startsWith("ch_voice_menu:")) {
        const cid = data.split(":")[1];
        const allVoices = [...EDGE_VOICES_LIST, ...GEMINI_VOICES_LIST];
        const btns = allVoices.map(v => [{ text: v[1], callback_data: `set_chvoice:${cid}:${v[0]}` }]);
        btns.push([{ text: "🔙 চ্যানেল সেটিংস", callback_data: `cfg_ch:${cid}` }]);
        await sendTG(env, chatId, "🎙️ এই চ্যানেলের জন্য ডিফল্ট ভয়েস সিলেক্ট করুন:", btns);
      }
      else if (data.startsWith("set_chvoice:")) {
        const parts = data.split(":");
        const cid = parts[1];
        const vspec = parts[2] + ":" + parts[3];
        let channels = await getUserChannels(env, uid);
        channels[cid].voice = vspec;
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await showSingleChannelConfig(env, chatId, uid, cid);
      }
      else if (data.startsWith("del_ch:")) {
        const cid = data.split(":")[1];
        let channels = await getUserChannels(env, uid);
        delete channels[cid];
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await sendTG(env, chatId, "🗑️ চ্যানেলটি ডিলিট করা হয়েছে!");
        await showChannelsMenu(env, chatId, uid);
      }

      // ৩. TTS স্টুডিও
      else if (data === "menu_tts") {
        await sendTG(env, chatId, "🎙️ **Text-to-Speech (Voice Note স্টুডিও)**\nইঞ্জিন বেছে নিন:", [
          [{ text: "🇧🇩 Bangla Edge-TTS (১০টি কণ্ঠ)", callback_data: "tts_list_edge" }],
          [{ text: "✨ Gemini Pro Voices (Real AI)", callback_data: "tts_list_gemini" }],
          [{ text: "🔙 মেইন মেনু", callback_data: "main_menu" }]
        ]);
      }

      }
      else if (data === "tts_list_edge" || data === "tts_list_gemini") {
        const list = data === "tts_list_edge" ? EDGE_VOICES_LIST : GEMINI_VOICES_LIST;
        const btns = list.map(v => [{ text: v[1], callback_data: `tts_pick:${v[0]}` }]);
        btns.push([{ text: "🔙 পেছনে", callback_data: "menu_tts" }]);
        await sendTG(env, chatId, "👇 কণ্ঠ সিলেক্ট করুন:", btns);
      }

      else if (data.startsWith("tts_pick:")) {
        const vspec = data.replace("tts_pick:", "");
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_tts_text", voice_spec: vspec }), { expirationTtl: 900 });
        await sendTG(env, chatId, `✅ কণ্ঠ সিলেক্ট হয়েছে: \`${vspec}\`

এখন যে লেখাটি চ্যাট Voice Note বানাতে চান তা লিখে পাঠান:`);
      }
      else if (data.startsWith("get_tts_mp3:")) {
        const voiceFileId = cq.message.voice.file_id;
        const fileInfo = await (await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${voiceFileId}`)).json();
        const audioData = await (await fetch(`https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fileInfo.result.file_path}`)).arrayBuffer();
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append("document", new Blob([audioData], { type: "audio/mpeg" }), `Voice_${msgId}.mp3`);
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendDocument`, { method: "POST", body: form });
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, "get_tts_mp3:", "🎵 MP3 Sent ✅");
      }
      else if (data.startsWith("get_tts_json:") || data.startsWith("get_tts_srt:")) {
        const isJson = data.startsWith("get_tts_json:");
        const savedText = (await env.STUDIO_DB.get(`last_tts_text_${uid}`)) || "Sample Text";
        const content = isJson ? JSON.stringify({ text: savedText }, null, 2) : `1\n00:00:00,000 --> 00:00:05,000\n${savedText}\n`;
        await sendTGDocument(env, chatId, isJson ? "voice_data.json" : "subtitles.srt", content);
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, isJson ? "get_tts_json:" : "get_tts_srt:", isJson ? "📄 JSON Sent ✅" : "📝 SRT Sent ✅");
      }
      else if (data.startsWith("drv_voice:")) {
        const activeDrv = await resolveChannelDrive(env, uid, null);
        await triggerGitHub(env, "save_to_drive", {}, { file_id: cq.message.voice.file_id, chat_id: chatId, file_name: `Voice_${msgId}.ogg`, drive_cfg: activeDrv });
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, "drv_voice:", "📥 Saved to Drive ✅");
      }

      // ৪. টেমপ্লেট লাইব্রেরি ও Generate Again
      else if (data.startsWith("menu_templates")) {
        const page = parseInt(data.split(":")[1] || "0");
        const tpls = await getUserTemplates(env, uid);
        const allKeys = Object.keys(tpls);
        const slice = allKeys.slice(page * 8, (page + 1) * 8);
        const btns = slice.map(k => [
          { text: `🎬 ${tpls[k].name}`, callback_data: `view_tpl:${k}` },
          { text: "🗑️ ডিলিট", callback_data: `del_tpl:${k}` }
        ]);
        const nav = [];
        if (page > 0) nav.push({ text: "⬅️ আগের পাতা", callback_data: `menu_templates:${page - 1}` });
        if ((page + 1) * 8 < allKeys.length) nav.push({ text: "পরের পাতা ➡️", callback_data: `menu_templates:${page + 1}` });
        if (nav.length) btns.push(nav);
        btns.push([{ text: "🔙 মেইন মেনু", callback_data: "main_menu" }]);
        await sendTG(env, chatId, `🎨 **আনলিমিটেড টেমপ্লেট লাইব্রেরি** (মোট: ${allKeys.length}টি)`, btns);
      }
      else if (data.startsWith("view_tpl:")) {
        const tplId = data.split(":")[1];
        const tpls = await getUserTemplates(env, uid);
        const tpl = tpls[tplId];
        if (!tpl) return new Response("OK");
        const curSec = tpl.duration_sec || 60;
        const btns = [
          [{ text: "🔄 Generate Again (নতুন সময়ে বানিয়ে সেভ করুন)", callback_data: `regen_tpl_menu:${tplId}` }],
          [{ text: "🗑️ টেমপ্লেট ডিলিট করো", callback_data: `del_tpl:${tplId}` }],
          [{ text: "🔙 টেমপ্লেট লিস্ট", callback_data: "menu_templates:0" }]
        ];
        const cap = `🎨 **${tpl.name}**
⏱️ সেভ করা সময়: **${Math.round(curSec / 60)} মিনিট (${curSec}s)**
🎙️ ভয়েস: \`${tpl.voice}\``;
        if (tpl.preview_file_id) {
          await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendVideo`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, video: tpl.preview_file_id, caption: cap, parse_mode: "Markdown", reply_markup: { inline_keyboard: btns } })
          });
        } else {
          await sendTG(env, chatId, cap + `
📌 স্টাইল: ${tpl.style}`, btns);
        }
      }
      else if (data.startsWith("regen_tpl_menu:")) {
        const tplId = data.split(":")[1];
        await sendTG(env, chatId, "⏱️ এই টেমপ্লেটটি কত মিনিটের জন্য নতুন করে জেনারেট করে সেভ করতে চান?", [
          [{ text: "⏱️ ১ মিনিট (60s)", callback_data: `regen_run:${tplId}:60` }, { text: "⏱️ ২ মিনিট (120s)", callback_data: `regen_run:${tplId}:120` }],
          [{ text: "⏱️ ৩ মিনিট (180s)", callback_data: `regen_run:${tplId}:180` }, { text: "⏱️ ৫ মিনিট (300s)", callback_data: `regen_run:${tplId}:300` }],
          [{ text: "✍️ কাস্টম সময় লিখুন", callback_data: `regen_custom:${tplId}` }],
          [{ text: "🔙 পেছনে", callback_data: `view_tpl:${tplId}` }]
        ]);
      }
      else if (data.startsWith("regen_custom:")) {
        const tplId = data.split(":")[1];
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_regen_dur", tpl_id: tplId }), { expirationTtl: 600 });
        await sendTG(env, chatId, "✍️ কাস্টম সময় লিখে পাঠান (যেমন: `3 মিনিট` বা `150 সেকেন্ড`):");
      }
      else if (data.startsWith("regen_run:")) {
        const [_, tplId, secStr] = data.split(":");
        await startTemplateRegen(env, uid, chatId, tplId, parseInt(secStr));
      }
      else if (data.startsWith("del_tpl:")) {
        const tplId = data.split(":")[1];
        let tpls = await getUserTemplates(env, uid);
        delete tpls[tplId];
        await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(tpls));
        await sendTG(env, chatId, "🗑️ টেমপ্লেটটি ডিলিট করা হয়েছে!");
      }

      // ৫. Pending Tasks
      else if (data === "menu_pending") await showPendingTasks(env, chatId, uid);
      else if (data.startsWith("task_stop:")) {
        const tid = data.split(":")[1];
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks = tasks.map(t => t.id === tid ? { ...t, status: "paused" } : t);
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        await sendTG(env, chatId, "⏸️ টাস্কটি **Stop/Pause** করা হয়েছে।");
      }
      else if (data.startsWith("task_resume:")) {
        const tid = data.split(":")[1];
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        const target = tasks.find(t => t.id === tid);
        if (target) {
          target.status = "running";
          await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
          await triggerGitHub(env, "execute", target.payload);
          await sendTG(env, chatId, "▶️ টাস্কটি পুনরায় **Resume** করা হয়েছে!");
        }
      }
      else if (data.startsWith("task_del:")) {
        const tid = data.split(":")[1];
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks = tasks.filter(t => t.id !== tid);
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));
        await sendTG(env, chatId, "🗑️ টাস্কটি ডিলিট করা হয়েছে!");
      }

      // ৬. কনফার্মেশন থেকে চ্যানেল সিলেক্ট করে রেন্ডার শুরু
      else if (data.startsWith("confirm_job:")) {
        const [_, jobId, cid] = data.split(":");
        const draftRaw = await env.STUDIO_DB.get(`draft_${jobId}`);
        if (!draftRaw) {
          await sendTG(env, chatId, "⚠️ ড্রাফটটির সময় শেষ, আবার লিখুন।");
          return new Response("OK");
        }
        const draft = JSON.parse(draftRaw);
        const channels = await getUserChannels(env, uid);
        const ch = channels[cid] || Object.values(channels)[0];
        const tpls = await getUserTemplates(env, uid);

        const pool = (ch.selected_tpls && ch.selected_tpls.length > 0) ? ch.selected_tpls : Object.keys(tpls);
        const chosenTpl = tpls[pool[Math.floor(Math.random() * pool.length)]] || Object.values(DEFAULT_TPLS)[0];
        const activeDrive = await resolveChannelDrive(env, uid, ch);

        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        const taskId = "tsk_" + Date.now().toString().slice(-6);
        const payload = {
          task_id: taskId,
          job_mode: "video",
          topic: draft.topic,
          duration_sec: draft.duration_sec,
          template_style: `${chosenTpl.style}. User Custom Notes: ${draft.topic}`,
          voice_spec: ch.voice || chosenTpl.voice,
          drive_enabled: ch.drive_enabled !== false,
          drive_cfg: activeDrive,
          user_keys: userKeys,
          chat_id: chatId
        };
        let tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
        tasks.push({ id: taskId, uid: uid, topic: draft.topic, duration_sec: draft.duration_sec, status: "running", payload: payload });
        await env.STUDIO_DB.put("pending_tasks", JSON.stringify(tasks));

        await triggerGitHub(env, "execute", payload);
        await sendTG(env, chatId, `⚙️ **কাজটি চলছে...**
📺 চ্যানেল: **${ch.name}**
📁 Drive: **${ch.drive_enabled !== false ? activeDrive.name + " (ON ✅)" : "OFF ❌"}**
🎨 টেমপ্লেট: **${chosenTpl.name}**`, [
          [{ text: "⏳ Pending Tasks দেখুন", callback_data: "menu_pending" }]
        ]);
      }
      else if (data.startsWith("drv_save:")) {
        const activeDrive = await resolveChannelDrive(env, uid, null);
        await triggerGitHub(env, "save_to_drive", {}, { file_id: cq.message.video.file_id, chat_id: chatId, file_name: `Video_${msgId}.mp4`, drive_cfg: activeDrive });
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, "drv_save:", "📥 Saved to Drive ✅");
      }
      else if (data.startsWith("drv_skip:")) {
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, "drv_skip:", "🚫 Kept in TG Only ✅");
      }
      else if (data.startsWith("del_24h:")) {
        let delQueue = JSON.parse((await env.STUDIO_DB.get("delete_queue")) || "[]");
        delQueue.push({ chat_id: chatId, message_id: msgId, delete_at: Date.now() + 24 * 3600 * 1000 });
        await env.STUDIO_DB.put("delete_queue", JSON.stringify(delQueue));
        await updateButtonStatus(env, chatId, msgId, cq.message.reply_markup.inline_keyboard, "del_24h:", "⏳ 24h Timer ON ✅");
      }
      else if (data.startsWith("del_now:")) {
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/deleteMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, message_id: msgId })
        });
      }
      else if (data.startsWith("save_tpl:")) {
        await env.STUDIO_DB.put(`pending_tpl_vid_${uid}`, cq.message.video.file_id, { expirationTtl: 600 });
        await sendTG(env, chatId, "⭐ নতুন মাস্টার টেমপ্লেটের একটি নাম লিখে পাঠান:");
      }
      else if (data.startsWith("ack_alert:")) {
        const aid = data.split(":")[1];
        let alerts = JSON.parse((await env.STUDIO_DB.get("active_alerts")) || "[]");
        alerts = alerts.filter(a => a.id !== aid);
        await env.STUDIO_DB.put("active_alerts", JSON.stringify(alerts));
        await sendTG(env, chatId, "✅ অ্যালার্ট রিমাইন্ডার বন্ধ করা হয়েছে।");
      }
      return new Response("OK");
    }

    const msg = update.message;

    // মেসেজ ও স্ল্যাশ (/) কমান্ড হ্যান্ডলার
    const msg = update.message;
    if (!msg) return new Response("OK");
    const uid = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/claim_admin") {
      const existingAdmin = await env.STUDIO_DB.get("super_admin_uid");
      if (existingAdmin) {
        await sendTG(env, chatId, existingAdmin === uid ? "👑 আপনি ইতিমধ্যেই Super Admin!" : "⛔ Super Admin ইতিমধ্যে ক্লেইম করা হয়ে গেছে।");
        return new Response("OK");
      }
      await env.STUDIO_DB.put("super_admin_uid", uid);
      await env.STUDIO_DB.put(`user_${uid}`, JSON.stringify({ role: "super_admin", daily_limit: 999999, used_today: 0, engine_mode: "only_gemini" }));
      await registerSlashCommands(env);
      await sendTG(env, chatId, `🎉 **অভিনন্দন! আপনি সফলভাবে Super Admin ক্লেইম করেছেন!**
👑 Admin ID: \`${uid}\``, [
        [{ text: "📁 Google Drive যোগ করুন", callback_data: "menu_drives" }],
        [{ text: "🏠 মেইন ড্যাশবোর্ড", callback_data: "main_menu" }]
      ]);
      return new Response("OK");
    }

    let profile = JSON.parse((await env.STUDIO_DB.get(`user_${uid}`)) || "null");
    if (!profile) {
      const adminUid = await env.STUDIO_DB.get("super_admin_uid");
      await sendTG(env, chatId, !adminUid ? "👋 প্রথমে এডমিন হতে কমান্ড দিন:
`/claim_admin`" : `⛔ অনুমোদিত নয়। আপনার ID: \`${uid}\``);
      return new Response("OK");
    }

    if (text === "/cancel") {
      await env.STUDIO_DB.delete(`state_${uid}`);
      await env.STUDIO_DB.delete(`pending_tpl_vid_${uid}`);
      await sendTG(env, chatId, "❌ চলমান সব ইনপুট বাতিল করা হয়েছে।", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
      return new Response("OK");
    }
    if (text === "/restart") {
      await env.STUDIO_DB.delete(`state_${uid}`);
      await registerSlashCommands(env);
      await sendTG(env, chatId, "🔄 **বট Restart হয়েছে!**");
      await showMainMenu(env, chatId, uid);
      return new Response("OK");
    }
    if (text === "/help") { await sendHelpMenu(env, chatId); return new Response("OK"); }
    if (text === "/drives") { await showDrivesMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/channels") { await showChannelsMenu(env, chatId, uid); return new Response("OK"); }
    if (text === "/backup") { await exportUserBackup(env, chatId, uid); return new Response("OK"); }
    if (text === "/pending") { await showPendingTasks(env, chatId, uid); return new Response("OK"); }
    if (text === "/tts") {
      await sendTG(env, chatId, "🎙️ **Text-to-Speech (Voice Note স্টুডিও)**", [
        [{ text: "🇧🇩 Bangla Edge-TTS (১০টি কণ্ঠ)", callback_data: "tts_list_edge" }],
        [{ text: "✨ Gemini Pro Voices (Real AI)", callback_data: "tts_list_gemini" }]
      ]);
      return new Response("OK");
    }
    if (text === "/templates") {
      const tpls = await getUserTemplates(env, uid);
      const btns = Object.keys(tpls).slice(0, 8).map(k => [{ text: `🎬 ${tpls[k].name}`, callback_data: `view_tpl:${k}` }, { text: "🗑️ ডিলিট", callback_data: `del_tpl:${k}` }]);
      await sendTG(env, chatId, `🎨 **টেমপ্লেট লাইব্রেরি** (মোট: ${Object.keys(tpls).length}টি):`, btns);
      return new Response("OK");
    }
    if (text === "/vault") {
      const myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
      await sendTG(env, chatId, `🔐 **API ভল্ট**
🟢 Gemini: \`${(myKeys.gemini || []).length}টি\` | 🟣 Claude: \`${(myKeys.claude || []).length}টি\``);
      return new Response("OK");
    }

    // ইনপুট স্টেট হ্যান্ডলার (মাল্টি-ড্রাইভ নাম -> ফোল্ডার ID -> JSON ক্রেডেনশিয়াল)
    const pendingVid = await env.STUDIO_DB.get(`pending_tpl_vid_${uid}`);
    if (pendingVid && text && !text.startsWith("/")) {
      let tpls = await getUserTemplates(env, uid);
      const newId = "tpl_" + Date.now();
      tpls[newId] = { name: text, duration_sec: 60, style: "Saved Master Style", voice: "edge:v2_boy_story", preview_file_id: pendingVid };
      await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(tpls));
      await env.STUDIO_DB.delete(`pending_tpl_vid_${uid}`);
      await sendTG(env, chatId, `✅ '${text}' টেমপ্লেট লাইব্রেরিতে সেভ হয়েছে!`);
      return new Response("OK");
    }

    const stateRaw = await env.STUDIO_DB.get(`state_${uid}`);
    if (stateRaw && text && !text.startsWith("/")) {
      const state = JSON.parse(stateRaw);
      await env.STUDIO_DB.delete(`state_${uid}`);

      // ধাপ ১: নতুন Google Drive-এর নাম নেওয়া
      if (state.mode === "awaiting_drive_name") {
        await env.STUDIO_DB.put(`state_${uid}`, JSON.stringify({ mode: "awaiting_drive_folder", drive_name: text }), { expirationTtl: 600 });
        await sendTG(env, chatId, `📁 ড্রাইভের নাম: **${text}**

এখন এই Google Drive-এর **Folder ID** পেস্ট করে পাঠান:`);
        return new Response("OK");
      }
      // ধাপ ২: Google Drive Folder ID নেওয়া ও সেভ করা (১টি থাকলে অটো সব চ্যানেলে সিলেক্ট হবে)
      if (state.mode === "awaiting_drive_folder") {
        let drives = await getUserDrives(env, uid);
        const newDid = "drv_" + Date.now().toString().slice(-5);
        drives[newDid] = { name: state.drive_name, folder_id: text, creds_json: "" };
        await env.STUDIO_DB.put(`drives_${uid}`, JSON.stringify(drives));

        // যদি এটি প্রথম ড্রাইভ হয় (মোট ১টি), তবে সব চ্যানেলে অটোমেটিক সিলেক্ট করে দেওয়া
        if (Object.keys(drives).length === 1) {
          let channels = await getUserChannels(env, uid);
          for (let cid of Object.keys(channels)) {
            channels[cid].drive_id = newDid;
            channels[cid].drive_enabled = true;
          }
          await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        }

        await sendTG(env, chatId, `✅ Google Drive **'${state.drive_name}'** সফলভাবে যুক্ত হয়েছে!${Object.keys(drives).length === 1 ? "
*(মাত্র ১টি ড্রাইভ থাকায় সব চ্যানেলে অটো-সিলেক্ট করা হয়েছে)*" : ""}`);
        await showDrivesMenu(env, chatId, uid);
        return new Response("OK");
      }

      if (state.mode === "awaiting_new_channel") {
        let channels = await getUserChannels(env, uid);
        const drives = await getUserDrives(env, uid);
        const dKeys = Object.keys(drives);
        const autoDriveId = dKeys.length === 1 ? dKeys[0] : (dKeys[0] || "");
        const newCid = "ch_" + Date.now().toString().slice(-5);
        channels[newCid] = { name: text, selected_tpls: [], voice: "edge:v2_boy_story", drive_id: autoDriveId, drive_enabled: true };
        await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(channels));
        await sendTG(env, chatId, `✅ নতুন চ্যানেল **'${text}'** তৈরি হয়েছে!`);
        await showSingleChannelConfig(env, chatId, uid, newCid);
        return new Response("OK");
      }
      if (state.mode === "awaiting_tts_text") {
        const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
        await env.STUDIO_DB.put(`last_tts_text_${uid}`, text, { expirationTtl: 86400 });
        await triggerGitHub(env, "execute", { job_mode: "tts_only", tts_text: text, voice_spec: state.voice_spec, user_keys: userKeys, chat_id: chatId });
        await sendTG(env, chatId, "⚙️ **কাজটি চলছে...** ৩০ সেকেন্ডের মধ্যে চ্যাটে Voice Note চলে আসবে।");
        return new Response("OK");
      }
      if (state.mode === "awaiting_regen_dur") {
        let sec = 180;
        const m = text.match(/(\d+)\s*(মিনিট|min)/i);
        const s = text.match(/(\d+)\s*(সেকেন্ড|sec)/i);
        if (m) sec = parseInt(m[1]) * 60;
        else if (s) sec = parseInt(s[1]);
        else if (!isNaN(parseInt(text))) sec = parseInt(text) * 60;
        await startTemplateRegen(env, uid, chatId, state.tpl_id, sec);
        return new Response("OK");
      }
    }

    if (text.startsWith("/addkey ")) {
      const parts = text.split(" ");
      const provider = parts[1].toLowerCase();
      const list = parts.slice(2).join("").split(",").map(k => k.trim()).filter(Boolean);
      let myKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
      myKeys[provider] = [...new Set([...(myKeys[provider] || []), ...list])];
      await env.STUDIO_DB.put(`keys_${uid}`, JSON.stringify(myKeys));
      await sendTG(env, chatId, `🔐 সফল! মোট **${myKeys[provider].length}টি ${provider.toUpperCase()} Key** সেভ আছে।`);
      return new Response("OK");
    }

    if (text.startsWith("/adduser ")) {
      const [_, role, targetId, lim] = text.split(" ");
      const ok = (profile.role === "super_admin") || (profile.role === "admin" && ["manager", "user"].includes(role)) || (profile.role === "manager" && role === "user");
      if (!ok) { await sendTG(env, chatId, "❌ পারমিশন নেই!"); return new Response("OK"); }
      await env.STUDIO_DB.put(`user_${targetId}`, JSON.stringify({ role, daily_limit: parseInt(lim || "9999"), used_today: 0, engine_mode: "only_gemini", parent: uid }));
      await sendTG(env, chatId, `✅ নতুন ${role.toUpperCase()} (\`${targetId}\`) যুক্ত হয়েছে!`);
      return new Response("OK");
    }

    // কাস্টম প্রম্পট দিলে চ্যানেল সিলেক্ট করার বাটনসহ কনফার্মেশন কার্ড দেখাবে
    if ((text && !text.startsWith("/")) || msg.video || msg.photo || msg.voice) {
      const promptText = msg.caption || text || "কাস্টম ভিডিও প্রজেক্ট";
      let durationSec = 60;
      const minMatch = promptText.match(/(\d+)\s*(মিনিট|min)/i);
      const secMatch = promptText.match(/(\d+)\s*(সেকেন্ড|sec)/i);
      if (minMatch) durationSec = parseInt(minMatch[1]) * 60;
      else if (secMatch) durationSec = parseInt(secMatch[1]);

      const jobId = Date.now().toString().slice(-6);
      await env.STUDIO_DB.put(`draft_${jobId}`, JSON.stringify({ topic: promptText, duration_sec: durationSec }), { expirationTtl: 1800 });

      const channels = await getUserChannels(env, uid);
      const chBtns = Object.keys(channels).map(cid => [{
        text: `📺 ${channels[cid].name}-এর জন্য বানাও (${durationSec}s)`,
        callback_data: `confirm_job:${jobId}:${cid}`
      }]);
      chBtns.push([{ text: "❌ বাতিল করুন (/cancel)", callback_data: "cmd_cancel" }]);

      await sendTG(env, chatId, `🤔 **কোন চ্যানেলের সেটিংসে ভিডিওটি বানাবেন তা সিলেক্ট করুন:**

📌 **বিষয়:** ${promptText}
⏱️ **সময়:** ${durationSec} সেকেন্ড`, chBtns);
      return new Response("OK");
    }

    await registerSlashCommands(env);
    await showMainMenu(env, chatId, uid);
    return new Response("OK");
  }
};

// মাল্টি-ড্রাইভ হেল্পার ফাংশনসমূহ
async function getUserDrives(env, uid) {
  return JSON.parse((await env.STUDIO_DB.get(`drives_${uid}`)) || "{}");
}

async function resolveChannelDrive(env, uid, ch) {
  const drives = await getUserDrives(env, uid);
  const dKeys = Object.keys(drives);
  if (dKeys.length === 0) return { name: "Default Secret Drive", folder_id: "" };
  if (dKeys.length === 1) return drives[dKeys[0]];
  if (ch && ch.drive_id && drives[ch.drive_id]) return drives[ch.drive_id];
  return drives[dKeys[0]];
}

async function showDrivesMenu(env, chatId, uid) {
  const drives = await getUserDrives(env, uid);
  const dKeys = Object.keys(drives);
  const btns = dKeys.map(did => [
    { text: `📁 ${drives[did].name} (${drives[did].folder_id.slice(0, 10)}...)`, callback_data: "noop" },
    { text: "🗑️ ডিলিট", callback_data: `del_drive:${did}` }
  ]);
  btns.push([{ text: "➕ নতুন Google Drive যোগ করুন (নাম দিয়ে)", callback_data: "add_drive_btn" }]);
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);

  const note = dKeys.length === 1 ? "
*(মাত্র ১টি ড্রাইভ থাকায় এটি সব চ্যানেলে অটো-সিলেক্ট হয়ে আছে)*" : "";
  await sendTG(env, chatId, `📁 **মাল্টি-Google Drive ম্যানেজার (মোট: ${dKeys.length}টি)**${note}
যত খুশি তত Google Drive নাম লিখে যোগ করুন এবং প্রতিটি চ্যানেলে আলাদা সিলেক্ট করুন:`, btns);
}

async function getUserChannels(env, uid) {
  const raw = await env.STUDIO_DB.get(`channels_${uid}`);
  if (!raw) {
    const drives = await getUserDrives(env, uid);
    const dKeys = Object.keys(drives);
    const def = { ch_default: { name: "মেইন চ্যানেল (Default)", selected_tpls: [], voice: "edge:v2_boy_story", drive_id: dKeys[0] || "", drive_enabled: true } };
    await env.STUDIO_DB.put(`channels_${uid}`, JSON.stringify(def));
    return def;
  }
  return JSON.parse(raw);
}

async function showChannelsMenu(env, chatId, uid) {
  const channels = await getUserChannels(env, uid);
  const btns = Object.keys(channels).map(cid => {
    const isOn = channels[cid].drive_enabled !== false;
    return [{ text: `📺 ${channels[cid].name} [Drive: ${isOn ? "ON ✅" : "OFF ❌"}]`, callback_data: `cfg_ch:${cid}` }];
  });
  btns.push([{ text: "➕ নতুন কাস্টম চ্যানেল যোগ করুন", callback_data: "add_channel_btn" }]);
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, "📺 **কাস্টম চ্যানেল ম্যানেজার**
যেকোনো চ্যানেলে ঢুকে Google Drive পরিবর্তন বা ON/OFF, ভয়েস ও টেমপ্লেট সেট করুন:", btns);
}

async function showSingleChannelConfig(env, chatId, uid, cid) {
  const channels = await getUserChannels(env, uid);
  const ch = channels[cid];
  if (!ch) return;
  const selCount = (ch.selected_tpls || []).length;
  const isDrvOn = ch.drive_enabled !== false;
  const activeDrv = await resolveChannelDrive(env, uid, ch);

  const btns = [
    [{ text: `🔌 Drive Auto-Upload: ${isDrvOn ? "ON ✅ (বন্ধ করতে চাপুন)" : "OFF ❌ (চালু করতে চাপুন)"}`, callback_data: `toggle_ch_drv:${cid}` }],
    [{ text: `📁 সিলেক্টেড ড্রাইভ: ${activeDrv.name} (পরিবর্তন করুন)`, callback_data: `ch_pick_drv_menu:${cid}` }],
    [{ text: `🎨 ডিফল্ট টেমপ্লেট সিলেক্ট (${selCount > 0 ? selCount + "টি সিলেক্টেড" : "সব অটো রোটেট"})`, callback_data: `ch_tpls_menu:${cid}` }],
    [{ text: `🎙️ ডিফল্ট ভয়েস বদলান (${ch.voice})`, callback_data: `ch_voice_menu:${cid}` }],
    [{ text: "🗑️ চ্যানেলটি ডিলিট করুন", callback_data: `del_ch:${cid}` }],
    [{ text: "🔙 সব চ্যানেল", callback_data: "menu_channels" }]
  ];
  await sendTG(env, chatId, `⚙️ **চ্যানেল সেটিংস: ${ch.name}**
• Drive স্ট্যাটাস: **${isDrvOn ? "ON ✅" : "OFF ❌"}**
• নির্ধারিত ড্রাইভ: **${activeDrv.name}**
• ভয়েস: \`${ch.voice}\``, btns);
}

async function exportUserBackup(env, chatId, uid) {
  const backupData = {
    exported_at: new Date().toISOString(),
    uid: uid,
    profile: JSON.parse((await env.STUDIO_DB.get(`user_${uid}`)) || "{}"),
    drives: await getUserDrives(env, uid),
    channels: await getUserChannels(env, uid),
    templates: await getUserTemplates(env, uid),
    schedules: JSON.parse((await env.STUDIO_DB.get("active_schedules")) || "[]")
  };
  await sendTGDocument(env, chatId, `studio_backup_${uid}.json`, JSON.stringify(backupData, null, 2));
}

async function sendHelpMenu(env, chatId) {
  const helpText = `📖 **AI Studio Pro V10 — ফাংশন বর্ণনা ও ওয়ান-ট্যাপ কপি কমান্ড**
*(যেকোনো কমান্ডের ওপর টাচ করলেই কপি হয়ে যাবে)*

👑 **১. Super Admin ক্লেইম:** \`/claim_admin\`
🔄 **২. স্টার্ট, রিস্টার্ট ও বাতিল:** \`/start\` | \`/restart\` | \`/cancel\`
📁 **৩. একাধিক Google Drive যোগ ও ম্যানেজ:** \`/drives\`
📺 **৪. কাস্টম চ্যানেল (Drive ON/OFF, ভয়েস ও টেমপ্লেট):** \`/channels\`
🎨 **৫. টেমপ্লেট লাইব্রেরি (Generate Again সহ):** \`/templates\`
🎙️ **৬. চ্যাট Voice Note (TTS) স্টুডিও:** \`/tts\`
⏳ **৭. চলমান টাস্ক (Stop/Resume/Delete):** \`/pending\`
💾 **৮. সম্পূর্ণ ডাটাবেজ ব্যাকআপ ডাউনলোড:** \`/backup\`

🔑 **৯. আনলিমিটেড API Key যোগ (কমা দিয়ে):**
\`/addkey gemini AIzaSyKey1,AIzaSyKey2\`
\`/addkey claude sk-ant-Key1,sk-ant-Key2\`

👥 **১০. টিম মেম্বার তৈরি (Admin/Manager/User):**
\`/adduser admin 123456789 9999\`
\`/adduser manager 987654321 500\`
\`/adduser user 555666777 100\``;

  await sendTG(env, chatId, helpText, [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
}

async function startTemplateRegen(env, uid, chatId, tplId, durationSec) {
  const tpls = await getUserTemplates(env, uid);
  const tpl = tpls[tplId];
  if (!tpl) return;
  tpl.duration_sec = durationSec;
  tpls[tplId] = tpl;
  await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(tpls));

  const userKeys = JSON.parse((await env.STUDIO_DB.get(`keys_${uid}`)) || '{"gemini":[],"claude":[]}');
  const taskId = "regen_" + Date.now().toString().slice(-6);
  const payload = {
    task_id: taskId, job_mode: "video", topic: `${tpl.name} (${Math.round(durationSec / 60)} মিনিট)`,
    duration_sec: durationSec, template_style: tpl.style, voice_spec: tpl.voice,
    user_keys: userKeys, chat_id: chatId, auto_save_tpl_id: tplId, uid: uid
  };
  await triggerGitHub(env, "execute", payload);
  await sendTG(env, chatId, `⚙️ **কাজটি চলছে...**
🔄 টেমপ্লেট **'${tpl.name}'** নতুন করে **${durationSec} সেকেন্ড** হিসেবে তৈরি হয়ে এখানে স্থায়ীভাবে সেভ থাকবে!`);
}

async function showPendingTasks(env, chatId, uid) {
  const tasks = JSON.parse((await env.STUDIO_DB.get("pending_tasks")) || "[]");
  const myTasks = tasks.filter(t => String(t.uid) === uid);
  if (myTasks.length === 0) {
    await sendTG(env, chatId, "✅ এই মুহূর্তে কোনো পেন্ডিং টাস্ক নেই।", [[{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]]);
    return;
  }
  const btns = [];
  for (let t of myTasks) {
    btns.push([{ text: `${t.status === "paused" ? "⏸️ Paused" : "⚙️ Running"} | ${t.topic.slice(0, 20)} (${t.duration_sec}s)`, callback_data: "noop" }]);
    btns.push([
      t.status === "paused" ? { text: "▶️ Resume", callback_data: `task_resume:${t.id}` } : { text: "⏸️ Stop", callback_data: `task_stop:${t.id}` },
      { text: "🗑️ Delete", callback_data: `task_del:${t.id}` }
    ]);
  }
  btns.push([{ text: "🏠 মেইন মেনু", callback_data: "main_menu" }]);
  await sendTG(env, chatId, `⏳ **পেন্ডিং টাস্ক (মোট: ${myTasks.length}টি):**`, btns);
}

async function getUserTemplates(env, uid) {
  const saved = await env.STUDIO_DB.get(`tpls_${uid}`);
  if (!saved) {
    await env.STUDIO_DB.put(`tpls_${uid}`, JSON.stringify(DEFAULT_TPLS));
    return DEFAULT_TPLS;
  }
  return JSON.parse(saved);
}

async function updateButtonStatus(env, chatId, msgId, keyboard, prefix, newLabel) {
  const updated = keyboard.map(row => row.map(btn => btn.callback_data.startsWith(prefix) ? { ...btn, text: newLabel } : btn));
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageReplyMarkup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: msgId, reply_markup: { inline_keyboard: updated } })
  });
}

async function triggerGitHub(env, actionType, payloadObj = {}, extraObj = {}) {
  await fetch(`https://api.github.com/repos/${env.GH_USER}/${env.GH_REPO}/actions/workflows/studio.yml/dispatches`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.GH_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "CF-Worker" },
    body: JSON.stringify({ ref: "main", inputs: { action_type: actionType, job_payload: JSON.stringify(payloadObj), extra_json: JSON.stringify(extraObj) } })
  });
}

async function sendTGDocument(env, chatId, filename, textContent) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([textContent], { type: "text/plain" }), filename);
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendDocument`, { method: "POST", body: form });
}

async function showMainMenu(env, chatId, uid) {
  const btns = [
    [{ text: "📁 মাল্টি-Google Drive ম্যানেজার (নাম দিয়ে যোগ)", callback_data: "menu_drives" }],
    [{ text: "📺 কাস্টম চ্যানেল (Drive ON/OFF, ভয়েস ও টেমপ্লেট)", callback_data: "menu_channels" }],
    [{ text: "🎨 আনলিমিটেড টেমপ্লেট (Generate Again সহ)", callback_data: "menu_templates:0" }],
    [{ text: "🎙️ Text-to-Speech (Voice Note স্টুডিও)", callback_data: "menu_tts" }],
    [{ text: "⏳ Pending Tasks (Stop / Resume / Delete)", callback_data: "menu_pending" }],
    [{ text: "💾 ব্যাকআপ JSON", callback_data: "menu_backup" }, { text: "📖 হেল্প কমান্ড", callback_data: "menu_help" }],
    [{ text: "🔄 Restart", callback_data: "cmd_restart" }, { text: "❌ Cancel", callback_data: "cmd_cancel" }]
  ];
  await sendTG(env, chatId, `🏢 **AI Studio Pro V10 — মাস্টার কন্ট্রোল প্যানেল**

• নাম লিখে লিখে একাধিক **Google Drive** যোগ করুন এবং প্রতিটি চ্যানেলে আলাদা ড্রাইভ সিলেক্ট বা যেকোনো সময় **ON/OFF** করুন।`, btns);
}

async function sendTG(env, chatId, text, inlineKeyboard = null) {
  const payload = { chat_id: chatId, text: text, parse_mode: "Markdown" };
  if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
}
