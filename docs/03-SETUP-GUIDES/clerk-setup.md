# 🔐 Clerk Authentication Setup

We use **Clerk** for secure user management (Sign In, Sign Up, User Profiles).

---

## 1. Create Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/).
2. Click **Create Application**.
3. **Application Name**: `qa-system`.
4. **Authentication Methods**:
   - ✅ Email
   - ✅ Google (Optional)
   - ✅ GitHub (Optional)
5. Click **Create Application**.

---

## 2. Get API Keys
1. You will be redirected to the "API Keys" page.
2. Copy the keys provided:
   - `Publishable Key` -> `CLERK_PUBLISHABLE_KEY` (Frontend)
   - `Secret Key` -> `CLERK_SECRET_KEY` (Backend)

---

## 3. Configure Environment

### Backend
Add to `backend-unified/.env`:
```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Frontend
Add to `frontend/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## 4. Production Settings (Deployment)
When deploying to production (Vercel/Railway), you need to update Clerk paths.

1. Go to **Paths** in Clerk Dashboard.
2. If deploying to a custom domain (e.g., `myapp.com`), configured it here.
3. For Vercel/Render, usually the defaults work fine or stick to "Development" mode until you have a real domain.
