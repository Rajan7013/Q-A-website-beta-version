# 🌐 Frontend Deployment (Vercel)

This guide explains how to deploy the **React Frontend** to **Vercel** (recommended for best performance).

---

## 🚀 Deployment Steps

### 1. Create Vercel Account
Go to [vercel.com](https://vercel.com/) and sign up with GitHub.

### 2. Import Project
1. Click **Add New** -> **Project**.
2. Select your GitHub repository (`Q-A-website`).
3. Vercel will auto-detect **Vite**.

### 3. Configure Project
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (Click Edit if needed)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Environment Variables
You MUST add these variables in the Vercel dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-app.up.railway.app/api` | URL of your deployed backend |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | From Clerk Dashboard |
| `VITE_SUPABASE_URL` | `https://...` | Optional (if used in frontend) |
| `VITE_SUPABASE_ANON_KEY` | `eyJh...` | Optional (if used in frontend) |

### 5. Deploy
Click **Deploy**. Vercel will build the frontend and provide a URL (e.g., `https://qa-system.vercel.app`).

---

## 🔄 Updates
- Any push to `main` will trigger a new deployment automatically.
- Ensure you update `VITE_API_URL` if your backend URL changes.

---

## 🐛 Troubleshooting

### "Connection Refused"
- Check `VITE_API_URL`. It must point to the **HTTPS** version of your backend.
- Ensure your backend CORS settings allow the Vercel domain.

### "404 Not Found" on Refresh
- Create a `vercel.json` in `frontend/` with rewrite rules (already included in this repo).

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
