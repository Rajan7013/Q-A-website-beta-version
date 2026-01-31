# Common Troubleshooting

Solutions to common issues encountered during setup and usage.

---

## 🔴 Backend Issues

### `Error: Cannot find module 'express'`
**Cause:** Dependencies not installed.
**Fix:** Run `npm install` in `backend-unified/` folder.

### `Mongoose/MongoError`
**Fix:** We migrated to Supabase (PostgreSQL). Ensure you are NOT trying to connect to MongoDB. Check old code references.

### `Supabase Connection Refused`
**Cause:** Wrong credentials or network block.
**Fix:**
- Check `SUPABASE_URL` in `.env`.
- Check `SUPABASE_SERVICE_KEY`.
- Ensure you can access Supabase Dashboard in browser.

### `OpenAI/Gemini 429 Too Many Requests`
**Cause:** Rate limit exceeded.
**Fix:** Wait a minute. If persistent, check your quota on Google AI Studio.

---

## 🟡 Frontend Issues

### `Vite: command not found`
**Fix:** Run `npm install` in `frontend/` to install dev dependencies.

### `White Screen / Blank Page`
**Cause:** React error on startup.
**Fix:** Check Browser Console (F12). Usually a missing env variable like `VITE_CLERK_PUBLISHABLE_KEY`.

### `Upload Stuck at 0%`
**Cause:** Backend R2 connection failed or CORS issue.
**Fix:** Check Backend logs. Likely `R2_SECRET_ACCESS_KEY` is wrong or Bucket CORS not set for `localhost:5173`.

---

## 🔵 Embedding Service Issues

### `ModuleNotFoundError`
**Fix:** Activate internal virtual env or run `pip install -r requirements.txt`.

### `Dimension Mismatch`
**Cause:** Vector size in DB (e.g., 384) doesn't match model output (e.g., 768).
**Fix:** Ensure `document_pages` table uses `vector(384)` if using `all-MiniLM-L6-v2` model. This is standard in our setup.

---

## 🔒 Authentication Issues

### `Clerk: Invalid Publishable Key`
**Fix:** Check `frontend/.env`. Key must start with `pk_test_`.

### `401 Unauthorized` on API Calls
**Fix:**
- Backend `CLERK_SECRET_KEY` might be wrong.
- User might not be logged in on frontend.
