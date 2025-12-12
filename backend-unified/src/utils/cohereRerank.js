/**
 * Cohere Reranking
 * Best-in-class reranking with FREE tier
 * Increases precision by 20-30%
 */

import { CohereClient } from 'cohere-ai';
import { logger } from './logger.js';

let cohereClient = null;

// Initialize Cohere client (lazy)
function getCohereClient() {
  if (!cohereClient && process.env.COHERE_API_KEY) {
    cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  }
  return cohereClient;
}

/**
 * Rerank documents using Cohere's state-of-the-art model
 * FREE tier: 100 requests/min
 */
export async function rerankWithCohere(query, documents, topK = 20) {
  try {
    const cohere = getCohereClient();
    
    if (!cohere) {
      logger.debug('Cohere API key not found, skipping reranking');
      return documents.slice(0, topK);
    }

    if (documents.length === 0) {
      return [];
    }

    logger.info('🎯 Cohere reranking...', { 
      input: documents.length,
      topK 
    });

    const startTime = Date.now();

    // Cohere rerank API
    const response = await cohere.rerank({
      model: 'rerank-english-v3.0',  // Latest model
      query: query,
      documents: documents.map(d => d.content),
      top_n: topK,
      return_documents: false  // We already have the documents
    });

    const duration = Date.now() - startTime;

    // Map scores back to original documents
    const reranked = response.results.map(result => ({
      ...documents[result.index],
      cohereScore: result.relevance_score,
      originalScore: documents[result.index].combined_score || documents[result.index].rank || 0,
      finalScore: result.relevance_score  // Use Cohere score as final
    }));

    logger.info('✅ Cohere reranking complete', {
      input: documents.length,
      output: reranked.length,
      avgScore: (reranked.reduce((sum, d) => sum + d.cohereScore, 0) / reranked.length).toFixed(3),
      duration_ms: duration
    });

    return reranked;

  } catch (error) {
    logger.error('Cohere reranking failed', { error: error.message });
    // Fallback to original order
    return documents.slice(0, topK);
  }
}

/**
 * Check if Cohere is available
 */
export function isCohereAvailable() {
  return !!process.env.COHERE_API_KEY;
}
