-- Fix page numbers for existing documents
-- Run this ONLY if you have documents with wrong page numbers

-- 1. First, check which documents have page number issues
SELECT 
    d.id,
    d.filename,
    d.page_count as reported_pages,
    COUNT(dp.id) as actual_pages,
    MIN(dp.page_number) as min_page,
    MAX(dp.page_number) as max_page
FROM documents d
LEFT JOIN document_pages dp ON d.id = dp.document_id
WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
GROUP BY d.id, d.filename, d.page_count
HAVING MAX(dp.page_number) > d.page_count * 2  -- Pages way higher than expected
ORDER BY d.created_at DESC;

-- 2. For documents where pages are just chunks (metadata->source = 'chunk'),
-- we can't easily fix them. Best to re-upload the document.

-- 3. Check metadata to see which are chunks vs real pages
SELECT 
    d.filename,
    dp.page_number,
    dp.metadata->>'source' as source_type,
    dp.metadata->>'actualPage' as actual_page,
    LENGTH(dp.content) as content_length
FROM document_pages dp
JOIN documents d ON dp.document_id = d.id
WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
ORDER BY d.created_at DESC, dp.page_number ASC
LIMIT 50;

-- 4. OPTION A: Delete documents with wrong page numbers (you'll need to re-upload)
-- UNCOMMENT to execute:
/*
DELETE FROM documents 
WHERE id IN (
    SELECT d.id
    FROM documents d
    LEFT JOIN document_pages dp ON d.id = dp.document_id
    WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
    GROUP BY d.id
    HAVING MAX(dp.page_number) > d.page_count * 2
);
*/

-- 5. OPTION B: Fix page numbers if they're sequential but just wrong offset
-- This recalculates page numbers as 1, 2, 3, 4... based on current order
-- UNCOMMENT to execute:
/*
WITH numbered_pages AS (
    SELECT 
        id,
        document_id,
        ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY created_at, id) as new_page_number
    FROM document_pages
    WHERE document_id IN (
        SELECT id FROM documents WHERE user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
    )
)
UPDATE document_pages dp
SET page_number = np.new_page_number
FROM numbered_pages np
WHERE dp.id = np.id;
*/

-- After running fixes, restart backend and re-upload documents for best results
