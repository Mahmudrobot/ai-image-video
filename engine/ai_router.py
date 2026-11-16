import random
from google import genai
from google.genai import types
import anthropic

def generate_script_and_code(prompt, user_keys_json, engine_mode="only_gemini"):
    gemini_keys = [k.strip() for k in user_keys_json.get("gemini", []) if k.strip()]
    claude_keys = [k.strip() for k in user_keys_json.get("claude", []) if k.strip()]

    if engine_mode == "hybrid_mix" and gemini_keys and claude_keys:
        chosen = random.choice(["gemini", "claude"])
    elif engine_mode == "only_claude":
        chosen = "claude"
    else:
        chosen = "gemini"

    if chosen == "claude":
        if not claude_keys:
            raise ValueError("আপনার ভল্টে কোনো Claude API Key নেই! বটের API Vault বাটন থেকে Key যোগ করুন।")
        keys = claude_keys.copy()
        random.shuffle(keys)
        last_err = ""
        for key in keys:
            try:
                client = anthropic.Anthropic(api_key=key)
                msg = client.messages.create(
                    model="claude-3-7-sonnet-latest",
                    max_tokens=8192,
                    messages=[{"role": "user", "content": prompt + "\nCRITICAL: Return ONLY raw valid JSON."}]
                )
                text = msg.content[0].text.strip()
                if text.startswith("```json"):
                    text = text[7:-3].strip()
                elif text.startswith("```"):
                    text = text[3:-3].strip()
                return text
            except Exception as e:
                last_err = str(e)
                continue
        raise RuntimeError(f"সবগুলো Claude API Key ব্যর্থ: {last_err}")
    else:
        if not gemini_keys:
            raise ValueError("আপনার ভল্টে কোনো Gemini API Key নেই! বটের '🔐 API Key ভল্ট' বাটন থেকে Key যোগ করুন।")
        keys = gemini_keys.copy()
        random.shuffle(keys)
        last_err = ""
        for key in keys:
            try:
                client = genai.Client(api_key=key)
                res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return res.text
            except Exception as e:
                last_err = str(e)
                continue
        raise RuntimeError(f"সবগুলো Gemini API Key ব্যর্থ: {last_err}")

def generate_ai_image(prompt, user_keys_json, out_path="image_output.png"):
    gemini_keys = [k.strip() for k in user_keys_json.get("gemini", []) if k.strip()]
    if not gemini_keys:
        raise ValueError("ইমেজ বানানোর জন্য আপনার ভল্টে কোনো Gemini API Key নেই! আগে '🔐 API Key ভল্ট' বাটন থেকে Key যোগ করুন।")

    keys = gemini_keys.copy()
    random.shuffle(keys)
    last_err = ""
    for key in keys:
        try:
            client = genai.Client(api_key=key)
            try:
                res = client.models.generate_images(
                    model="imagen-3.0-generate-002",
                    prompt=prompt,
                    config=types.GenerateImagesConfig(number_of_images=1, output_mime_type="image/png")
                )
                if res.generated_images:
                    with open(out_path, "wb") as f:
                        f.write(res.generated_images[0].image.image_bytes)
                    return out_path
            except Exception:
                pass

            res2 = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt,
                config=types.GenerateContentConfig(response_modalities=["IMAGE"])
            )
            for part in res2.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    with open(out_path, "wb") as f:
                        f.write(part.inline_data.data)
                    return out_path
        except Exception as e:
            last_err = str(e)
            continue

    raise RuntimeError(f"ইমেজ জেনারেট ব্যর্থ হয়েছে: {last_err}")
