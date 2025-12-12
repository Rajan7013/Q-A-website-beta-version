# 🚀 Quick Commands Reference

## ❌ WRONG Directory (Don't use these)

```bash
cd backend              ❌ OLD - Don't use
cd backend-saas         ❌ OLD - Don't use
```

---

## ✅ CORRECT Commands (Use these)

### Start Backend:
```bash
cd "C:\Users\rajan\QA System\backend-unified"
npm run dev
```

**Or from QA System directory:**
```bash
cd backend-unified
npm run dev
```

### Start Frontend (New Terminal):
```bash
cd "C:\Users\rajan\QA System\frontend"
npm run dev
```

**Or from QA System directory:**
```bash
cd frontend
npm run dev
```

---

## 📁 Directory Structure

```
C:\Users\rajan\QA System\
├── backend-unified\     ✅ USE THIS (new working backend)
├── frontend\            ✅ USE THIS (no changes)
├── backend\            ❌ OLD (can delete)
└── backend-saas\       ❌ OLD (can delete)
```

---

## 🎯 Step by Step

### Terminal 1 - Backend:
```cmd
C:\Users\rajan\QA System> cd backend-unified
C:\Users\rajan\QA System\backend-unified> npm run dev
```

You'll see:
```
🚀 Server running on port 5000
📡 CORS enabled for: http://localhost:5173
🤖 Gemini API: Configured ✓
```

### Terminal 2 - Frontend:
```cmd
C:\Users\rajan\QA System> cd frontend
C:\Users\rajan\QA System\frontend> npm run dev
```

---

## 🐛 Common Mistakes

### ❌ Mistake 1: Wrong Directory
```cmd
C:\Users\rajan\QA System\backend> npm run dev
                         ^^^^^^^ WRONG!
```

**Fix:**
```cmd
C:\Users\rajan\QA System> cd backend-unified
C:\Users\rajan\QA System\backend-unified> npm run dev
                         ^^^^^^^^^^^^^^^ CORRECT!
```

### ❌ Mistake 2: Not in QA System Directory
```cmd
C:\Users\rajan> cd backend-unified
ERROR: Cannot find path
```

**Fix:**
```cmd
C:\Users\rajan> cd "QA System"
C:\Users\rajan\QA System> cd backend-unified
C:\Users\rajan\QA System\backend-unified> npm run dev
```

---

## 🔧 Port Already in Use?

If you see "Port 5000 already in use":

```cmd
npx kill-port 5000
```

Then try starting again.

---

## ✅ Correct Full Path Commands

### Backend:
```cmd
cd "C:\Users\rajan\QA System\backend-unified"
npm run dev
```

### Frontend:
```cmd
cd "C:\Users\rajan\QA System\frontend"
npm run dev
```

---

## 📝 Summary

**Always remember:**
- ✅ Use `backend-unified` (not `backend`)
- ✅ Navigate to correct directory first
- ✅ Run `npm run dev` (not `npm start`)

---

## 🎯 Quick Copy-Paste

**Backend:**
```cmd
cd "C:\Users\rajan\QA System\backend-unified" && npm run dev
```

**Frontend:**
```cmd
cd "C:\Users\rajan\QA System\frontend" && npm run dev
```

---

**Current Status:** Backend should be running now on port 5000!

Check terminal for:
```
🚀 Server running on port 5000
```
