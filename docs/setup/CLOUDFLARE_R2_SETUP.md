# ☁️ Cloudflare R2 Detailed Setup Guide

This guide details the specific steps to configure Cloudflare R2 storage, including the free tier verification requirements and exact CORS settings.

---

## Phase 1: Account Limits & Verification

### The Free Tier Deal
Cloudflare R2 allows you to store and access files cheaply.
*   **Storage:** 10 GB / month (Free)
*   **Class A Ops (Writes):** 1 Million / month (Free)
*   **Class B Ops (Reads):** 10 Million / month (Free)
*   **Egress (Bandwidth):** $0 (Free)

### ⚠️ The "Bank Card" Verification Requirement
Even if you only use the free tier, Cloudflare **REQUIRES** a valid payment method on file.
1.  **Billing Profile:** You must add a Credit or Debit card.
2.  **Why?** To verify identity and cover potential overages (though you likely won't hit them).
3.  **Charge:** You are charged **$0.00** initially.

---

## Phase 2: Create Bucket

1.  Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2.  In the sidebar, click **R2**.
3.  If prompted, click "Enable R2" and complete the billing details (Card setup).
4.  Click **"Create bucket"**.
5.  **Bucket Name:** `qa-system-storage` (Must be lowercase, unique).
6.  **Location:** Leave as `Automatic`.
7.  Click **"Create Bucket"**.

---

## Phase 3: Configure CORS (Crucial for Frontend)

Cross-Origin Resource Sharing (CORS) MUST be configured to allow your local frontend (`localhost`) to upload files.

1.  Go to your new bucket's details page.
2.  Click the **Settings** tab.
3.  Scroll down to **CORS Policy**.
4.  Click **Edit CORS Policy**.
5.  **Paste this JSON block exactly:**

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://your-production-domain.vercel.app"
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
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```
6.  Click **Save**.

---

## Phase 4: Get API Credentials

You need an Access Key ID and Secret Access Key.

1.  Go back to the main **R2 Overview** page (not inside the bucket).
2.  Look on the right sidebar for **"Manage R2 API Tokens"**. Click it.
3.  Click **"Create API token"**.
4.  **Token Name:** `qa-system-backend`.
5.  **Permissions:** Select **Object Read & Write** (Required).
6.  **TTL:** Select "Forever".
7.  Click **"Create API Token"**.

### ⚠️ Copy These Values IMMEDIATELY

You will see a screen with the keys. **You cannot see these again after closing the page.**

1.  **Access Key ID:**
    *   Looks like: `f83...`
    *   **Action:** Copy to `R2_ACCESS_KEY_ID` in `.env`.

2.  **Secret Access Key:**
    *   Looks like: `823cf...` (Long string)
    *   **Action:** Copy to `R2_SECRET_ACCESS_KEY` in `.env`.

3.  **Account ID:**
    *   It is in the endpoint URL: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
    *   Or in the URL bar: `dash.cloudflare.com/<ACCOUNT_ID>/r2`
    *   **Action:** Copy this Hex string to `R2_ACCOUNT_ID` in `.env`.

---

## Phase 5: Verification

1.  In your code (`backend-unified/.env`), ensure the `R2_BUCKET_NAME` matches exactly what you created in Phase 2.
2.  Ensure `R2_PUBLIC_URL` is set if you enabled public access in bucket settings (optional).
