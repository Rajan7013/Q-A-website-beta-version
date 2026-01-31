# 🔑 API Keys Setup Guide

Guide to acquiring all necessary API keys for the Q&A System's AI capabilities.

---

## 1. Google Gemini API (Core AI)

The core Question & Answer intelligence uses Google's Gemini models.

### Step 1: Get Key
1. Go to **[Google AI Studio](https://aistudio.google.com/)**
2. Sign in with your Google Account
3. Click **"Get API key"** (top left or sidebar)
4. Click **"Create API key"**
5. Select a project (or "Create new project")
6. Copy the generated key (starts with `AIza...` or similar)

### Step 2: Configure
Add to `backend-unified/.env`:
```env
GEMINI_API_KEY=your_api_key_here
```

### Limits & Pricing
- **Free Tier:** 15 RPM (Requests Per Minute), 32,000 TPM (Tokens Per Minute), 1,500 RPD (Requests Per Day)
- **Pay-as-you-go:** Higher limits, competitive pricing
- **Recommendation:** Free tier is sufficient for development and personal use.

---

## 2. Groq API (Fast Inference)

Used for ultra-fast summarization or alternative reasoning (optional but recommended).

### Step 1: Get Key
1. Go to **[Groq Cloud Console](https://console.groq.com/keys)**
2. Sign in (Email/Google/GitHub)
3. Click **"Create API Key"**
4. Name: `qa-system`
5. Copy the key (starts with `gsk_...`)

### Step 2: Configure
Add to `backend-unified/.env` (if supported in your version):
```env
GROQ_API_KEY=your_groq_key_here
```

### Limits
- **Free Beta:** Generous limits for now (subject to change)

---

## 3. Cohere API (Reranking - Optional)

Used to improve search accuracy by "reranking" document search results. Highly recommended for better answers.

### Step 1: Get Key
1. Go to **[Cohere Dashboard](https://dashboard.cohere.com/api-keys)**
2. Sign in
3. Go to **"API Keys"**
4. Copy the `default` Trial key or create a new Production key

### Step 2: Configure
Add to `backend-unified/.env`:
```env
COHERE_API_KEY=your_cohere_key_here
```

### Free Tier
- **Trial Key:** 100 calls / minute (more than enough for this app)

---

## Summary of Keys Needed

| Service | Variable Name | Required? | Where to get |
|---------|---------------|-----------|--------------|
| **Gemini** | `GEMINI_API_KEY` | **YES** | [Google AI Studio](https://aistudio.google.com/) |
| **Clerk** | `CLERK_SECRET_KEY` | **YES** | [Clerk Dashboard](https://dashboard.clerk.com/) |
| **Supabase** | `SUPABASE_SERVICE_KEY` | **YES** | [Supabase Projects](https://supabase.com/) |
| **Cloudflare** | `R2_SECRET_ACCESS_KEY` | **YES** | [Cloudflare Dash](https://dash.cloudflare.com/) |
| **Groq** | `GROQ_API_KEY` | Optional | [Groq Console](https://console.groq.com/) |
| **Cohere** | `COHERE_API_KEY` | Optional | [Cohere Dash](https://dashboard.cohere.com/) |

---

## ⚠️ Security Warning

- **NEVER** commit these keys to GitHub.
- **ALWAYS** use `.gitignore` to exclude `.env` files.
- **ROTATE** keys if you suspect they were exposed.
