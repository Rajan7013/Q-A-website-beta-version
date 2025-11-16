# 🔧 Deployment Environment Variables

## Frontend (.env or Vercel Environment Variables)
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

## Backend (Vercel Environment Variables)
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Cloudflare R2 (Optional - for file storage)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_r2_public_url
```

## 🚀 Quick Deploy Commands

### Vercel Deployment
```bash
# Frontend
cd frontend
vercel --prod

# Backend  
cd backend
vercel --prod
```

### Railway Deployment
```bash
# Full stack
railway login
railway init
railway up
```

## 🌐 Suggested Domain Names

### Professional Names:
- ai-doc-analyzer-pro
- smart-document-ai
- omnimind-analyzer
- docai-intelligence
- multilingual-docai

### Catchy Names:
- smartdocs-ai
- docgenius-pro
- aipapers-analyzer
- quickdoc-ai
- studybuddy-ai

## 📱 PWA Deployment Notes

1. Ensure HTTPS is enabled (automatic on Vercel/Netlify)
2. Service worker will work automatically
3. Install prompts will appear on mobile/desktop
4. Icons are already configured for all platforms