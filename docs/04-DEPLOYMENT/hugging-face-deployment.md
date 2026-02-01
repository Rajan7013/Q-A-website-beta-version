# 🦅 Embedding Service Deployment (Hugging Face Spaces)

This guide explains how to deploy the Python Embedding Service to **Hugging Face Spaces** for free.

## Why Hugging Face Spaces?

Our embedding service uses **PyTorch** and **Sentence Transformers**, which require:
- **RAM**: ~1-2 GB (loading models)
- **Disk**: ~1 GB (PyTorch + Models)
- **CPU**: Decent power for inference

### Comparison
| Platform | Free Tier Limits | Suitable? |
|----------|-----------------|-----------|
| **Vercel** | 250MB size limit | ❌ No |
| **Render** | 512MB RAM | ❌ No (OOM) |
| **Hugging Face** | **2 vCPU, 16GB RAM** | ✅ **YES** |

---

## 🚀 Deployment Steps

### 1. Create a Hugging Face Account
Go to [huggingface.co](https://huggingface.co/) and sign up.

### 2. Create a New Space
1. Click **+ New Space** (top right).
2. **Space Name**: `qa-embedding-service` (or similar).
3. **License**: MIT.
4. **Select SDK**: **Docker** (Important!).
5. **Space Hardware**: **CPU Basic (Free)** (2 vCPU, 16GB RAM).
6. Click **Create Space**.

### 3. Setup the Repository
You have two options: **Mirroring** or **Direct Push**. We recommend **Direct Push**.

#### Option A: Direct Upload (Easiest)
1. In your new Space, go to **Files**.
2. Click **Add file** -> **Upload files**.
3. Upload all files from the `embedding-service/` folder:
   - `Dockerfile`
   - `requirements.txt`
   - `server.py`
   - `models.py`
   - `cache.py`
   - `.dockerignore`
4. Click **Commit changes**.

#### Option B: Git Push (Best for Developers)
1. Clone your Space locally:
   ```bash
   git clone https://huggingface.co/spaces/<your-username>/qa-embedding-service
   ```
2. Copy the contents of `embedding-service/` into this folder.
3. Push changes:
   ```bash
   git add .
   git commit -m "Initial deploy"
   git push
   ```

### 4. Verify Configuration
Ensure your `Dockerfile` exposes port **7860** (Hugging Face default).
*We have already configured the Dockerfile in this repo to use port 7860.*

```dockerfile
# ... inside Dockerfile
EXPOSE 7860
# ...
```

### 5. Wait for Build
1. Go to the **App** tab in your Space.
2. You will see "Building..." generic logs.
3. Wait ~3-5 minutes for it to download PyTorch and models.
4. Once ready, you will see "Running".

### 6. Get Your Public URL
Your embedding service is now live!
- The URL format is: `https://<your-username>-<space-name>.hf.space`
- Example: `https://rajan7013-qa-embedding-service.hf.space`

---

## 🔗 Connect to Backend

Now update your **Backend** environment variables.

1. Open `backend-unified/.env` (locally) or your Backend Deployment Variables (Railway/Render).
2. Update `EMBEDDING_SERVICE_URL`:

```env
# Local Development
# EMBEDDING_SERVICE_URL=http://localhost:7860

# Production (Hugging Face)
EMBEDDING_SERVICE_URL=https://<your-username>-<space-name>.hf.space
```

3. Redeploy your Backend.

---

## 🐛 Troubleshooting

### "Runtime Error" / "Build Failed"
- Check **Logs** tab in Hugging Face.
- Ensure `requirements.txt` is present.
- Ensure `Dockerfile` is correct.

### "Connection Refused"
- Ensure your backend uses `https://` (not `http://`) for the HF URL.
- Ensure the Space status is **Running**.

### "Sleeping"
- Free Spaces "sleep" after 48h of inactivity.
- Any request wakes them up (takes ~30s).
- **Pro Tip**: Use a cron job (like GitHub Actions) to ping it once a day to keep it warm, or upgrade to **CPU Upgrade** ($9/mo) for always-on.
