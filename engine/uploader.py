import json
import requests
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

def check_drive_quota_and_upload(creds_json_str, folder_id, file_path, file_name, drive_label="Default Drive"):
    if not creds_json_str or not folder_id:
        return {"ok": False, "error": f"[{drive_label}] Google Drive Credentials বা Folder ID সেট করা নেই!"}
    try:
        creds = service_account.Credentials.from_service_account_info(
            json.loads(creds_json_str), scopes=["https://www.googleapis.com/auth/drive"]
        )
        service = build("drive", "v3", credentials=creds)
        about = service.about().get(fields="storageQuota").execute()
        quota = about.get("storageQuota", {})
        limit = int(quota.get("limit", 0))
        usage = int(quota.get("usage", 0))
        warning = None
        if limit > 0 and (usage / limit) >= 0.90:
            pct = round((usage / limit) * 100, 1)
            warning = f"⚠️ জরুরি সতর্কতা [{drive_label}]: আপনার Google Drive স্টোরেজ {pct}% পূর্ণ হয়ে গেছে!"

        meta = {"name": file_name, "parents": [folder_id]}
        media = MediaFileUpload(file_path, resumable=True)
        service.files().create(body=meta, media_body=media, fields="id").execute()
        return {"ok": True, "warning": warning}
    except Exception as e:
        return {"ok": False, "error": f"[{drive_label}] Google Drive আপলোড ব্যর্থ: {str(e)}"}

def post_to_social_safe(channel_cfg, video_path, title, description, tags):
    errors = []
    if channel_cfg.get("fb_page_id") and channel_cfg.get("fb_token"):
        try:
            url = f"https://graph-video.facebook.com/v21.0/{channel_cfg['fb_page_id']}/videos"
            with open(video_path, "rb") as f:
                r = requests.post(url, data={"access_token": channel_cfg["fb_token"], "title": title, "description": description}, files={"source": f}).json()
            if "error" in r:
                errors.append(f"Facebook Error: {r['error'].get('message')}")
        except Exception as e:
            errors.append(f"Facebook Connection Error: {str(e)}")

    if channel_cfg.get("yt_refresh_token"):
        try:
            creds = Credentials(
                None, refresh_token=channel_cfg["yt_refresh_token"],
                token_uri="https://oauth2.googleapis.com/token",
                client_id=channel_cfg["yt_client_id"], client_secret=channel_cfg["yt_client_secret"]
            )
            yt = build("youtube", "v3", credentials=creds)
            body = {
                "snippet": {"title": title[:95], "description": description, "tags": tags, "categoryId": "22"},
                "status": {"privacyStatus": "public"}
            }
            yt.videos().insert(part="snippet,status", body=body, media_body=MediaFileUpload(video_path, chunksize=-1, resumable=True)).execute()
        except Exception as e:
            errors.append(f"YouTube Upload Error: {str(e)}")
    return errors
