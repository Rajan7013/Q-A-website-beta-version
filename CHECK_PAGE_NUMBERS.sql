-- Run this in Supabase SQL Editor to check page numbers

-- 1. Check your most recent document's page numbers
SELECT 
    d.filename,
    dp.page_number,
    LENGTH(dp.content) as content_length,
    LEFT(dp.content, 100) as preview
FROM document_pages dp
JOIN documents d ON dp.document_id = d.id
WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
ORDER BY d.created_at DESC, dp.page_number ASC
LIMIT 50;

-- 2. Check if there are duplicate page numbers
SELECT 
    document_id,
    page_number,
    COUNT(*) as count
FROM document_pages
GROUP BY document_id, page_number
HAVING COUNT(*) > 1;

-- 3. Check for gaps in page numbers
SELECT 
    d.filename,
    MIN(dp.page_number) as min_page,
    MAX(dp.page_number) as max_page,
    COUNT(*) as total_pages,
    MAX(dp.page_number) - MIN(dp.page_number) + 1 as expected_pages
FROM document_pages dp
JOIN documents d ON dp.document_id = d.id
WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
GROUP BY d.id, d.filename
ORDER BY d.created_at DESC;

-- 4. Check if pages start from 0 or 1
SELECT 
    d.filename,
    MIN(dp.page_number) as first_page_number
FROM document_pages dp
JOIN documents d ON dp.document_id = d.id
WHERE d.user_id = 'user_35FlHUyRnsHVMxBp6uvpKxLr0qn'
GROUP BY d.id, d.filename
ORDER BY d.created_at DESC;
