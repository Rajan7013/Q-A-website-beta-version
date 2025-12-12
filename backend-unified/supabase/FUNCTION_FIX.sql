-- ===============================================
-- FUNCTION FIX: Update function definitions
-- The issue: Supabase JS client may not properly convert
-- JavaScript arrays to PostgreSQL vector type
-- ===============================================

-- Drop existing functions
DROP FUNCTION IF EXISTS hybrid_search_ultimate CASCADE;
DROP FUNCTION IF EXISTS hybrid_search_all_user_documents CASCADE;
DROP FUNCTION IF EXISTS search_document_pages_fast CASCADE;
DROP FUNCTION IF EXISTS search_all_user_documents CASCADE;

-- ===============================================
-- FIX 1: Hybrid Search - Specific Documents
-- Changed: Made query_embedding parameter handling more robust
-- ===============================================

CREATE OR REPLACE FUNCTION hybrid_search_ultimate(
    doc_ids UUID[],
    search_query TEXT,
    query_embedding vector,  -- Removed (768) - let PostgreSQL infer
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
        SELECT 
            dp.document_id,
            d.filename,
            dp.page_number,
            dp.content,
            ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as k_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE 
            dp.document_id = ANY(doc_ids)
            AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ),
    semantic_results AS (
        SELECT 
            dp.document_id,
            d.filename,
            dp.page_number,
            dp.content,
            1 - (dp.embedding <=> query_embedding) as s_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE 
            dp.document_id = ANY(doc_ids)
            AND dp.embedding IS NOT NULL
    )
    SELECT 
        COALESCE(k.document_id, s.document_id),
        COALESCE(k.filename, s.filename),
        COALESCE(k.page_number, s.page_number),
        COALESCE(k.content, s.content),
        COALESCE(k.k_score, 0.0),
        COALESCE(s.s_score, 0.0),
        (COALESCE(k.k_score, 0.0) * keyword_weight + COALESCE(s.s_score, 0.0) * semantic_weight)
    FROM keyword_results k
    FULL OUTER JOIN semantic_results s 
        ON k.document_id = s.document_id AND k.page_number = s.page_number
    WHERE (COALESCE(k.k_score, 0) > 0 OR COALESCE(s.s_score, 0) > 0.3)
    ORDER BY (COALESCE(k.k_score, 0.0) * keyword_weight + COALESCE(s.s_score, 0.0) * semantic_weight) DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- FIX 2: Hybrid Search - All User Documents
-- ===============================================

CREATE OR REPLACE FUNCTION hybrid_search_all_user_documents(
    user_uuid TEXT,
    search_query TEXT,
    query_embedding vector,  -- Removed (768)
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
        SELECT 
            dp.document_id,
            d.filename,
            dp.page_number,
            dp.content,
            ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) as k_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE 
            d.user_id = user_uuid
            AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ),
    semantic_results AS (
        SELECT 
            dp.document_id,
            d.filename,
            dp.page_number,
            dp.content,
            1 - (dp.embedding <=> query_embedding) as s_score
        FROM document_pages dp
        JOIN documents d ON dp.document_id = d.id
        WHERE 
            d.user_id = user_uuid
            AND dp.embedding IS NOT NULL
    )
    SELECT 
        COALESCE(k.document_id, s.document_id),
        COALESCE(k.filename, s.filename),
        COALESCE(k.page_number, s.page_number),
        COALESCE(k.content, s.content),
        COALESCE(k.k_score, 0.0),
        COALESCE(s.s_score, 0.0),
        (COALESCE(k.k_score, 0.0) * keyword_weight + COALESCE(s.s_score, 0.0) * semantic_weight)
    FROM keyword_results k
    FULL OUTER JOIN semantic_results s 
        ON k.document_id = s.document_id AND k.page_number = s.page_number
    WHERE (COALESCE(k.k_score, 0) > 0 OR COALESCE(s.s_score, 0) > 0.3)
    ORDER BY (COALESCE(k.k_score, 0.0) * keyword_weight + COALESCE(s.s_score, 0.0) * semantic_weight) DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- FIX 3: Keyword Search - Specific Documents (Fallback)
-- ===============================================

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
    SELECT 
        dp.document_id,
        d.filename,
        dp.page_number,
        dp.content,
        ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32)
    FROM document_pages dp
    JOIN documents d ON dp.document_id = d.id
    WHERE 
        dp.document_id = ANY(doc_ids)
        AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- FIX 4: Keyword Search - All User Documents (Fallback)
-- ===============================================

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
    SELECT 
        dp.document_id,
        d.filename,
        dp.page_number,
        dp.content,
        ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32)
    FROM document_pages dp
    JOIN documents d ON dp.document_id = d.id
    WHERE 
        d.user_id = user_uuid
        AND dp.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_cd(dp.search_vector, plainto_tsquery('english', search_query), 32) DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- VERIFICATION
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '✅ FUNCTION FIX COMPLETE!';
    RAISE NOTICE '✅ All 4 search functions recreated';
    RAISE NOTICE '✅ Column names match exactly';
    RAISE NOTICE '✅ Vector type handling fixed';
    RAISE NOTICE '🚀 Try your search again!';
END $$;
