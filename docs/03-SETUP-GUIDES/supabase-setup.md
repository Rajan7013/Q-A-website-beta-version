# 🗄️ Supabase Setup Guide

This project uses **Supabase** for:
1. **PostgreSQL Database** (Storing users, documents, chats)
2. **pgvector** (Storing AI embeddings)
3. **Row Level Security** (Data isolation)

---

## 1. Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Enter details:
   - **Name**: `qa-system`
   - **Database Password**: Generate a strong password (save it!).
   - **Region**: Choose one close to you (e.g., Mumbai, Singapore).
4. Click **Create new project**.

---

## 2. Setup Database Schema
1. Once the project is ready, go to **SQL Editor** (left sidebar).
2. Click **+ New Query**.
3. Copy the content of the SQL script below:

```sql
-- Enable Vector Extension
create extension if not exists vector;

-- 1. DOCUMENTS TABLE
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  type text not null,
  size bigint,
  url text not null,
  embedding vector(768), -- Summarized doc embedding
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. DOCUMENT PAGES (CHUNKS)
create table if not exists document_pages (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  user_id text not null,
  content text not null,
  page_number integer,
  embedding vector(768), -- Chunk embedding
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CHAT SESSIONS
create table if not exists chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CHAT MESSAGES
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb, -- Stores citations
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES (Crucial for performance)
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
create index on document_pages using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

4. Click **Run** (bottom right).
5. You should see "Success".

---

## 3. Enable Row Level Security (RLS)
RLS ensures users only see *their own* data.

1. Still in SQL Editor, clear the editor and run this:

```sql
-- Enable RLS
alter table documents enable row level security;
alter table document_pages enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Create Policies
-- DOCUMENTS
create policy "Users can see own documents"
  on documents for select
  using (auth.uid()::text = user_id);

create policy "Users can insert own documents"
  on documents for insert
  with check (auth.uid()::text = user_id);

create policy "Users can delete own documents"
  on documents for delete
  using (auth.uid()::text = user_id);

-- PAGES
create policy "Users can see own pages"
  on document_pages for select
  using (auth.uid()::text = user_id);

-- SESSIONS & MESSAGES (Similar pattern)
-- (Ideally, we use Clerk ID, so we map 'user_id' text column to match Clerk's ID)
```

> **Note**: Since we handle Auth logic in the backend (using Clerk), the backend uses `SUPABASE_SERVICE_KEY` which creates a "superuser" client that bypasses RLS. The backend application logic enforces user isolation. RLS is an extra layer of defense if you use Supabase Auth directly.

---

## 4. Get API Keys
1. Go to **Project Settings** (cog icon) -> **API**.
2. Find **Project URL** -> `SUPABASE_URL`.
3. Find **Project API Keys**:
   - `anon` -> `SUPABASE_ANON_KEY` (Public)
   - `service_role` -> `SUPABASE_SERVICE_KEY` (Secret - **Backend Only**)

---

## 5. Configure Environment
Update your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```
