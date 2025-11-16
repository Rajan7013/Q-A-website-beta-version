# 🚀 Complete Deployment Guide - AI Document Analyzer

## 📋 Table of Contents
1. [Unique Website Names](#-unique-website-names)
2. [Pre-Deployment Checklist](#-pre-deployment-checklist)
3. [Deploy Backend (Render)](#-deploy-backend-render)
4. [Deploy Frontend (Vercel)](#-deploy-frontend-vercel)
5. [Environment Variables](#-environment-variables)
6. [Post-Deployment Setup](#-post-deployment-setup)
7. [Custom Domain Setup](#-custom-domain-setup)
8. [Troubleshooting](#-troubleshooting)

---

## 🎯 Unique Website Names

### Recommended Names (SEO-Optimized):
1. **askdocai.vercel.app** - Simple, memorable, describes functionality
2. **docqna-ai.vercel.app** - Document Q&A focus
3. **smartdocanalyzer.vercel.app** - Professional, descriptive
4. **aidocreader.vercel.app** - Clear purpose
5. **multilingual-docai.vercel.app** - Highlights unique feature
6. **docgenie-ai.vercel.app** - Catchy, AI-focused
7. **instantdocqa.vercel.app** - Speed emphasis
8. **voicedocai.vercel.app** - Voice feature highlight
9. **docinsight-ai.vercel.app** - Intelligence focus
10. **quickdocanalyzer.vercel.app** - Fast analysis

### Custom Domain Suggestions (if buying):
- **askdoc.ai** - Premium, short
- **docqna.io** - Tech-focused
- **smartdocs.app** - Modern
- **aidocreader.com** - Professional

---

## ✅ Pre-Deployment Checklist

### 1. Required Accounts
- [ ] GitHub account (already have ✓)
- [ ] Vercel account - [Sign up](https://vercel.com/signup)
- [ ] Render account - [Sign up](https://render.com/register)
- [ ] Gemini API Key - [Get free](https://ai.google.dev/)
- [ ] Cloudflare R2 (optional) - [Sign up](https://cloudflare.com)

### 2. Repository Ready
- [ ] Code pushed to GitHub ✓
- [ ] `.env` files NOT committed ✓
- [ ] `.gitignore` configured ✓
- [ ] README.md updated ✓

### 3. API Keys Ready
- [ ] Gemini API Key
- [ ] Cloudflare R2 credentials (optional)

---

## 🔧 Deploy Backend (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub
4. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Search: `Q-A-website-beta-version`
   - Click **"Connect"**

### Step 3: Configure Service
```
Name: ai-doc-analyzer-backend
Region: Singapore (closest to India) or Frankfurt
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Step 4: Select Plan
- **Free Plan** (recommended for testing)
  - 512 MB RAM
  - Sleeps after 15 min inactivity
  - Good for demo/testing

- **Starter Plan** ($7/month)
  - 512 MB RAM
  - Always on
  - Better for production

### Step 5: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=production
```

**Optional (if using Cloudflare R2):**
```env
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_r2_public_url
```

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Copy your backend URL: `https://ai-doc-analyzer-backend.onrender.com`

### Step 7: Test Backend
Open in browser:
```
https://your-backend-url.onrender.com/api/documents/list
```
Should return: `{"documents":[]}`

---

## 🎨 Deploy Frontend (Vercel)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub
4. Authorize Vercel

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import `Q-A-website-beta-version` repository
3. Click **"Import"**

### Step 3: Configure Project
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variables
Click **"Environment Variables"**

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

**Example:**
```env
VITE_API_URL=https://ai-doc-analyzer-backend.onrender.com/api
```

### Step 5: Choose Project Name
Enter one of these (or your custom name):
- `askdocai`
- `docqna-ai`
- `smartdocanalyzer`
- `aidocreader`

Your URL will be: `https://your-name.vercel.app`

### Step 6: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your site is live! 🎉

### Step 7: Test Frontend
1. Open: `https://your-name.vercel.app`
2. Try uploading a document
3. Ask a question
4. Test text-to-speech

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Required
GEMINI_API_KEY=AIzaSy...your_key_here
PORT=5000
NODE_ENV=production

# Optional - Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=ai-doc-analyzer
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### Frontend (.env)
```env
# Required - Your deployed backend URL
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🔄 Post-Deployment Setup

### 1. Update CORS in Backend
After deployment, update `backend/server.js`:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
};
```

**Commit and push:**
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin main
```

Render will auto-redeploy!

### 2. Test All Features
- [ ] Document upload (PDF, DOCX, TXT, PPTX)
- [ ] AI chat responses
- [ ] Language switching (all 9 languages)
- [ ] Text-to-speech
- [ ] Voice input
- [ ] Profile page
- [ ] Settings page
- [ ] Chat history
- [ ] PWA installation

### 3. Monitor Performance
**Render Dashboard:**
- Check logs for errors
- Monitor response times
- Check memory usage

**Vercel Dashboard:**
- Check build logs
- Monitor page load times
- Check analytics

---

## 🌐 Custom Domain Setup

### Option 1: Vercel Domain (Free)
Your site: `https://your-name.vercel.app`
- Already configured ✓
- Free SSL certificate ✓
- Global CDN ✓

### Option 2: Custom Domain (Paid)

#### Buy Domain:
- **Namecheap** - $8-12/year
- **GoDaddy** - $10-15/year
- **Google Domains** - $12/year

#### Connect to Vercel:
1. Go to Vercel project → **"Settings"** → **"Domains"**
2. Add your domain: `askdoc.ai`
3. Add DNS records (Vercel provides):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait 24-48 hours for DNS propagation

#### Connect Backend Domain (Render):
1. Go to Render dashboard → Your service → **"Settings"**
2. Add custom domain: `api.askdoc.ai`
3. Add DNS record:
   ```
   Type: CNAME
   Name: api
   Value: your-service.onrender.com
   ```

---

## 🎯 Recommended Setup

### For Best Performance:

**Frontend (Vercel):**
- ✅ Free plan (unlimited bandwidth)
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Auto-deploy on push

**Backend (Render):**
- ✅ Starter plan ($7/month) - Always on
- ✅ Auto-deploy on push
- ✅ Free SSL
- ✅ Persistent storage

**Total Cost:** $7/month (or free with sleep mode)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** Backend sleeps (Free plan)
```
Solution: Upgrade to Starter plan ($7/month)
Or: Use cron-job.org to ping every 14 minutes
```

**Problem:** CORS errors
```
Solution: Add Vercel URL to CORS whitelist in server.js
```

**Problem:** File upload fails
```
Solution: Check Render disk space (512MB limit)
Consider using Cloudflare R2 for storage
```

### Frontend Issues

**Problem:** API connection failed
```
Solution: Check VITE_API_URL in Vercel environment variables
Ensure backend is running
```

**Problem:** Build fails
```
Solution: Check build logs in Vercel
Ensure all dependencies in package.json
Run 'npm run build' locally first
```

**Problem:** PWA not installing
```
Solution: Ensure HTTPS (Vercel provides automatically)
Check manifest.json and sw.js are in public folder
```

### Common Errors

**Error:** "Cannot find module"
```bash
# In Render dashboard, trigger manual deploy
# Or check package.json dependencies
```

**Error:** "API key invalid"
```bash
# Check Gemini API key in Render environment variables
# Ensure no extra spaces
# Generate new key if needed
```

**Error:** "Network Error"
```bash
# Check backend URL in frontend .env
# Ensure backend is deployed and running
# Check CORS configuration
```

---

## 📊 Monitoring & Analytics

### Render Monitoring
1. Go to Render dashboard
2. Click your service
3. View:
   - **Logs** - Real-time errors
   - **Metrics** - CPU, Memory, Requests
   - **Events** - Deployments, restarts

### Vercel Analytics
1. Go to Vercel dashboard
2. Click your project
3. View:
   - **Analytics** - Page views, visitors
   - **Speed Insights** - Performance scores
   - **Logs** - Build and runtime logs

---

## 🚀 Quick Deploy Commands

### Update Backend
```bash
cd backend
# Make changes
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys in 2-3 minutes
```

### Update Frontend
```bash
cd frontend
# Make changes
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys in 1-2 minutes
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Frontend loads: `https://your-name.vercel.app`
- [ ] Backend responds: `https://your-backend.onrender.com/api/documents/list`
- [ ] Document upload works
- [ ] AI chat responds
- [ ] All 9 languages work
- [ ] Text-to-speech works
- [ ] Voice input works
- [ ] PWA installs on mobile
- [ ] Profile page loads
- [ ] Settings save correctly
- [ ] No console errors
- [ ] HTTPS enabled (green lock)

---

## 📱 Share Your App

### Social Media Post Template:
```
🚀 Just launched my AI Document Analyzer!

✨ Features:
📄 Upload & analyze documents (PDF, DOCX, TXT, PPTX)
🤖 AI-powered Q&A with Gemini 2.5 Flash
🌍 9 languages support
🔊 Text-to-speech in all languages
📱 Install as mobile/desktop app

Try it: https://your-name.vercel.app

#AI #MachineLearning #WebDev #React #NodeJS
```

---

## 🎯 Next Steps

1. **Monitor Usage**
   - Check Render logs daily
   - Monitor Vercel analytics
   - Track user feedback

2. **Optimize Performance**
   - Enable Cloudflare R2 for file storage
   - Add Redis for caching (optional)
   - Optimize images and assets

3. **Add Features**
   - User authentication
   - Database integration
   - Team collaboration
   - Advanced analytics

4. **Scale Up**
   - Upgrade Render plan if needed
   - Add custom domain
   - Enable CDN
   - Add monitoring tools

---

## 💡 Pro Tips

1. **Free Tier Optimization:**
   - Use cron-job.org to keep backend awake
   - Optimize bundle size
   - Enable compression

2. **Security:**
   - Never commit .env files
   - Rotate API keys regularly
   - Enable rate limiting
   - Monitor for suspicious activity

3. **Performance:**
   - Use Vercel Edge Functions for faster responses
   - Enable caching
   - Optimize images
   - Lazy load components

4. **SEO:**
   - Add meta tags
   - Create sitemap
   - Submit to Google Search Console
   - Add Open Graph tags

---

## 📞 Support

**Deployment Issues:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: https://github.com/Dharmendraprasaila/Q-A-website-beta-version/issues

**Need Help?**
- Check troubleshooting section above
- Review deployment logs
- Test locally first
- Ask in GitHub Discussions

---

## 🎊 Congratulations!

Your AI Document Analyzer is now live and accessible worldwide! 🌍

**Your URLs:**
- Frontend: `https://your-name.vercel.app`
- Backend: `https://your-backend.onrender.com`

Share it with the world! 🚀

---

Made with ❤️ by Dharmendra Prasad
