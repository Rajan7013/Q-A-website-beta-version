# 🗄️ Supabase Database Detailed Setup Guide

This guide provides the **exact steps** to configure Supabase for the QA System, including the **specific SQL queries** derived from `backend-unified/supabase/NEW_PROJECT_SETUP.sql`.

---

## Phase 1: Account & Project Creation

1.  **Create Account:**
    *   Go to [supabase.com](https://supabase.com).
    *   Click **"Start your project"**.
    *   **Action:** Sign in using **GitHub**. This is the standard method for developers.

2.  **Create New Project:**
    *   Click **"New Project"**.
    *   **Organization:** Select your default org.
    *   **Name:** `qa-system` (or any name you prefer).
    *   **Database Password:** ⚠️ **Generate a strong password and SAVE IT.** You will not see it again.
    *   **Region:** Select the region closest to you (e.g., `Mumbai`, `Singapore`, `New York`) for lowest latency.
    *   **Pricing:** Select **"Free"** ($0/month).
    *   **Click:** "Create new project".

3.  **Wait for Provisioning:** It takes about 2 minutes.

---

## Phase 2: Database Schema Setup (The SQL Queries)

You must run specific SQL commands to create the tables (`users`, `documents`, `document_pages`, `chats`) and functions.

1.  In the Supabase Dashboard, look at the left sidebar.
2.  Click the **SQL Editor** icon (looks like a terminal/code block `>_`).
3.  Click **"New Query"**.
4.  **Copy and Paste the EXACT code below:**

```sql
-- 1. Enable vector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Users Table (matches Clerk IDs)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Stores Clerk User ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_quota BIGINT DEFAULT 5368709120, -- 5GB Quota
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Documents Table (Metadata)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_key TEXT NOT NULL, -- R2 Key
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  checksum TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Pages Table (Content & Vectors)
CREATE TABLE document_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector, -- For keyword search
  embedding vector(768),  -- For semantic search (768 dim for Gemini)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Chats Table (History)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row-Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies (Users see ONLY their own data)
CREATE POLICY "Users manage own data" ON users FOR ALL USING (auth.uid()::text = id);
CREATE POLICY "Users manage own docs" ON documents FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users manage own pages" ON document_pages FOR ALL USING (document_id IN (SELECT id FROM documents WHERE user_id = auth.uid()::text));
CREATE POLICY "Users manage own chats" ON chats FOR ALL USING (user_id = auth.uid()::text);

-- 8. Create Indexes (Crucial for Speed)
CREATE INDEX idx_document_pages_embedding_hnsw ON document_pages USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_document_pages_search_vector ON document_pages USING GIN(search_vector);
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

5.  Click **Run** (bottom right of the editor).
6.  You should see "Success" in the results pane.

---

## Phase 3: Get API Credentials

You need to copy these exact values into your `.env` file.

1.  Click **Settings** (Gear icon) in the sidebar.
2.  Click **API**.

### 1. Project URL
*   **Where:** Under "Project URL".
*   **Value:** Starts with `https://...` (e.g., `https://xyzproject.supabase.co`).
*   **Action:** Copy this to `SUPABASE_URL` in `.env`.

### 2. Anon Public Key
*   **Where:** Under "Project API keys" -> `anon` `public`.
*   **Value:** Long string starting with `ey...`.
*   **Usage:** Safe for frontend.
*   **Action:** Copy this to `SUPABASE_ANON_KEY` in `.env`.

### 3. Service Role Key
*   **Where:** Under "Project API keys" -> `service_role` `secret`.
*   **Action:** Click "Reveal" to see it.
*   **Usage:** **BACKEND ONLY**. Bypass RLS.
*   **Action:** Copy this to `SUPABASE_SERVICE_KEY` in `.env`.

---

## Phase 4: Verify Tables

1.  Click **Table Editor** (Grid icon) in sidebar.
2.  Verify you see:
    *   `users`
    *   `documents`
    *   `document_pages`
    *   `chats`
3.  If any are missing, go back to SQL Editor and check for errors.
