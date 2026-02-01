-- =========================================================
-- MIGRATION: 768 Dimensions (BGE) -> 384 Dimensions (MiniLM)
-- Run this in Supabase SQL Editor to fix the dimension mismatch
-- =========================================================

-- 1. Drop existing indexes (they are bound to dimension size)
drop index if exists documents_embedding_idx;
drop index if exists document_pages_embedding_idx;

-- 2. Resize columns (This clears existing embeddings, which is fine as they are incompatible)
-- Note: 'vector(384)' automatically casts existing data if possible, but 
-- resizing usually requires re-embedding. Since we are changing models completely, 
-- we reset the columns to NULL to avoid "dimension mismatch" errors on insert.
update documents set embedding = null;
update document_pages set embedding = null;

alter table documents 
  alter column embedding type vector(384);

alter table document_pages 
  alter column embedding type vector(384);

-- 3. Re-create indexes for better performance
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index on document_pages using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ✅ Verify the change
select 
    column_name, 
    data_type, 
    udt_name 
from information_schema.columns 
where table_name = 'documents' and column_name = 'embedding';
