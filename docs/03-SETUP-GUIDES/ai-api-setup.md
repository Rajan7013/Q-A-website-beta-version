# 🧠 AI API Setup (Gemini & Groq)

This system uses **Google Gemini** as the primary LLM and **Groq** for fast inference (optional but recommended).

---

## 1. Google Gemini API
1. Go to [Google AI Studio](https://ai.google.dev/).
2. Click **Get API Key**.
3. Create key in a new project.
4. Copy the key.

**Update `.env`**:
```env
GEMINI_API_KEY=AIzaSy...
```

---

## 2. Groq API (Optional)
Groq provides extremely fast inference for open-source models (Llama 3, Mixtral).

1. Go to [Groq Console](https://console.groq.com/).
2. Login/Sign up.
3. Go to **API Keys**.
4. Click **Create API Key**.
5. Copy the key.

**Update `.env`**:
```env
GROQ_API_KEY=gsk_...
```
