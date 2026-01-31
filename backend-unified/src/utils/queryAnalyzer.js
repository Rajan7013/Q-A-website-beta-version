/**
 * Query Classification & Intent Detection
 * Understands question type and optimizes search strategy
 */
import { generateResponse } from './gemini.js';
import { logger } from './logger.js';

const CLASSIFICATION_CACHE = new Map();
const MAX_CACHE_SIZE = 1000;

export const QUESTION_TYPES = {
  FACTUAL: 'factual',              // "What is X?"
  CONCEPTUAL: 'conceptual',         // "Explain the concept of..."
  PROCEDURAL: 'procedural',         // "How to do X?"
  COMPARATIVE: 'comparative',       // "Difference between X and Y"
  TECHNICAL: 'technical',           // Code, formulas, technical specs
  MEDICAL: 'medical',               // Health, medicine
  ACADEMIC: 'academic',             // Education, subjects  
  CREATIVE: 'creative',             // Design, ideas, brainstorming
  DATA_ANALYSIS: 'data_analysis',   // Numbers, statistics, analysis
  TROUBLESHOOTING: 'troubleshooting', // "Fix this error", debugging
  LIST_BASED: 'list_based',         // "List all...", "Give me 10..."
  DEFINITION: 'definition',         // "Define X", "What does X mean?"
  CONVERSATIONAL: 'conversational',  // "Hi", "Hello", "Who are you?"
  GENERAL: 'general'                // Everything else
};

export async function analyzeQuery(query) {
  try {
    // Check cache
    const cacheKey = query.toLowerCase().trim();
    if (CLASSIFICATION_CACHE.has(cacheKey)) {
      logger.debug('Classification cache hit');
      return CLASSIFICATION_CACHE.get(cacheKey);
    }

    // Use Gemini for classification
    const analysisPrompt = `Analyze this query and return ONLY JSON (no explanation):

Query: "${query}"

Return this exact JSON structure:
{
  "type": "factual|conceptual|procedural|comparative|technical|medical|academic|creative|data_analysis|troubleshooting|list_based|definition|conversational|general",
  "intent": "learn|solve|compare|create|analyze|troubleshoot|chat",
  "domain": "computer_science|medicine|math|business|engineering|general",
  "complexity": "simple|moderate|complex",
  "expectedLength": "brief|detailed|comprehensive",
  "keyConcepts": ["concept1", "concept2"],
  "searchStrategy": "keyword_heavy|semantic_heavy|balanced|none",
  "requiresMultipleSources": true|false,
  "hasTechnicalTerms": true|false,
  "isAcademic": true|false
}`;

    const response = await generateResponse(analysisPrompt, [], 'en');

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      logger.warn('No JSON in classification response, using fallback');
      return fallbackClassification(query);
    }

    const classification = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!classification.type || !classification.intent) {
      logger.warn('Invalid classification structure, using fallback');
      return fallbackClassification(query);
    }

    // Cache the result
    CLASSIFICATION_CACHE.set(cacheKey, classification);

    // Limit cache size
    if (CLASSIFICATION_CACHE.size > MAX_CACHE_SIZE) {
      const firstKey = CLASSIFICATION_CACHE.keys().next().value;
      CLASSIFICATION_CACHE.delete(firstKey);
    }

    logger.info('Query classified', {
      type: classification.type,
      intent: classification.intent,
      strategy: classification.searchStrategy
    });

    return classification;

  } catch (error) {
    logger.error('Query analysis failed', { error: error.message });
    return fallbackClassification(query);
  }
}

function fallbackClassification(query) {
  const lower = query.toLowerCase();

  // Simple pattern matching fallback
  let type = QUESTION_TYPES.GENERAL;
  let searchStrategy = 'balanced';
  let requiresMultipleSources = false;

  // Detect question type
  if (lower.match(/^(hi|hello|hey|greetings|morning|afternoon|evening|thanks|thank you|who are you|what can you do)/)) {
    type = QUESTION_TYPES.CONVERSATIONAL;
    searchStrategy = 'none';
  }
  else if (lower.match(/^(what is|define|meaning of|what does.*mean)/)) {
    type = QUESTION_TYPES.DEFINITION;
    searchStrategy = 'keyword_heavy';
  }
  else if (lower.match(/^(how to|steps to|guide|tutorial|procedure)/)) {
    type = QUESTION_TYPES.PROCEDURAL;
    searchStrategy = 'balanced';
  }
  else if (lower.match(/(difference|compare|vs|versus|contrast)/)) {
    type = QUESTION_TYPES.COMPARATIVE;
    requiresMultipleSources = true;
    searchStrategy = 'semantic_heavy';
  }
  else if (lower.match(/(explain|concept|theory|principle|understand)/)) {
    type = QUESTION_TYPES.CONCEPTUAL;
    searchStrategy = 'semantic_heavy';
  }
  else if (lower.match(/(error|fix|debug|issue|problem|not working)/)) {
    type = QUESTION_TYPES.TROUBLESHOOTING;
    searchStrategy = 'keyword_heavy';
  }
  else if (lower.match(/(code|function|program|algorithm|syntax)/)) {
    type = QUESTION_TYPES.TECHNICAL;
    searchStrategy = 'keyword_heavy';
  }
  else if (lower.match(/(list|enumerate|give me \d+|top \d+)/)) {
    type = QUESTION_TYPES.LIST_BASED;
    requiresMultipleSources = true;
  }
  else if (lower.match(/(health|medical|disease|symptom|treatment)/)) {
    type = QUESTION_TYPES.MEDICAL;
    searchStrategy = 'semantic_heavy';
  }

  // Detect complexity
  let complexity = 'moderate';
  if (lower.length < 20) complexity = 'simple';
  else if (lower.length > 100) complexity = 'complex';

  // Detect academic
  const isAcademic = lower.match(/(marks|exam|test|assignment|study|subject)/) !== null;

  return {
    type,
    intent: type === QUESTION_TYPES.TROUBLESHOOTING ? 'solve' : 'learn',
    domain: 'general',
    complexity,
    expectedLength: complexity === 'simple' ? 'brief' : 'detailed',
    keyConcepts: [],
    searchStrategy,
    requiresMultipleSources,
    hasTechnicalTerms: type === QUESTION_TYPES.TECHNICAL,
    isAcademic
  };
}

export function getSearchParams(classification) {
  // FIXED: Very low threshold - let ALL results through, reranker filters
  const params = {
    resultLimit: 150,              // ✅ More results for better coverage
    minRelevanceScore: 0.1,        // ✅ VERY LOW - accept almost everything!
    keywordWeight: 0.3,
    semanticWeight: 0.7,
    useReranker: true,             // ✅ ALWAYS rerank for best results
    temperature: 0.7,
    maxTokens: 4096
  };

  // Adjust based on complexity
  if (classification.complexity === 'complex') {
    params.resultLimit = 200;      // ✅ Even more for complex queries
    params.maxTokens = 8192;
  } else if (classification.complexity === 'simple') {
    params.resultLimit = 100;      // ✅ Still generous for simple queries
    params.maxTokens = 2048;
  }

  // 🔥 BOOST SEMANTIC SEARCH FOR CONCEPTUAL QUESTIONS
  if (classification.type === QUESTION_TYPES.DEFINITION ||
    classification.type === QUESTION_TYPES.CONCEPTUAL ||
    classification.type === QUESTION_TYPES.FACTUAL) {
    // For "What is", "Define", "Explain" questions - semantic search is KEY
    params.minRelevanceScore = 0.05; // ✅ VERY low threshold
    params.keywordWeight = 0.15;      // ✅ Low keyword weight
    params.semanticWeight = 0.85;     // ✅ HIGH semantic weight for understanding
    params.resultLimit = 200;         // ✅ More results to find conceptual matches
  }

  // Adjust search strategy
  if (classification.searchStrategy === 'keyword_heavy') {
    params.keywordWeight = 0.6;    // ✅ Strong keyword focus
    params.semanticWeight = 0.4;
  } else if (classification.searchStrategy === 'semantic_heavy') {
    params.keywordWeight = 0.1;    // ✅ VERY strong semantic focus
    params.semanticWeight = 0.9;
  }

  // Technical queries: prefer exact matches
  if (classification.type === QUESTION_TYPES.TECHNICAL ||
    classification.type === QUESTION_TYPES.TROUBLESHOOTING) {
    params.keywordWeight = 0.7;    // ✅ Technical needs exact keywords
    params.semanticWeight = 0.3;
    params.minRelevanceScore = 0.05; // ✅ SUPER LOW for technical
  }

  // Conceptual queries: prefer meaning
  if (classification.type === QUESTION_TYPES.CONCEPTUAL ||
    classification.type === QUESTION_TYPES.COMPARATIVE) {
    params.keywordWeight = 0.2;    // ✅ Concepts need understanding
    params.semanticWeight = 0.8;
    params.minRelevanceScore = 0.1; // ✅ Low threshold
  }

  // Adjust temperature for creative queries
  if (classification.type === QUESTION_TYPES.CREATIVE) {
    params.temperature = 0.9;
  } else if (classification.type === QUESTION_TYPES.TECHNICAL ||
    classification.type === QUESTION_TYPES.FACTUAL) {
    params.temperature = 0.5;      // ✅ Very low for maximum accuracy
  }

  // Expected length
  if (classification.expectedLength === 'comprehensive' || classification.isAcademic) {
    params.maxTokens = 8192;
  } else if (classification.expectedLength === 'brief') {
    params.maxTokens = 2048;
  }

  logger.debug('Search params optimized', params);

  return params;
}

export function clearCache() {
  CLASSIFICATION_CACHE.clear();
  logger.info('Classification cache cleared');
}
