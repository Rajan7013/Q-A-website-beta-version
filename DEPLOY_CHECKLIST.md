# 🚀 Quick Deployment Checklist

## ⏱️ Total Time: 15-20 minutes

---

## 📝 Before You Start

### Required Information:
- [ ] Gemini API Key: `_______________________`
- [ ] GitHub Repository: `Dharmendraprasaila/Q-A-website-beta-version` ✓
- [ ] Email for accounts: `_______________________`

---

## 🔧 Step 1: Deploy Backend (Render) - 8 minutes

### 1.1 Create Account (2 min)
- [ ] Go to [render.com](https://render.com)
- [ ] Sign up with GitHub
- [ ] Authorize Render

### 1.2 Create Web Service (3 min)
- [ ] Click "New +" → "Web Service"
- [ ] Connect repository: `Q-A-website-beta-version`
- [ ] Configure:
  ```
  Name: ai-doc-analyzer-backend
  Region: Singapore
  Branch: main
  Root Directory: backend
  Build Command: npm install
  Start Command: npm start
  ```

### 1.3 Add Environment Variables (2 min)
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add:
  ```
  GEMINI_API_KEY = your_key_here
  PORT = 5000
  NODE_ENV = production
  ```

### 1.4 Deploy (1 min)
- [ ] Click "Create Web Service"
- [ ] Wait for deployment
- [ ] Copy backend URL: `https://____________.onrender.com`

---

## 🎨 Step 2: Deploy Frontend (Vercel) - 7 minutes

### 2.1 Create Account (2 min)
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub
- [ ] Authorize Vercel

### 2.2 Import Project (2 min)
- [ ] Click "Add New..." → "Project"
- [ ] Import `Q-A-website-beta-version`
- [ ] Configure:
  ```
  Framework: Vite
  Root Directory: frontend
  Build Command: npm run build
  Output Directory: dist
  ```

### 2.3 Choose Name (1 min)
Pick one:
- [ ] `askdocai`
- [ ] `docqna-ai`
- [ ] `smartdocanalyzer`
- [ ] `aidocreader`
- [ ] Custom: `_______________________`

### 2.4 Add Environment Variable (1 min)
- [ ] Add:
  ```
  VITE_API_URL = https://your-backend.onrender.com/api
  ```

### 2.5 Deploy (1 min)
- [ ] Click "Deploy"
- [ ] Wait for deployment
- [ ] Your URL: `https://____________.vercel.app`

---

## 🔄 Step 3: Connect Frontend & Backend (5 minutes)

### 3.1 Update Backend CORS (3 min)
- [ ] Go to Render dashboard
- [ ] Click your service → "Environment"
- [ ] Add new variable:
  ```
  FRONTEND_URL = https://your-app.vercel.app
  ```
- [ ] Click "Save Changes"
- [ ] Wait for auto-redeploy (2 min)

### 3.2 Test Connection (2 min)
- [ ] Open your Vercel URL
- [ ] Try uploading a document
- [ ] Ask a question
- [ ] Check if AI responds

---

## ✅ Step 4: Final Testing (5 minutes)

### Test All Features:
- [ ] Document upload (PDF, DOCX, TXT)
- [ ] AI chat response
- [ ] Language switching
- [ ] Text-to-speech
- [ ] Voice input
- [ ] Profile page
- [ ] Settings page
- [ ] PWA installation (mobile)

---

## 🎉 Success!

### Your Live URLs:
- **Frontend:** `https://____________.vercel.app`
- **Backend:** `https://____________.onrender.com`

### Share Your App:
```
🚀 Check out my AI Document Analyzer!
📄 Upload documents, ask questions in 9 languages
🔊 Text-to-speech support
📱 Install as mobile app

Try it: https://your-app.vercel.app
```

---

## 📊 Monitoring

### Daily Checks:
- [ ] Check Render logs for errors
- [ ] Monitor Vercel analytics
- [ ] Test core features

### Weekly:
- [ ] Review usage statistics
- [ ] Check for updates
- [ ] Backup data

---

## 🐛 Quick Fixes

### Backend sleeping (Free plan)?
```
Use cron-job.org to ping every 14 minutes:
https://your-backend.onrender.com/health
```

### CORS error?
```
Add FRONTEND_URL to Render environment variables
```

### Build failed?
```
Check logs in dashboard
Ensure all dependencies in package.json
```

---

## 💰 Cost Summary

### Free Tier (Recommended for testing):
- Render: Free (sleeps after 15 min)
- Vercel: Free (unlimited bandwidth)
- **Total: $0/month**

### Production Tier:
- Render Starter: $7/month (always on)
- Vercel: Free
- **Total: $7/month**

---

## 📞 Need Help?

1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Open GitHub issue
4. Check deployment logs

---

**Estimated Total Time:** 15-20 minutes
**Difficulty:** Easy ⭐⭐☆☆☆

Good luck! 🚀
