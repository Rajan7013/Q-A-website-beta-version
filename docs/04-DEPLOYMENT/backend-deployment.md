# ⚙️ Backend Deployment (Railway / Render)

This guide explains how to deploy the **Node.js/Express Backend** to **Railway** (recommended) or **Render**.

---

## Option A: Railway (Recommended)
Railway is cleaner and easier for full-stack apps.

### 1. Create Project
1. Go to [railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `Q-A-website`.

### 2. Configure Service
1. Railway typically creates one service. We need to target the `backend-unified` folder.
2. Go to **Settings** -> **Root Directory**.
3. Set to `/backend-unified`.
4. **Build Command**: `npm install`
5. **Start Command**: `npm start` (ensure `package.json` has `"start": "node src/server.js"`)

### 3. Environment Variables
Go to **Variables** tab and add all keys from your local `.env` **EXCEPT** `PORT` (Railway handles port):

- `NODE_ENV`: `production`
- `CLERK_SECRET_KEY`: `...`
- `CLERK_PUBLISHABLE_KEY`: `...`
- `SUPABASE_URL`: `...`
- `SUPABASE_SERVICE_KEY`: `...`
- `GEMINI_API_KEY`: `...`
- `R2_...` (All R2 keys)
- `EMBEDDING_SERVICE_URL`: `https://your-hugging-face-space.hf.space`

### 4. Deploy
Railway will auto-deploy.

---

## Option B: Render
Render has a good free tier but spins down on inactivity.

### 1. Create Web Service
1. Go to [render.com](https://render.com/).
2. New **Web Service**.
3. Connect GitHub repo.

### 2. Configure
- **Root Directory**: `backend-unified`
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables
Add all variables as listed in Railway section.

---

## 🔗 Important: CORS Configuration

Once deployed, get your **Frontend URL** (e.g., `https://qa-system.vercel.app`) and update your Backend Environment:

- `CORS_ORIGIN`: `https://qa-system.vercel.app`

This ensures your frontend can talk to your backend.
