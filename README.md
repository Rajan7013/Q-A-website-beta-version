# 🤖 AI Q&A System - Project Documentation

**The Complete Guide to the Architecture, Setup, and Development of the Q&A System.**

> **READ THIS FIRST:** This project is a complex, multi-service application (Frontend, Backend, AI, Database, Storage). Success depends on following the **detailed guides** linked below.

---

## 📚 Table of Contents

1.  [Concept & Architecture](#-concept--architecture)
2.  [Detailed Setup Guides](#-detailed-setup-guides-step-by-step)
3.  [Project Structure](#-project-structure-minute-details)
4.  [How to Collaborate](#-how-to-collaborate)
5.  [Update Strategy](#-update-strategy)

---

## 🏛️ Concept & Architecture

This system allows a user to **chat with their documents**.
*   **Flow:** Upload PDF -> Extract Text -> Generate Vectors (AI) -> Store in DB -> User Asks Question -> Search Vectors -> Generate Answer.

### Key Components (How we use them)
*   **Frontend (React):** The user interface. It talks to the Backend API.
*   **Backend (Node.js):** The "brain". It orchestrates Supabase, Cloudflare R2, and Gemini AI.
*   **Supabase (PostgreSQL):** Stores *metadata* (filenames) and *embeddings* (the mathematical representation of text).
*   **Cloudflare R2:** Stores the *actual* PDF files cheaply (10GB free).
*   **Clerk:** Handles who is logging in.

👉 **[Read SYSTEM_ARCHITECTURE.md for the full diagram](docs/architecture/SYSTEM_ARCHITECTURE.md)**

---

## �️ Detailed Setup Guides (Step-by-Step)

To run this project, you must configure 3 external services. We have minute-by-minute guides for each:

### 1. Database (Supabase) 🗄️
*   **Goal:** Create tables and get API keys.
*   **Details:** We use specific SQL queries to create `documents` and `document_pages` tables with `vector` support.
*   👉 **[READ: Supabase Detailed Setup](docs/setup/SUPABASE_SETUP.md)**

### 2. Authentication (Clerk) 🔐
*   **Goal:** Allow users to log in with Google.
*   **Details:** Configure "Publishable Key" (Frontend) and "Secret Key" (Backend).
*   👉 **[READ: Clerk Detailed Setup](docs/setup/CLERK_SETUP.md)**

### 3. File Storage (Cloudflare R2) ☁️
*   **Goal:** Store user PDFs for free.
*   **Details:** Includes instructions on **Bank Card Verification** (Required for free tier) and **CORS JSON** settings.
*   👉 **[READ: Cloudflare R2 Detailed Setup](docs/setup/CLOUDFLARE_R2_SETUP.md)**

### 4. API Keys (Gemini/Groq) 🔑
*   **Goal:** Give the AI its intelligence.
*   👉 **[READ: API Keys Guide](docs/setup/API_KEYS.md)**

---

## 📁 Project Structure (Minute Details)

Understanding the folder structure is key to "minute details" collaboration.

```
root/
├── backend-unified/           # THE BACKEND SERVER
│   ├── src/
│   │   ├── server.js          # Entry point (port 5000)
│   │   ├── routes/            # API Endpoints
│   │   │   ├── chat.js        # The Main QA Logic (Prompt Engineering)
│   │   │   └── upload.js      # Handles file uploads to R2
│   │   └── supabase/
│   │       └── NEW_PROJECT_SETUP.sql  # The Database Schema Source of Truth
│   └── .env                   # BE CAREFUL (Contains Secret Keys)
│
├── frontend/                  # THE UI
│   ├── src/
│   │   ├── components/        # React Components
│   │   └── utils/
│   │       └── api.js         # Frontend-to-Backend Connection Logic
│   └── .env                   # Contains Public Keys
│
└── docs/                      # DOCUMENTATION HUB
    ├── setup/                 # Service Guides
    ├── architecture/          # Design Docs
    └── contributing/          # How to push code
```

---

## 🤝 How to Collaborate

Anyone can collaborate! Here is the process:

1.  **Read the Docs:** Specifically the **Setup Guides** above.
2.  **Pull the Code:** `git clone ...`
3.  **Cross-Check:** Always look at `backend-unified/src/server.js` to see what the server is actually doing.
4.  **Database Updates:** If you change the database, update `backend-unified/supabase/NEW_PROJECT_SETUP.sql`. This is our "Source of Truth".

👉 **[Read CONTRIBUTING.md](docs/contributing/CONTRIBUTING.md)**

---

## 🔄 Update Strategy

**How do we update the system without breaking things?**

1.  **Database Changes:**
    *   NEVER delete tables.
    *   ALWAYS write an `.sql` migration file (e.g., `ALTER TABLE users ADD column...`).
    *   Test it in Supabase SQL Editor first.

2.  **Frontend Updates:**
    *   Frontend relies on Backend APIs.
    *   If you change a Backend API response, check `frontend/src/utils/api.js` to ensure the frontend can handle it.

---

## 🚀 Quick Start Commands

Once you have followed the **Setup Guides** and filled your `.env` files:

**Terminal 1 (Backend):**
```bash
cd backend-unified
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

**Open Browser:** [http://localhost:5173](http://localhost:5173)
