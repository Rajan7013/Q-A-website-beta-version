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
      page_number: page.pageNumber || index + 1,
      content: page.content,
      chunk_index: page.chunkIndex || 0,
      metadata: page.metadata || {},
      embedding: page.embedding || null // Support vectors
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
    // Try optimized search function first
    const { data, error } = await supabase
      .rpc('search_document_pages_fast', {
        doc_ids: documentIds,
        search_query: query,
        result_limit: limit
      });

    if (!error) return data || [];

    // FALLBACK: Use standard text search if RPC fails
    logger.warn('RPC search failed, using standard text search fallback', { error: error.message });

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('document_pages')
      .select('document_id, page_number, content')
      .in('document_id', documentIds)
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .limit(limit);

    if (fallbackError) throw fallbackError;

    // Transform to match assumed output structure
    return (fallbackData || []).map(d => ({
      ...d,
      rank: 0.5 // Dummy rank
    }));

  } catch (error) {
    logger.error('Failed to search document pages', { error: error.message });
    return []; // Return empty instead of crashing
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

    if (!error) return data || [];

    logger.warn('RPC global search failed, using standard fallback');

    // Fetch user's documents first to get IDs
    const { data: userDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId);

    if (!userDocs || userDocs.length === 0) return [];

    const docIds = userDocs.map(d => d.id);

    const { data: fallbackData } = await supabase
      .from('document_pages')
      .select('document_id, page_number, content')
      .in('document_id', docIds)
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .limit(limit);

    return (fallbackData || []).map(d => ({ ...d, rank: 0.5 }));

  } catch (error) {
    logger.error('Failed to search all user documents', { error: error.message });
    return [];
  }
}

export async function saveChat(userId, chatData) {
  try {
    const { data, error } = await supabase
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

/**
 * Get document metadata including total page counts
 * @param {Array} documentIds - Array of document UUIDs
 * @returns {Object} - Map of documentId -> {filename, totalPages}
 */
export async function getDocumentMetadata(documentIds) {
  try {
    if (!documentIds || documentIds.length === 0) {
      return {};
    }

    // Get document info
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('id, filename')
      .in('id', documentIds);

    if (docError) throw docError;

    // Get max page number for each document (represents total pages)
    const metadata = {};

    for (const doc of docs || []) {
      const { data: pages, error: pageError } = await supabase
        .from('document_pages')
        .select('page_number')
        .eq('document_id', doc.id)
        .order('page_number', { ascending: false })
        .limit(1);

      if (!pageError && pages && pages.length > 0) {
        metadata[doc.id] = {
          filename: doc.filename,
          totalPages: pages[0].page_number,
          documentId: doc.id
        };
      } else {
        // Fallback if no pages found
        metadata[doc.id] = {
          filename: doc.filename,
          totalPages: 1,
          documentId: doc.id
        };
      }
    }

    return metadata;
  } catch (error) {
    logger.error('Failed to get document metadata', { error: error.message });
    return {};
  }
}

export default supabase;

