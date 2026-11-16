import random
from google import genai
from google.genai import types
import anthropic

def generate_script_and_code(prompt, user_keys_json, engine_mode="only_gemini"):
    gemini_keys = [k.strip() for k in user_keys_json.get("gemini", []) if k.strip()]
    claude_keys = [k.strip() for k in user_keys_json.get("claude", []) if k.strip()]

    if engine_mode == "hybrid_mix":
        chosen = random.choice(["gemini", "claude"])
    elif engine_mode == "only_claude":
        chosen = "claude"
    else:
        chosen = "gemini"

    if chosen == "claude":
        if not claude_keys:
            raise ValueError("আপনার ভল্টে কোনো Claude API Key নেই! /addkey claude KEY লিখুন।")
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
            raise ValueError("আপনার ভল্টে কোনো Gemini API Key নেই! /addkey gemini KEY লিখুন।")
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
