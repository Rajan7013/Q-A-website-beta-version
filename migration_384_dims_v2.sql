-- =========================================================
-- MIGRATION V2: Fix Dimension Failure
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Resize 'document_pages' (The critical table for search)
-- First clean up old data to avoid type errors
update document_pages set embedding = null;

-- Resize column to 384 dimensions
alter table document_pages 
  alter column embedding type vector(384);

-- Re-create index
drop index if exists document_pages_embedding_idx;
create index on document_pages using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);


-- 2. Handle 'documents' table (Safely)
-- This block checks if the column exists. 
-- If YES -> Update it. If NO -> Create it.
do $$
begin
  if exists(select column_name from information_schema.columns where table_name='documents' and column_name='embedding') then
    -- Column exists, resize it
    update documents set embedding = null;
    alter table documents alter column embedding type vector(384);
  else
    -- Column missing, create it
    alter table documents add column embedding vector(384);
  end if;
end $$;

-- Re-create index for documents if it exists
drop index if exists documents_embedding_idx;
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ✅ Verify the change
select table_name, column_name, udt_name 
from information_schema.columns 
where column_name = 'embedding' 
and table_name in ('documents', 'document_pages');
