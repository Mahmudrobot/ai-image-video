import os
import json
import time
import requests
from google import genai
from ai_router import generate_script_and_code
from voice_engine import generate_voiceover

def download_tg_file(bot_token, file_id, save_path):
    res = requests.get(f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}").json()
    file_path = res["result"]["file_path"]
    content = requests.get(f"https://api.telegram.org/file/bot{bot_token}/{file_path}").content
    with open(save_path, "wb") as f:
        f.write(content)
    return save_path

def analyze_reference_media(media_path, mime_type, user_gemini_keys):
    for key in user_gemini_keys:
        try:
            client = genai.Client(api_key=key)
            uploaded = client.files.upload(file=media_path, config={"mime_type": mime_type})
            while uploaded.state.name == "PROCESSING":
                time.sleep(2)
                uploaded = client.files.get(name=uploaded.name)
            res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[uploaded, "Analyze every frame, exact hex color palette, typography, camera zoom/pan motion, and character animation style in detail so Remotion React can replicate this exact look."]
            )
            client.files.delete(name=uploaded.name)
            return res.text
        except Exception:
            continue
    return "Modern dynamic motion graphics style"

def run():
    payload = json.loads(os.environ.get("JOB_PAYLOAD", "{}"))
    task_id = payload.get("task_id", "unknown")
    job_mode = payload.get("job_mode", "video")
    bot_token = os.environ.get("TG_BOT_TOKEN")
    user_keys = payload.get("user_keys", {})
    target_chat_id = payload.get("chat_id")
    voice_spec = payload.get("voice_spec", "edge:v2_boy_story")
    is_auto_sched = payload.get("is_auto_sched", False)

    if job_mode == "tts_only":
        raw_text = payload.get("tts_text", "")
        sentences = [s.strip() for s in raw_text.replace("।", "|").replace(".", "|").split("|") if s.strip()] or [raw_text]
        segments = [{"text": s, "emotion": "normal"} for s in sentences]
        generate_voiceover(segments, voice_spec, user_keys.get("gemini", []), "tts_output.mp3")
        with open("job_meta.json", "w", encoding="utf-8") as f:
            json.dump({"task_id": task_id, "job_mode": "tts_only", "chat_id": target_chat_id, "voice_spec": voice_spec}, f)
        return

    topic = payload.get("topic", "আধুনিক তথ্য ও গল্প")
    duration_sec = int(payload.get("duration_sec", 60))
    style = payload.get("template_style", "Modern 2D/3D motion graphics")
    engine_mode = payload.get("engine_mode", "only_gemini")
    ref_file_id = payload.get("ref_file_id")
    ref_mime = payload.get("ref_mime")

    cloned_style = ""
    if ref_file_id and user_keys.get("gemini"):
        ext = ".mp4" if "video" in (ref_mime or "") else ".jpg"
        local_ref = download_tg_file(bot_token, ref_file_id, f"ref_media{ext}")
        cloned_style = analyze_reference_media(local_ref, ref_mime, user_keys["gemini"])

    total_frames = duration_sec * 30
    short_frames = min(1350, total_frames)
    target_words = max(20, int(duration_sec * 2.2))

    prompt = f"""
    Create a complete Bengali Remotion video package on topic: '{topic}'.
    Full Video Duration: {duration_sec} seconds ({total_frames} frames at 30 FPS, 1280x720).
    Short Video Duration: 45 seconds ({short_frames} frames at 30 FPS, 720x1280 vertical).
    Target Bengali Script Length: ~{target_words} words.
    Visual Style: {style}
    Cloned Reference Blueprint: {cloned_style}
    Return ONLY valid JSON:
    {{
      "title": "SEO Bengali Title",
      "description": "SEO Bengali Description with hashtags",
      "tags": ["tag1", "tag2"],
      "segments": [{{"text": "Bengali sentence", "emotion": "normal|excited|sad"}}],
      "tsx_code": "Complete valid Remotion React file exporting MyVideo containing TWO Compositions: id='MyVideo' (1280x720, durationInFrames={{{total_frames}}}) and id='MyShort' (720x1280, durationInFrames={{{short_frames}}}), both using <Audio src={{staticFile('voice.mp3')}} />."
    }}
    """

    raw = generate_script_and_code(prompt, user_keys, engine_mode)
    data = json.loads(raw)

    generate_voiceover(data["segments"], voice_spec, user_keys.get("gemini", []))
    os.makedirs("src", exist_ok=True)
    with open("src/MyVideo.tsx", "w", encoding="utf-8") as f:
        f.write(data["tsx_code"])

    with open("job_meta.json", "w", encoding="utf-8") as f:
        json.dump({
            "task_id": task_id,
            "job_mode": "video",
            "title": data["title"],
            "description": data["description"],
            "tags": data.get("tags", []),
            "chat_id": target_chat_id,
            "duration_sec": duration_sec,
            "is_auto_sched": is_auto_sched,
            "auto_save_tpl_id": payload.get("auto_save_tpl_id"),
            "drive_enabled": payload.get("drive_enabled", True),
            "drive_cfg": payload.get("drive_cfg", {}),
            "uid": payload.get("uid"),
            "channel_cfg": payload.get("channel_cfg", {})
        }, f, ensure_ascii=False)

if __name__ == "__main__":
    run()
