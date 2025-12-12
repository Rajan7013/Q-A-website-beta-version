# 🔑 Credentials Reference

**⚠️ SECURITY: This file is for reference only. All actual credentials are in `.env` files (gitignored)**

---

## ✅ All Services Configured

### 1. Google Gemini AI ✅
- **API Key**: Configured in `.env`
- **Model**: Gemini 2.0 Flash
- **Purpose**: AI chat responses

### 2. Clerk Authentication ✅
- **Secret Key**: In `backend-unified/.env` (backend only)
- **Publishable Key**: In both `.env` files (safe to expose)
- **Purpose**: User authentication
- **Frontend API**: https://picked-sawfly-85.clerk.accounts.dev
- **Backend API**: https://api.clerk.com

### 3. Supabase Database ✅
- **Project URL**: https://dtgupzdmacgaaedhobhx.supabase.co
- **Service Role Key**: In `backend-unified/.env` (secret)
- **Anon Key**: In `backend-unified/.env` (public)
- **Purpose**: Database with Row-Level Security

### 4. Cloudflare R2 Storage ✅
- **Account ID**: Configured
- **Access Key ID**: Configured
- **Secret Access Key**: Configured (secret)
- **Bucket Name**: ai-doc-analyzer
- **S3 API URL**: https://56f09b52a57631e741676ed3aa16834f.r2.cloudflarestorage.com
- **Purpose**: File storage

---

## 📁 Configuration Files

### Backend: `backend-unified/.env`
```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Gemini AI
GEMINI_API_KEY=✓ Configured

# Clerk (Backend)
CLERK_SECRET_KEY=✓ Configured
CLERK_PUBLISHABLE_KEY=✓ Configured

# Supabase
SUPABASE_URL=✓ Configured
SUPABASE_SERVICE_KEY=✓ Configured
SUPABASE_ANON_KEY=✓ Configured

# Cloudflare R2
R2_ACCOUNT_ID=✓ Configured
R2_ACCESS_KEY_ID=✓ Configured
R2_SECRET_ACCESS_KEY=✓ Configured
R2_BUCKET_NAME=ai-doc-analyzer
R2_PUBLIC_URL=✓ Configured
```

### Frontend: `frontend/.env`
```env
# Clerk (Frontend)
VITE_CLERK_PUBLISHABLE_KEY=✓ Configured

# Backend API
VITE_API_URL=http://localhost:5000/api
```

---

## ⚠️ Security Notes

### Backend (.env) - SECRET KEYS:
- ✅ Gitignored
- ❌ Never commit to git
- ❌ Never share publicly
- ✅ Server-side only

**Contains:**
- Clerk Secret Key (server-side authentication)
- Supabase Service Key (full database access)
- R2 Secret Access Key (storage access)
- Gemini API Key (AI access)

### Frontend (.env) - PUBLIC KEYS:
- ✅ Gitignored (still don't commit)
- ✅ Safe to expose in browser
- ✅ Client-side usage

**Contains:**
- Clerk Publishable Key (client authentication)
- API URL (public endpoint)

---

## 🔒 Key Rotation Schedule

For production, rotate keys regularly:

### High Priority (Every 90 days):
- Clerk Secret Key
- R2 Secret Access Key

### Medium Priority (Every 180 days):
- Supabase Service Key
- Gemini API Key

### When Compromised (Immediately):
- All keys that may have been exposed
- Follow service-specific rotation procedures

---

## 📊 Service Dashboards

### Access Your Services:

1. **Clerk Dashboard**
   - URL: https://dashboard.clerk.com
   - Manage: Users, API keys, settings

2. **Supabase Dashboard**
   - URL: https://dtgupzdmacgaaedhobhx.supabase.co
   - Manage: Database, tables, RLS policies

3. **Cloudflare Dashboard**
   - URL: https://dash.cloudflare.com
   - Manage: R2 buckets, access keys

4. **Google AI Studio**
   - URL: https://aistudio.google.com
   - Manage: Gemini API keys, usage

---

## ✅ Verification

### Test Each Service:

#### 1. Gemini AI
```bash
# Start backend and check logs
cd backend-unified
npm run dev

# Should see: 🤖 Gemini API: Configured ✓
```

#### 2. Clerk
```bash
# Test authentication in frontend
# Visit: http://localhost:5173
# Check: Sign in/up functionality
```

#### 3. Supabase
```bash
# Backend should connect automatically
# Check logs for database connection
```

#### 4. R2 Storage
```bash
# Test file upload in frontend
# Upload tab → Select file → Upload
```

---

## 🎯 Setup Checklist

- [x] ✅ Gemini API Key configured
- [x] ✅ Clerk Secret Key configured (backend)
- [x] ✅ Clerk Publishable Key configured (frontend)
- [x] ✅ Supabase URL configured
- [x] ✅ Supabase Service Key configured
- [x] ✅ Supabase Anon Key configured
- [x] ✅ R2 Account ID configured
- [x] ✅ R2 Access Keys configured
- [x] ✅ R2 Bucket Name set
- [x] ✅ All keys in `.env` files
- [x] ✅ `.env` files in `.gitignore`

---

## 🚨 If Keys Are Compromised

### Immediate Actions:

1. **Rotate All Keys**
   - Generate new keys in each service
   - Update `.env` files
   - Delete old keys from services

2. **Check for Exposure**
   - Review git history
   - Check public repositories
   - Audit access logs

3. **Update Application**
   - Deploy with new keys
   - Test all functionality
   - Monitor for issues

### Key Rotation Commands:

```bash
# Clerk
1. Dashboard → API Keys → Delete old → Create new

# Supabase
1. Dashboard → Settings → API → Reset service_role key

# R2
1. Dashboard → R2 → Manage API Tokens → Delete → Create new

# Gemini
1. AI Studio → Get API key → Restrict/Delete old → Create new
```

---

## 📝 Environment Variables Summary

### Required for Backend:
```
✅ GEMINI_API_KEY
✅ CLERK_SECRET_KEY
✅ CLERK_PUBLISHABLE_KEY
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_KEY
✅ SUPABASE_ANON_KEY
✅ R2_ACCOUNT_ID
✅ R2_ACCESS_KEY_ID
✅ R2_SECRET_ACCESS_KEY
✅ R2_BUCKET_NAME
✅ R2_PUBLIC_URL
```

### Required for Frontend:
```
✅ VITE_CLERK_PUBLISHABLE_KEY
✅ VITE_API_URL
```

**Total: 13 environment variables - All configured!**

---

## ✅ Status

✅ **All Credentials Configured**
✅ **Backend `.env` Complete**
✅ **Frontend `.env` Complete**
✅ **Security Best Practices Followed**
✅ **Ready for Development & Production**

---

**Next Step:** Start both servers and test all features!
