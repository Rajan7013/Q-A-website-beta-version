# 💻 Local Development Guide

How to run the entire Q&A System locally on your machine.

---

## Prerequisites (Checklist)

- [ ] **Node.js**: v18 or higher installed
- [ ] **Python**: v3.9 or higher installed
- [ ] **Git**: Installed
- [ ] **API Keys**: All keys from [API Keys Setup](../setup/API_KEYS.md)
- [ ] **Database**: Supabase configured ([Guide](../setup/SUPABASE_SETUP.md))

---

## 🚀 Running the App (3 Terminals)

Because this is a microservices architecture, you need to run 3 separate processes.

### Terminal 1: Backend API
This handles the business logic and database connections.

```bash
cd backend-unified
npm install
npm run dev
```
**Success:** You should see `🚀 Server running on port 5000`

### Terminal 2: Frontend
This runs the React user interface.

```bash
cd frontend
npm install
npm run dev
```
**Success:** You should see `Local: http://localhost:5173`

### Terminal 3: Embedding Service
This runs the Python vector generation service.

```bash
cd embedding-service
pip install -r requirements.txt
python app.py
```
**Success:** You should see `Uvicorn running on http://0.0.0.0:8001` or similar.

---

## Verification

1. Open **http://localhost:5173** in your browser.
2. Sign Up / Sign In (using Clerk).
3. Go to **Upload** page.
4. Upload a small PDF file.
5. Watch the processing status.
6. Go to **Chat** page.
7. Ask a question about the document.

---

## Common Issues

### 1. "Connection Refused"
- Check if Backend is running on port 5000.
- Check if Embedding Service is running on port 8001.

### 2. "CORS Error"
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL (http://localhost:5173).

### 3. "ImportError: no module named..."
- Ensure you activated a virtual environment for Python if you use one.
- `pip install -r requirements.txt` again.

### 4. Upload Fails
- Check Supabase keys in `backend-unified/.env`.
- Check Cloudflare R2 keys in `backend-unified/.env`.
