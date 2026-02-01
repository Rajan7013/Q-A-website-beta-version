# 🚀 DocMind AI - Production Deployment Guide

This guide explains specifically how to deploy the **Frontend**, **Backend**, and **Embedding Service** from this **single GitHub repository** (Monorepo).

**Crucial Concept:** Even though all code is in one repo, you will create **3 separate "Projects" or "Services"** in your cloud providers (Vercel/Render). Each service will be told to look only at its specific folder.

---

## 1. Frontend Deployment (Vercel)

**Goal:** Hosted at `https://rajan-docai.vercel.app`

1.  **Go to Vercel Dashboard**: Click **"Add New..."** -> **"Project"**.
2.  **Import Git Repository**: Select your `qa-system` repo.
3.  **Configure Project** (CRITICAL STEP):
    *   **Framework Preset:** `Vite`
    *   **Root Directory:** Click "Edit" and select `frontend`. **(Do not leave this as `./`)**
4.  **Build & Output Settings** (Should auto-detect, but verify):
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
5.  **Environment Variables**:
    *   Copy *public* variables from `frontend/.env`.
    *   `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_...`
    *   `VITE_API_URL`: **Leave blank for now** (We update this after backend deploys).
6.  Click **Deploy**.

---

## 2. Backend Deployment (Render)

**Goal:** Hosted at `https://qa-backend.onrender.com`

1.  **Go to Render Dashboard**: Click **New +** -> **Web Service**.
2.  **Connect Repo**: Select `qa-system`.
3.  **Settings** (Minute Details):
    *   **Name:** `qa-system-backend`
    *   **Region:** `Oregon` (or closest to specific R2/Supabase region).
    *   **Branch:** `main`
    *   **Root Directory:** `backend-unified` **(CRITICAL: The server lives here)**.
    *   **Runtime:** `Node` (Ensure Node 18+)
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Plan:** `Free` (Note: It spins down after 15 mins inactivity).
4.  **Environment Variables** (Copy ALL from `backend-unified/.env`):
    *   `NODE_ENV`: `production`
    *   `GEMINI_API_KEY`: `...`
    *   `CLERK_SECRET_KEY`: `...`
    *   `SUPABASE_SERVICE_KEY`: `...` (The `service_role` key, not `anon`)
    *   `Supabase_URL`: `...`
    *   `R2_ACCESS_KEY_ID`: `...`
    *   `R2_SECRET_ACCESS_KEY`: `...`
    *   `R2_BUCKET_NAME`: `qa-system-storage`
    *   `CORS_ORIGIN`: `https://rajan-docai.vercel.app` (The Frontend URL from Step 1).
    *   `CLOUDFLARE_ENDPOINT`: `https://<account_id>.r2.cloudflarestorage.com` (If not using auto-inference)
5.  Click **Create Web Service**.

**Wait:** It takes 2-3 minutes. Once live, copy the URL (e.g., `https://qa-backend.onrender.com`).

---

## 3. Embedding Service Deployment (Render)

**Goal:** Hosted at `https://qa-embedding.onrender.com` (Internal Microservice)

1.  **Go to Render Dashboard**: Click **New +** -> **Web Service** (Yes, a second one).
2.  **Connect Repo**: Select `qa-system` (Same repo again).
3.  **Settings**:
    *   **Name:** `qa-system-embedding`
    *   **Root Directory:** `embedding-service` **(CRITICAL)**.
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
4.  **Environment Variables**:
    *   `GEMINI_API_KEY`: `...` (If it uses Gemini directly).
    *   `API_SECRET`: Create a random password (e.g., `my-super-secret-password`).
5.  Click **Create Web Service**.

**Copy URL:** e.g., `https://qa-embedding.onrender.com`.

---

## 4. Final Wiring (Connecting Them)

Now that everything is deployed, we need to link them.

### A. Tell Backend where Embedding Service is
1.  Go to **Render (Backend Service)** -> **Environment**.
2.  Add/Edit `EMBEDDING_SERVICE_URL`: `https://qa-embedding.onrender.com`.
3.  Add `EMBEDDING_SERVICE_SECRET`: `my-super-secret-password` (from Step 3).
4.  **Save Changes** (This restarts the backend).

### B. Tell Frontend where Backend is
1.  Go to **Vercel (Frontend Project)** -> **Settings** -> **Environment Variables**.
2.  Add `VITE_API_URL`: `https://qa-backend.onrender.com/api` (Don't forget `/api`).
3.  **Redeploy:** Go to **Deployments** tab -> Click the 3 dots on latest -> **CORS Redeploy**.

---

## 5. Troubleshooting Monorepo Issues

### "Command not found" or "File not found"
*   **Cause:** You likely didn't set the **Root Directory** correctly in Render/Vercel.
*   **Fix:** Ensure it points to `backend-unified` or `frontend`, NOT the root (`./`).

### frontend CORS Errors (`Access Control Allow Origin`)
*   **Cause:** The Backend doesn't know the Frontend URL.
*   **Fix:** Check `CORS_ORIGIN` in Render (Backend) matches your Vercel URL exactly (no trailing slash).

### "Module not found" in Backend
*   **Cause:** `npm install` didn't run in the right folder.
*   **Fix:** In Render settings, ensure Root Directory is `backend-unified`.
