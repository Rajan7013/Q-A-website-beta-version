# 🚀 Setup Instructions

## Quick Setup (2 minutes)

### 1. Install Dependencies

```bash
cd backend-unified
npm install
```

### 2. Start Backend

```bash
npm run dev
```

✅ Backend runs on: `http://localhost:5000`

### 3. Start Frontend (New Terminal)

```bash
cd ../frontend
npm run dev
```

✅ Frontend runs on: `http://localhost:5173`

### 4. Test

Open browser: `http://localhost:5173`

---

## ✅ What's Already Configured

- ✅ Gemini API Key: Configured in `.env`
- ✅ CORS: Set to `http://localhost:5173`
- ✅ Port: 5000 (same as before)
- ✅ All Routes: Working with frontend

---

## 🔧 If You Need to Change Settings

Edit `.env` file:

```env
PORT=5000                                    # Backend port
FRONTEND_URL=http://localhost:5173           # Frontend URL
GEMINI_API_KEY=AIzaSyA1_4PzYWWfIlLLnoXzW6_U-LcYEOXn6XQ  # Your key
```

---

## 📊 Available Endpoints

### ✅ Health Check
```bash
curl http://localhost:5000/health
```

### ✅ Upload Document
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@/path/to/document.pdf"
```

### ✅ Chat
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"123"}'
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in .env
PORT=5001
```

### Gemini API Error

Check your API key in `.env`:
```env
GEMINI_API_KEY=AIzaSyA1_4PzYWWfIlLLnoXzW6_U-LcYEOXn6XQ
```

### Frontend Can't Connect

1. Make sure backend is running on port 5000
2. Check frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

---

## ✅ Success Indicators

When backend starts, you should see:

```
🚀 Server running on port 5000
📡 CORS enabled for: http://localhost:5173
🤖 Gemini API: Configured ✓
🌍 Environment: development
```

---

## 🎯 Next Steps

1. ✅ Upload a document
2. ✅ Ask questions
3. ✅ Test all features

Everything should work exactly like before!
