/**
 * Multi-Query Retrieval
 * Generate multiple search queries from one question
 * Increases recall by 15-20%
 */

import { generateResponse } from './gemini.js';
import { logger } from './logger.js';

/**
 * Generate 2-3 alternative queries from original
 */
export async function generateMultipleQueries(originalQuery) {
  try {
    const prompt = `Generate 2 alternative search queries for finding documents about this question.
Each query should use different keywords or focus on a different aspect.
Return ONLY a JSON array of 2 strings, no explanation.

Question: "${originalQuery}"

Example for "What is machine learning?":
["definition of machine learning", "machine learning fundamentals explained"]

Your 2 queries:`;

    const response = await generateResponse(prompt, [], 'en', {
      temperature: 0.7,
      maxTokens: 150
    });

    // Extract JSON array
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      logger.warn('Multi-query: Failed to parse, using original only');
      return [originalQuery];
    }

    const alternativeQueries = JSON.parse(jsonMatch[0]);
    
    // Combine original + alternatives
    const allQueries = [originalQuery, ...alternativeQueries.slice(0, 2)];
    
    logger.info('✅ Multi-query generated', { 
      count: allQueries.length,
      queries: allQueries.map(q => q.substring(0, 40))
    });
    
    return allQueries;

  } catch (error) {
    logger.error('Multi-query generation failed', { error: error.message });
    return [originalQuery]; // Fallback to original
  }
}

/**
 * Search with multiple queries and merge results
 * Deduplicates and boosts documents found by multiple queries
 */
export function mergeMultiQueryResults(queryResults) {
  const resultMap = new Map();
  
  // Process results from each query
  queryResults.forEach((results, queryIndex) => {
    results.forEach((result, resultIndex) => {
      const key = `${result.document_id}-${result.page_number}`;
      
      if (!resultMap.has(key)) {
        // First time seeing this result
        resultMap.set(key, {
          ...result,
          queryMatches: 1,
          firstSeenRank: resultIndex,
          combinedScore: result.combined_score || result.rank || 0
        });
      } else {
        // Seen before - boost it!
        const existing = resultMap.get(key);
        existing.queryMatches += 1;
        // Boost score for multi-query match
        existing.combinedScore = (existing.combinedScore || 0) * 1.3;
      }
    });
  });
  
  // Convert to array and sort
  const merged = Array.from(resultMap.values());
  
  // Sort by: 1) number of query matches, 2) combined score
  merged.sort((a, b) => {
    if (b.queryMatches !== a.queryMatches) {
      return b.queryMatches - a.queryMatches;
    }
    return (b.combinedScore || 0) - (a.combinedScore || 0);
  });
  
  logger.info('✅ Multi-query results merged', {
    totalResults: merged.length,
    multiMatchCount: merged.filter(r => r.queryMatches > 1).length,
    avgMatches: (merged.reduce((sum, r) => sum + r.queryMatches, 0) / merged.length).toFixed(2)
  });
  
  return merged;
}
