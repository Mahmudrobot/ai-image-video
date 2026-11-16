import os
import asyncio
import wave
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
        if os.path.exists(tmp):
            os.remove(tmp)
    with open(out_path, "wb") as f:
        f.write(combined)

def generate_voiceover(segments, voice_spec, user_gemini_keys, out_path="public/voice.mp3"):
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    engine, voice_name = voice_spec.split(":", 1) if ":" in voice_spec else ("edge", "v2_boy_story")

    if engine == "gemini":
        if not user_gemini_keys:
            raise ValueError("Gemini ভয়েস ব্যবহার করতে আগে বটে Gemini API Key যোগ করুন!")
        full_text = " ".join([s["text"] for s in segments])
        last_err = ""
        for key in user_gemini_keys:
            try:
                client = genai.Client(api_key=key.strip())
                res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Read this Bengali script naturally with clear pronunciation and emotion: {full_text}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                            )
                        )
                    )
                )
                part = res.candidates[0].content.parts[0]
                raw_bytes = part.inline_data.data
                mime = getattr(part.inline_data, "mime_type", "") or ""
                if "pcm" in mime.lower() or "l16" in mime.lower():
                    wav_tmp = out_path + ".wav"
                    with wave.open(wav_tmp, "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(raw_bytes)
                    os.system(f"ffmpeg -y -i {wav_tmp} {out_path}")
                    if os.path.exists(wav_tmp):
                        os.remove(wav_tmp)
                else:
                    with open(out_path, "wb") as f:
                        f.write(raw_bytes)
                return
            except Exception as e:
                last_err = str(e)
                continue
        print(f"Gemini TTS fallback to Edge-TTS due to: {last_err}")

    asyncio.run(_build_edge_audio(segments, voice_name, out_path))
