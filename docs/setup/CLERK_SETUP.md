# 🔐 Clerk Authentication Detailed Setup

This guide covers the exact steps to acquire keys and configure paths for Clerk Authentication in this project.

---

## Phase 1: Application Setup

1.  Go to [clerk.com](https://clerk.com) and Sign In.
2.  Click **"Create Application"**.
3.  **App Name:** `QA System` (This will appear on login screens).
4.  **Authentication Options:**
    *   Toggle **"Google"** (Recommended).
    *   Toggle **"Email"**.
    *   Toggle **"GitHub"** (Optional).
5.  Click **"Create Application"**.

---

## Phase 2: Get API Keys

You will be redirected to the "API Keys" page immediately after creation.

### 1. Publishable Key (FRONTEND ONLY)
*   **Look for:** `pk_test_...`
*   **Usage:** This goes in `frontend/.env`.
*   **Variable:** `VITE_CLERK_PUBLISHABLE_KEY`
*   **Example Value:** `pk_test_aHlyZC1tYWNhcXVlLTI1LmNsZXJrLmFjY291bnRzLmRldiQ`
*   **Note:** This key is NOT needed in the backend.

### 2. Secret Key (BACKEND ONLY)
*   **Look for:** `sk_test_...`
*   **Action:** Click the "Eye" icon to reveal.
*   **Usage:** This goes in `backend-unified/.env`.
*   **Variable:** `CLERK_SECRET_KEY`
*   **Example Value:** `sk_test_8A7s...` (Do not share this).
*   **Note:** This key is NOT needed in the frontend.

---

## Phase 3: Application Paths

For this application to route users correctly, verify these settings:

1.  In Clerk Dashboard, go to **Configure** -> **Paths**.
2.  Verify the following default paths (Update if different):
    *   **Sign In:** `/sign-in`
    *   **Sign Up:** `/sign-up`
    *   **After Sign In:** `/` (Home page)
    *   **After Sign Up:** `/` (Home page)

---

## Phase 4: Integration Verification

### Frontend Code Check
In `frontend/src/main.jsx`, the app wraps everything in `<ClerkProvider>`:
```javascript
<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```
Ensure your `frontend/.env` key matches the one from Phase 2.

### Backend Code Check
In `backend-unified/src/middleware/auth.js` (or similar), the backend verifies the token using the Secret Key.
Ensure your `backend-unified/.env` Secret Key is correct, or all API requests will return `401 Unauthorized`.
