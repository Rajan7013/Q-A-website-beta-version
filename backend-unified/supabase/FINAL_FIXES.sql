-- ===============================================
-- FINAL FIXES: Add metadata column to chats
-- ===============================================

-- Add metadata column to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_metadata ON chats USING GIN(metadata);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FINAL FIX COMPLETE!';
    RAISE NOTICE '✅ Added metadata column to chats table';
    RAISE NOTICE '✅ Created GIN index on metadata';
    RAISE NOTICE '🚀 Chat saving will work now!';
END $$;
