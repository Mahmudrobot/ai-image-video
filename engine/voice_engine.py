import os
import asyncio
import edge_tts
from google import genai
from google.genai import types

EDGE_PRESETS = {
    "v1_boy_deep": ("bn-BD-PradeepNeural", "+5%", "-6Hz"),
    "v2_boy_story": ("bn-BD-PradeepNeural", "-3%", "+2Hz"),
    "v3_boy_energetic": ("bn-BD-PradeepNeural", "+14%", "+5Hz"),
    "v4_boy_calm": ("bn-BD-PradeepNeural", "-6%", "-3Hz"),
    "v5_boy_kolkata": ("bn-IN-BashkarNeural", "+4%", "-2Hz"),
    "v6_girl_sweet": ("bn-BD-NabanitaNeural", "+3%", "+2Hz"),
    "v7_girl_cartoon": ("bn-BD-NabanitaNeural", "+10%", "+8Hz"),
    "v8_girl_emotional": ("bn-BD-NabanitaNeural", "-5%", "-2Hz"),
    "v9_girl_news": ("bn-BD-NabanitaNeural", "+8%", "-1Hz"),
    "v10_girl_kolkata": ("bn-IN-TanishaaNeural", "+5%", "+3Hz"),
}

async def _build_edge_audio(segments, preset_key, out_path):
    voice, base_rate, base_pitch = EDGE_PRESETS.get(preset_key, EDGE_PRESETS["v2_boy_story"])
    combined = b""
    for idx, seg in enumerate(segments):
        emo = seg.get("emotion", "normal")
        rate, pitch = base_rate, base_pitch
        if emo == "excited":
            rate, pitch = "+12%", "+6Hz"
        elif emo == "sad":
            rate, pitch = "-8%", "-4Hz"
        tmp = f"tmp_seg_{idx}.mp3"
        comm = edge_tts.Communicate(seg["text"], voice, rate=rate, pitch=pitch)
        await comm.save(tmp)
        with open(tmp, "rb") as f:
            combined += f.read()
        os.remove(tmp)
    with open(out_path, "wb") as f:
        f.write(combined)

def generate_voiceover(segments, voice_spec, user_gemini_keys, out_path="public/voice.mp3"):
    os.makedirs("public", exist_ok=True)
    engine, voice_name = voice_spec.split(":") if ":" in voice_spec else ("edge", "v2_boy_story")

    if engine == "gemini" and user_gemini_keys:
        full_text = " ".join([s["text"] for s in segments])
        for key in user_gemini_keys:
            try:
                client = genai.Client(api_key=key)
                res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Read this Bengali script naturally with deep emotion: {full_text}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                            )
                        )
                    )
                )
                with open(out_path, "wb") as f:
                    f.write(res.candidates[0].content.parts[0].inline_data.data)
                return
            except Exception:
                continue

    asyncio.run(_build_edge_audio(segments, voice_name, out_path))
