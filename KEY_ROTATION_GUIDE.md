# 🔐 Key Rotation Guide

Since some of your keys were exposed in the documentation files, it is **critical** to rotate them (generate new ones and invalidate the old ones) to prevent unauthorized access.

## 1. Cloudflare R2 (Storage) ☁️

**Step 1: Revoke Old Keys**
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **R2** from the sidebar.
3. On the right side, click **Manage R2 API Tokens**.
4. Find the token you were using (check your `.env` for the ID if unsure).
5. Click **Delete** or the **three dots** -> **Revoke**. This stops the old key from working.

**Step 2: Generate New Keys**
1. Click **Create API Token**.
2. Name it (e.g., "QA System Prod").
3. Permissions: **Object Read & Write** (or Admin Read & Write).
4. Click **Create API Token**.
5. **IMMEDIATELY** copy the:
    *   `Access Key ID`
    *   `Secret Access Key`
6. Update your `backend-unified/.env` file with these new values.

## 2. Google Gemini AI 🧠

**Step 1: Revoke Old Key**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. You will see a list of API keys.
3. Find the key starting with `AIzaSyA1...` (the one that was exposed).
4. Click the **Delete** (trash icon) next to it.

**Step 2: Generate New Key**
1. Click **Create API Key**.
2. Select your project.
3. Copy the new key string.
4. Update your `backend-unified/.env` file:
    ```env
    GEMINI_API_KEY=your_new_key_here
    ```

## 3. Cleaning Git History (Optional but Recommended)

Even though we removed the keys from the *current* files, they still exist in your **Git History**.

*   **If this is a private repo:** You are mostly safe *after* rotating the keys. The old keys in history will be useless.
*   **If this is public:** Bots scan public history instantly. Rotating keys (Steps 1 & 2) is the **only** way to be safe.

### How to update your code:
After getting new keys, run this in your terminal to verify everything works:

```bash
# Backend
cd backend-unified
npm run dev

# Frontend
cd frontend
npm run dev
```

Your app will now be secure! 🛡️
