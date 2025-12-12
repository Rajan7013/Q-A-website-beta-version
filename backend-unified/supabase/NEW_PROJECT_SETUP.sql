-- ===============================================
-- NEW SUPABASE PROJECT - COMPLETE SETUP
-- ===============================================
-- 
-- Run this in your NEW Supabase project
-- This is the ONLY file you need to run!
-- 
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ===============================================
-- CREATE TABLES
-- ===============================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_quota BIGINT DEFAULT 5368709120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  checksum TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  public_sharing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  confidence FLOAT DEFAULT 0.0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- CREATE INDEXES
-- ===============================================

CREATE INDEX idx_document_pages_search_vector ON document_pages USING GIN(search_vector);
CREATE INDEX idx_document_pages_embedding_hnsw ON document_pages USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_document_pages_document_id ON document_pages(document_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_user_status ON documents(user_id, status);
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- ===============================================
-- CREATE FUNCTIONS
-- ===============================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_pages_search_vector_update
  BEFORE INSERT OR UPDATE OF content ON document_pages
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SEARCH FUNCTIONS
-- ===============================================

CREATE OR REPLACE FUNCTION hybrid_search_ultimate(
    doc_ids UUID[],
    search_query TEXT,
    query_embedding vector(768),
    result_limit INT DEFAULT 100,
    keyword_weight FLOAT DEFAULT 0.3,
    semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    document_id UUID,
    document_name TEXT,
    page_number INT,
    content TEXT,
    keyword_score FLOAT,
    semantic_score FLOAT,
    combined_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    keyword_results AS (
        SELECT dp.document_id, d.filename, dp.page_number, dp.content,
               ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as k_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE dp.document_id = ANY(doc_ids) AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ),
    semantic_results AS (
        SELECT dp.document_id, d.filename, dp.page_number, dp.content,
               1 - (dp.embedding <=> query_embedding) as s_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE dp.document_id = ANY(doc_ids) AND dp.embedding IS NOT NULL
    )
    SELECT 
        COALESCE(k.document_id, s.document_id) as document_id,
        COALESCE(k.filename, s.filename) as document_name,
        COALESCE(k.page_number, s.page_number) as page_number,
        COALESCE(k.content, s.content) as content,
        COALESCE(k.k_score, 0) as keyword_score,
        COALESCE(s.s_score, 0) as semantic_score,
        (COALESCE(k.k_score, 0) * keyword_weight + COALESCE(s.s_score, 0) * semantic_weight) as combined_score
    FROM keyword_results k
    FULL OUTER JOIN semantic_results s ON k.document_id = s.document_id AND k.page_number = s.page_number
    WHERE (COALESCE(k.k_score, 0) > 0 OR COALESCE(s.s_score, 0) > 0.3)
    ORDER BY combined_score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION hybrid_search_all_user_documents(
    user_uuid TEXT,
    search_query TEXT,
    query_embedding vector(768),
    result_limit INT DEFAULT 100,
    keyword_weight FLOAT DEFAULT 0.3,
    semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    document_id UUID,
    document_name TEXT,
    page_number INT,
    content TEXT,
    keyword_score FLOAT,
    semantic_score FLOAT,
    combined_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    keyword_results AS (
        SELECT dp.document_id, d.filename, dp.page_number, dp.content,
               ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as k_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE d.user_id = user_uuid AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ),
    semantic_results AS (
        SELECT dp.document_id, d.filename, dp.page_number, dp.content,
               1 - (dp.embedding <=> query_embedding) as s_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE d.user_id = user_uuid AND dp.embedding IS NOT NULL
    )
    SELECT 
        COALESCE(k.document_id, s.document_id) as document_id,
        COALESCE(k.filename, s.filename) as document_name,
        COALESCE(k.page_number, s.page_number) as page_number,
        COALESCE(k.content, s.content) as content,
        COALESCE(k.k_score, 0) as keyword_score,
        COALESCE(s.s_score, 0) as semantic_score,
        (COALESCE(k.k_score, 0) * keyword_weight + COALESCE(s.s_score, 0) * semantic_weight) as combined_score
    FROM keyword_results k
    FULL OUTER JOIN semantic_results s ON k.document_id = s.document_id AND k.page_number = s.page_number
    WHERE (COALESCE(k.k_score, 0) > 0 OR COALESCE(s.s_score, 0) > 0.3)
    ORDER BY combined_score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION search_document_pages_fast(
    doc_ids UUID[],
    search_query TEXT,
    result_limit INT DEFAULT 1000
)
RETURNS TABLE (
    document_id UUID,
    document_name TEXT,
    page_number INT,
    content TEXT,
    rank FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT dp.document_id, d.filename as document_name, dp.page_number, dp.content,
           ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as rank
    FROM document_pages dp
    JOIN documents d ON dp.document_id = d.id
    WHERE dp.document_id = ANY(doc_ids) AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION search_all_user_documents(
    user_uuid TEXT,
    search_query TEXT,
    result_limit INT DEFAULT 1000
)
RETURNS TABLE (
    document_id UUID,
    document_name TEXT,
    page_number INT,
    content TEXT,
    rank FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT dp.document_id, d.filename as document_name, dp.page_number, dp.content,
           ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as rank
    FROM document_pages dp
    JOIN documents d ON dp.document_id = d.id
    WHERE d.user_id = user_uuid AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- RLS POLICIES
-- ===============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data" ON users FOR ALL USING (
  auth.uid()::text = id OR id = current_setting('request.jwt.claims', true)::json->>'sub'
);

CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (
  user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub')
  OR public_sharing = true
);

CREATE POLICY "Users can manage own pages" ON document_pages FOR ALL USING (
  document_id IN (
    SELECT id FROM documents
    WHERE user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

CREATE POLICY "Users can manage own chats" ON chats FOR ALL USING (
  user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub')
);

-- ===============================================
-- GRANT PERMISSIONS
-- ===============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- ===============================================
-- OPTIMIZE
-- ===============================================

ANALYZE users;
ANALYZE documents;
ANALYZE document_pages;
ANALYZE chats;

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 NEW PROJECT SETUP COMPLETE!';
    RAISE NOTICE '✅ Tables created with embedding column';
    RAISE NOTICE '✅ All indexes created';
    RAISE NOTICE '✅ All search functions created';
    RAISE NOTICE '✅ RLS policies enabled';
    RAISE NOTICE '🚀 Update .env and restart backend!';
END $$;
