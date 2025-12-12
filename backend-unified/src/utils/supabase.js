import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function ensureUser(userId, email, firstName, lastName) {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        storage_used: 0,
        storage_quota: 5 * 1024 * 1024 * 1024
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info('User created in database', { userId });
    return data;
  } catch (error) {
    logger.error('Failed to ensure user', { error: error.message, userId });
    throw error;
  }
}

export async function createDocument(userId, documentData) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        user_id: userId,
        ...documentData
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info('Document created', { documentId: data.id, userId });
    return data;
  } catch (error) {
    logger.error('Failed to create document', { error: error.message, userId });
    throw error;
  }
}

export async function getDocument(documentId, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to get document', { error: error.message, documentId });
    throw error;
  }
}

export async function getUserDocuments(userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to get user documents', { error: error.message, userId });
    throw error;
  }
}

export async function deleteDocument(documentId, userId) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info('Document deleted', { documentId, userId });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete document', { error: error.message, documentId });
    throw error;
  }
}

export async function saveDocumentPages(documentId, pages) {
  try {
    const pageRecords = pages.map((page, index) => ({
      document_id: documentId,
      page_number: page.pageNumber || index + 1,  // Use pageNumber from processor if available
      content: page.content,
      chunk_index: page.chunkIndex || 0,
      metadata: page.metadata || {}
    }));

    const { data, error } = await supabase
      .from('document_pages')
      .insert(pageRecords)
      .select();

    if (error) throw error;

    logger.info('✅ Document pages saved', { 
      documentId, 
      pageCount: pages.length,
      pageNumbers: data.slice(0, 5).map(p => p.page_number).join(', ') + (data.length > 5 ? '...' : '')
    });
    
    return data;
  } catch (error) {
    logger.error('Failed to save document pages', { error: error.message, documentId });
    throw error;
  }
}

export async function searchDocumentPages(documentIds, query, limit = 1000) {
  try {
    // Use optimized search function with indexing
    const { data, error } = await supabase
      .rpc('search_document_pages_fast', {
        doc_ids: documentIds,
        search_query: query,
        result_limit: limit
      });

    if (error) {
      logger.error('SQL function error - search_document_pages_fast may not exist', { 
        error: error.message,
        hint: 'Run FAST_SEARCH_OPTIMIZATION.sql in Supabase SQL Editor'
      });
      
      // If function doesn't exist, provide helpful error
      if (error.message?.includes('does not exist') || error.message?.includes('structure of query')) {
        throw new Error(
          'Database search function not found. Please run FAST_SEARCH_OPTIMIZATION.sql in your Supabase SQL Editor to create required functions.'
        );
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error('Failed to search document pages', { error: error.message });
    throw error;
  }
}

// NEW: Search all documents for a user (no specific doc IDs needed)
export async function searchAllUserDocuments(userId, query, limit = 1000) {
  try {
    const { data, error } = await supabase
      .rpc('search_all_user_documents', {
        user_uuid: userId,
        search_query: query,
        result_limit: limit
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to search all user documents', { error: error.message });
    throw error;
  }
}

export async function saveChat(userId, chatData) {
  try {
    const { data, error} = await supabase
      .from('chats')
      .insert([{
        user_id: userId,
        ...chatData
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info('Chat saved', { chatId: data.id, userId });
    return data;
  } catch (error) {
    logger.error('Failed to save chat', { error: error.message, userId });
    throw error;
  }
}

export async function getUserChats(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to get user chats', { error: error.message, userId });
    throw error;
  }
}

export default supabase;
