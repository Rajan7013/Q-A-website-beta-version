# ☁️ Cloudflare R2 Setup (Object Storage)

We use **Cloudflare R2** to store uploaded documents safely. It's S3-compatible and cheaper than AWS (10GB free/month).

---

## 1. Enable R2
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **R2** (left sidebar).
3. If first time, you may need to add a payment card (You won't be charged for the free tier). Enables the 10GB free plan.

---

## 2. Create Bucket
1. Click **Create Bucket**.
2. **Name**: `qa-system-documents`.
3. **Location**: **Automatic** or nearest region.
4. Click **Create Bucket**.
5. **Public Access**: Leave **Disabled** (Private). We use signed URLs/API for access.

---

## 3. Configure CORS (Critical!)
This allows your frontend/backend to upload files.

1. Go to your bucket (`qa-system-documents`).
2. Click **Settings** tab.
3. Scroll to **CORS Policy**.
4. Click **Add CORS Policy**.
5. Paste this JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-production-app.vercel.app" 
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```
> **Note**: Update the URL list with your actual Vercel/Railway domains later.

---

## 4. Create API Token
1. Go back to R2 Overview.
2. Click **Manage R2 API Tokens** (right side).
3. Click **Create API Token**.
4. **Token Name**: `qa-system-backend`.
5. **Permissions**: **Object Read & Write**.
6. **Specific Bucket**: Select `qa-system-documents` (Safer than giving access to all).
7. Click **Create API Token**.

---

## 5. Copy Secrets
**⚠️ IMPORTANT**: This is the ONLY time you see these secrets. Save them!

You need 4 values:
1. **Access Key ID**: `R2_ACCESS_KEY_ID`
2. **Secret Access Key**: `R2_SECRET_ACCESS_KEY`
3. **Account ID**: Found in the Overview page URL or dashboard.
4. **Bucket Name**: `qa-system-documents`

---

## 6. Configure Environment
Update `backend-unified/.env`:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=qa-system-documents
```
