# 🚀 Quick Deployment Guide

## Prerequisites
- ✅ GitHub account
- ✅ All environment variables ready
- ✅ Tested locally

## 🎯 Deploy in 3 Steps (30 minutes total)

---

### Step 1: Deploy Backend (15 min)

#### Option A: Render (Recommended - Free Tier)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select `backend-unified` folder
   - Configuration:
     ```
     Name: ai-doc-analyzer-backend
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     Plan: Free
     ```
   
3. **Add Environment Variables**
   Copy from `backend-unified/.env` to Render Environment Variables

4. **Deploy & Wait** (5-10 min)
   - Copy your backend URL: `https://[your-service].onrender.com`

#### Option B: Railway (Alternative - $5 credit free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend-unified
railway init
railway up
```

---

### Step 2: Deploy Frontend (10 min)

#### Vercel (Recommended - Free Tier)

1. **Update Frontend Environment**
   
   Create `frontend/.env.production`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=[REDACTED_PUBLIC_KEY]
   VITE_API_URL=https://[your-backend-url].onrender.com/api
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repo
   - Configuration:
     ```
     Framework Preset: Vite
     Root Directory: frontend
     Build Command: npm run build
     Output Directory: dist
     ```

3. **Add Environment Variables**
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk key
   - `VITE_API_URL`: Your backend URL + `/api`

4. **Deploy & Wait** (2-3 min)
   - Copy your frontend URL: `https://[your-app].vercel.app`

---

### Step 3: Configure CORS (5 min)

1. **Update Backend CORS**
   - Go to Render dashboard
   - Add environment variable:
     ```
     FRONTEND_URL=https://[your-app].vercel.app
     ```
   - Click "Manual Deploy" to restart

2. **Update Clerk**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Add your Vercel URL to allowed origins

---

## ✅ Test Your Deployment

1. Open your Vercel URL
2. Sign in with Clerk
3. Upload a document
4. Ask a question
5. ✅ Should work!

---

## 🐛 Troubleshooting

### Backend Issues:
```bash
# Check Render logs
# Render Dashboard → Your Service → Logs
```

### Frontend Issues:
```bash
# Check Vercel logs
# Vercel Dashboard → Your Project → Deployments → Logs
```

### CORS Errors:
- Verify `FRONTEND_URL` in backend
- Check Clerk allowed origins
- Clear browser cache

---

## 💰 Cost

**Free Tier Includes:**
- Render: 750 hours/month
- Vercel: Unlimited bandwidth
- Supabase: 500MB database
- Cloudflare R2: 10GB storage
- Clerk: 10,000 users

**Expected Cost: $0 for first few months**

---

## 🎉 You're Live!

Share your app: `https://[your-app].vercel.app`

---

## 📞 Need Help?

Check logs:
1. Backend: Render Dashboard → Logs
2. Frontend: Vercel Dashboard → Logs
3. Database: Supabase Dashboard → Logs
4. Browser: F12 → Console
