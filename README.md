# AI Studio Pro V10 - Multi-Google Drive Manager + Per-Channel Drive Toggle & Complete Studio

## V10 নতুন বৈশিষ্ট্যসমূহ:
1. **Multi-Google Drive Vault (`/drives`):** কাস্টম নাম দিয়ে যত খুশি তত Google Drive ফোল্ডার/অ্যাকাউন্ট যোগ করা।
2. **Smart Auto-Select:** ১টি ড্রাইভ থাকলে অটোমেটিক সব চ্যানেলে সিলেক্ট থাকবে; একাধিক থাকলে চ্যানেল অনুযায়ী আলাদা ড্রাইভ বাছাই।
3. **Anytime Drive ON/OFF Switch:** যেকোনো চ্যানেলের জন্য যেকোনো সময় এক ক্লিকে ড্রাইভ আপলোড ON বা OFF করা।
4. **All V1-V9 Features Included:** `/claim_admin`, Slash (`/`) Menu, `/start`, `/restart`, `/cancel`, Unlimited API Keys, Unlimited Templates (Generate Again), Chat Voice Note TTS, Pending Tasks (Stop/Resume/Delete), Hourly Error Alerts & 1-Click JSON Backup.

## সেটআপ নির্দেশিকা:
১. তৈরি হওয়া `ai-studio-pro-v10.zip` আনজিপ করে GitHub Public Repository-তে আপলোড করুন।
২. GitHub Repo -> Settings -> Secrets -> Actions-এ যোগ করুন:
   `TG_BOT_TOKEN`, `GDRIVE_CREDENTIALS`, `GDRIVE_FOLDER_ID`, `WORKER_PUBLIC_URL`
৩. Cloudflare Workers-এ `cloudflare/worker.js` Deploy করুন এবং `STUDIO_DB` KV Namespace ও `TG_BOT_TOKEN`, `GH_USER`, `GH_REPO`, `GH_TOKEN` Variables সেট করুন।
৪. টেলিগ্রাম ওয়েববুক সেট করে বটে প্রথমে `/claim_admin` লিখুন।
