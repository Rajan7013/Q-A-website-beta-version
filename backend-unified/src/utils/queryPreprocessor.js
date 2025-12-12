/**
 * Query Preprocessing - Makes queries perfect like ChatGPT
 * Handles: typos, grammar, unclear intent, spelling mistakes
 */

import { generateResponse } from './gemini.js';
import { logger } from './logger.js';

const PREPROCESSING_CACHE = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Preprocess query to fix typos, grammar, and unclear intent
 * Makes your system handle messy queries like ChatGPT/Claude
 */
export async function preprocessQuery(rawQuery) {
  try {
    // Check cache first
    const cacheKey = rawQuery.toLowerCase().trim();
    if (PREPROCESSING_CACHE.has(cacheKey)) {
      logger.debug('Query preprocessing cache hit');
      return PREPROCESSING_CACHE.get(cacheKey);
    }

    // Skip preprocessing for very short queries
    if (rawQuery.trim().length < 5) {
      return {
        original: rawQuery,
        corrected: rawQuery,
        expandedTerms: [],
        intent: 'unclear',
        needsPreprocessing: false
      };
    }

    // Use Gemini to fix and expand query (FAST!)
    const preprocessPrompt = `Fix this query and expand search terms. Return ONLY JSON:

Raw query: "${rawQuery}"

Tasks:
1. Fix spelling/grammar
2. Extract key search terms
3. Identify synonyms/related terms
4. Clarify intent

Return this JSON:
{
  "corrected": "fixed query",
  "expandedTerms": ["term1", "synonym1", "related1"],
  "intent": "what user wants to know",
  "keyPhrases": ["key phrase 1", "key phrase 2"],
  "needsPreprocessing": true/false
}

Be concise. Only fix obvious errors.`;

    const response = await generateResponse(preprocessPrompt, [], 'en', {
      temperature: 0.3,  // Low temperature for accuracy
      maxTokens: 500     // Keep it fast
    });

    // Extract JSON
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      logger.warn('Query preprocessing failed, using original');
      return {
        original: rawQuery,
        corrected: rawQuery,
        expandedTerms: [],
        intent: 'unclear',
        needsPreprocessing: false
      };
    }

    const processed = JSON.parse(jsonMatch[0]);
    processed.original = rawQuery;

    // Cache result
    PREPROCESSING_CACHE.set(cacheKey, processed);
    
    // Limit cache size
    if (PREPROCESSING_CACHE.size > MAX_CACHE_SIZE) {
      const firstKey = PREPROCESSING_CACHE.keys().next().value;
      PREPROCESSING_CACHE.delete(firstKey);
    }

    logger.info('Query preprocessed', { 
      original: rawQuery.substring(0, 50),
      corrected: processed.corrected?.substring(0, 50),
      termsAdded: processed.expandedTerms?.length || 0
    });

    return processed;

  } catch (error) {
    logger.error('Query preprocessing error', { error: error.message });
    return {
      original: rawQuery,
      corrected: rawQuery,
      expandedTerms: [],
      intent: 'unclear',
      needsPreprocessing: false
    };
  }
}

/**
 * Build enhanced search query with expanded terms
 */
export function buildEnhancedQuery(preprocessed) {
  const { corrected, expandedTerms, keyPhrases } = preprocessed;
  
  // Start with corrected query
  let enhanced = corrected;
  
  // Add key phrases with OR logic
  if (keyPhrases && keyPhrases.length > 0) {
    enhanced += ' ' + keyPhrases.join(' ');
  }
  
  // Add expanded terms
  if (expandedTerms && expandedTerms.length > 0) {
    enhanced += ' ' + expandedTerms.slice(0, 5).join(' '); // Limit to 5 terms
  }
  
  return enhanced.trim();
}

/**
 * Simple fallback: basic typo correction using common patterns
 */
function basicTypoCorrection(query) {
  const corrections = {
    'whta': 'what',
    'waht': 'what',
    'teh': 'the',
    'hwo': 'how',
    'hwat': 'what',
    'explian': 'explain',
    'expalin': 'explain',
    'diferent': 'different',
    'diference': 'difference',
    'betwean': 'between',
    'beetween': 'between',
    'comprission': 'compression',
    'embeding': 'embedding',
    'algorith': 'algorithm',
    'algorthm': 'algorithm'
  };

  let corrected = query.toLowerCase();
  
  Object.entries(corrections).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correct);
  });

  return corrected;
}

export function clearCache() {
  PREPROCESSING_CACHE.clear();
  logger.info('Query preprocessing cache cleared');
}
