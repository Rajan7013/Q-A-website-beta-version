# 🚀 Deployment & GitHub Guide

You should push the **entire `QA System` folder** as one repository. This is the simplest way to manage both Frontend and Backend.

## 1. Which Folder to Push?
**The Root Folder:** `C:\Users\rajan\.gemini\antigravity\scratch\QA System`

This folder contains both:
*   `frontend/` (React code)
*   `backend-unified/` (Node.js code)

### Commands to Push:
Run these commands in your VS Code terminal (inside `QA System`):

```bash
# 1. Initialize Git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit your changes
git commit -m "Initial commit - Ready for deployment"

# 4. Connect to your GitHub Repository
# Replace URL with your actual new repo URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## 2. How to Setup Auto-Deploy

### Frontend (Vercel) 🌐
1.  Go to **[Vercel Dashboard](https://vercel.com/new)**.
2.  Import your **GitHub Repository**.
3.  **Root Directory:** Edit this setting and select `frontend`.
4.  **Environment Variables:** Add keys from `frontend/.env`:
    *   `VITE_CLERK_PUBLISHABLE_KEY`
    *   `VITE_API_URL` (This will be your backend URL)
5.  Click **Deploy**.

### Backend (Render/Railway) ⚙️
1.  Go to **[Render Dashboard](https://dashboard.render.com/)**.
2.  New **Web Service** -> Connect GitHub Repo.
3.  **Root Directory:** Enter `backend-unified`.
4.  **Build Command:** `npm install`
5.  **Start Command:** `npm start`
6.  **Environment Variables:** Add keys from `backend-unified/.env`:
    *   `CLERK_SECRET_KEY`
    *   `CLERK_PUBLISHABLE_KEY`
    *   `GEMINI_API_KEY`
    *   `SUPABASE_URL`
    *   `SUPABASE_SERVICE_KEY`
    *   `R2_ACCOUNT_ID`... (and all others)
7.  Click **Create Web Service**.

Now, every time you run `git push`, both sites will **automatically redeploy**! 🔄
