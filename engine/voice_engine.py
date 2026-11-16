import os
import asyncio
import wave
import edge_tts
from google import genai
from google.genai import types

# 20 Real Tuned Bengali Edge-TTS Voices (BD + IN)
EDGE_PRESETS = {
    "v1_boy_deep": ("bn-BD-PradeepNeural", "+2%", "-8Hz"),
    "v2_boy_story": ("bn-BD-PradeepNeural", "-4%", "+2Hz"),
    "v3_boy_energetic": ("bn-BD-PradeepNeural", "+15%", "+6Hz"),
    "v4_boy_calm": ("bn-BD-PradeepNeural", "-7%", "-3Hz"),
    "v5_boy_news": ("bn-BD-PradeepNeural", "+8%", "-2Hz"),
    "v6_boy_documentary": ("bn-BD-PradeepNeural", "-5%", "-6Hz"),
    "v7_boy_islamic": ("bn-BD-PradeepNeural", "-6%", "+1Hz"),
    "v8_boy_kolkata": ("bn-IN-BashkarNeural", "+3%", "-2Hz"),
    "v9_boy_kolkata_fast": ("bn-IN-BashkarNeural", "+12%", "+4Hz"),
    "v10_boy_kolkata_deep": ("bn-IN-BashkarNeural", "-4%", "-7Hz"),
    "v11_girl_sweet": ("bn-BD-NabanitaNeural", "+2%", "+2Hz"),
    "v12_girl_cartoon": ("bn-BD-NabanitaNeural", "+12%", "+9Hz"),
    "v13_girl_emotional": ("bn-BD-NabanitaNeural", "-6%", "-2Hz"),
    "v14_girl_news": ("bn-BD-NabanitaNeural", "+9%", "-1Hz"),
    "v15_girl_story": ("bn-BD-NabanitaNeural", "-3%", "+3Hz"),
    "v16_girl_promo": ("bn-BD-NabanitaNeural", "+14%", "+5Hz"),
    "v17_girl_soft": ("bn-BD-NabanitaNeural", "-8%", "+1Hz"),
    "v18_girl_kolkata": ("bn-IN-TanishaaNeural", "+4%", "+3Hz"),
    "v19_girl_kolkata_energetic": ("bn-IN-TanishaaNeural", "+13%", "+7Hz"),
    "v20_girl_kolkata_calm": ("bn-IN-TanishaaNeural", "-5%", "-2Hz"),
}

EMOTION_PROMPTS = {
    "normal": "natural, clear, engaging Bengali tone",
    "excited": "high energy, enthusiastic, excited and lively Bengali tone",
    "sad": "deeply emotional, melancholic, soft and sad Bengali tone",
    "dramatic": "intense, cinematic, dramatic storytelling Bengali tone",
    "calm": "soothing, peaceful, calm and motivational Bengali tone",
    "news": "authoritative, crisp, professional news anchor Bengali tone"
}

def _save_gemini_audio_part(part, out_path):
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

async def _build_edge_audio(segments, speakers_list, emotion, out_path):
    combined = b""
    for idx, seg in enumerate(segments):
        sp_idx = seg.get("speaker_idx", idx % max(1, len(speakers_list)))
        vspec = speakers_list[sp_idx % len(speakers_list)]
        preset_key = vspec.split(":", 1)[1] if ":" in vspec else "v2_boy_story"
        if preset_key not in EDGE_PRESETS:
            preset_key = "v2_boy_story" if idx % 2 == 0 else "v11_girl_sweet"
        voice, base_rate, base_pitch = EDGE_PRESETS[preset_key]

        emo = seg.get("emotion", emotion) or emotion
        rate, pitch = base_rate, base_pitch
        if emo == "excited":
            rate, pitch = "+14%", "+6Hz"
        elif emo == "sad":
            rate, pitch = "-9%", "-4Hz"
        elif emo == "dramatic":
            rate, pitch = "-4%", "-5Hz"
        elif emo == "calm":
            rate, pitch = "-8%", "-2Hz"

        tmp = f"tmp_seg_{idx}.mp3"
        comm = edge_tts.Communicate(seg["text"], voice, rate=rate, pitch=pitch)
        await comm.save(tmp)
        with open(tmp, "rb") as f:
            combined += f.read()
        if os.path.exists(tmp):
            os.remove(tmp)
    with open(out_path, "wb") as f:
        f.write(combined)

def generate_voiceover(segments, voice_spec, user_gemini_keys, out_path="public/voice.mp3", emotion="normal", speaker_voices=None):
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    speakers = speaker_voices if (speaker_voices and len(speaker_voices) > 0) else [voice_spec]
    emo_desc = EMOTION_PROMPTS.get(emotion, EMOTION_PROMPTS["normal"])

    # Multi-Speaker (Dual / Triple) Mode
    if len(speakers) > 1 and user_gemini_keys:
        dialogue_lines = []
        for idx, seg in enumerate(segments):
            sp_num = (seg.get("speaker_idx", idx % len(speakers)) % len(speakers)) + 1
            dialogue_lines.append(f"Speaker {sp_num}: {seg['text']}")
        script_text = "\n".join(dialogue_lines)

        speaker_configs = []
        for i, sp_v in enumerate(speakers[:3]):
            vname = sp_v.split(":", 1)[1] if ":" in sp_v else "Puck"
            if vname in EDGE_PRESETS:
                vname = ["Puck", "Kore", "Charon"][i % 3]
            speaker_configs.append(
                types.SpeakerVoiceConfig(
                    speaker=f"Speaker {i+1}",
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=vname)
                    )
                )
            )

        for key in user_gemini_keys:
            try:
                client = genai.Client(api_key=key.strip())
                res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Perform this multi-speaker Bengali conversation with {emo_desc}:\n{script_text}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                                speaker_voice_configs=speaker_configs
                            )
                        )
                    )
                )
                _save_gemini_audio_part(res.candidates[0].content.parts[0], out_path)
                return
            except Exception as e:
                print(f"Multi-speaker Gemini attempt error: {e}")
                continue

    # Single Gemini Voice Mode
    primary = speakers[0]
    engine, voice_name = primary.split(":", 1) if ":" in primary else ("edge", "v2_boy_story")
    if engine == "gemini" and user_gemini_keys:
        full_text = " ".join([s["text"] for s in segments])
        for key in user_gemini_keys:
            try:
                client = genai.Client(api_key=key.strip())
                res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"Read this Bengali script in a {emo_desc}: {full_text}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                            )
                        )
                    )
                )
                _save_gemini_audio_part(res.candidates[0].content.parts[0], out_path)
                return
            except Exception as e:
                print(f"Single Gemini TTS fallback: {e}")
                continue

    # Edge-TTS Fallback / Single / Multi-Speaker Edge
    asyncio.run(_build_edge_audio(segments, speakers, emotion, out_path))
