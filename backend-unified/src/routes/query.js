import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { geminiRateLimiter } from '../middleware/rateLimiter.js';
import { searchDocumentPages, searchAllUserDocuments, saveChat, getUserChats, getUserDocuments } from '../utils/supabase.js';
import { generateResponse } from '../utils/gemini.js';
import { generateAnswerPDF } from '../utils/pdfGenerator.js';
import { logger } from '../utils/logger.js';
import embeddingClient from '../utils/embeddingClient.js';
import { analyzeQuery, getSearchParams } from '../utils/queryAnalyzer.js';
import { preprocessQuery, buildEnhancedQuery } from '../utils/queryPreprocessor.js';
import { generateMultipleQueries, mergeMultiQueryResults } from '../utils/multiQuery.js';
import { rerankWithCohere, isCohereAvailable } from '../utils/cohereRerank.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Create Supabase client for RPC calls
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

router.post('/', requireAuth, geminiRateLimiter, async (req, res) => {
  try {
    const { query, documentIds = [], generatePdf = false, language = 'en' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // STEP 0: Preprocess query ONLY if it's short (likely has typos)
    // Skip for long queries (likely exact copies from documents)
    let preprocessed = null;
    let enhancedQuery = query;
    
    if (query.length < 100) {
      logger.info('🔍 Preprocessing short query...', { query: query.substring(0, 100) });
      preprocessed = await preprocessQuery(query);
      enhancedQuery = buildEnhancedQuery(preprocessed);
      
      logger.info('✅ Query enhanced', {
        original: query.substring(0, 50),
        enhanced: enhancedQuery.substring(0, 50),
        termsAdded: preprocessed.expandedTerms?.length || 0
      });
    } else {
      logger.info('📋 Using original query (long query - likely exact copy)');
      preprocessed = {
        original: query,
        corrected: query,
        expandedTerms: [],
        needsPreprocessing: false
      };
    }

    // STEP 1: Analyze query intent & classification
    const classification = await analyzeQuery(enhancedQuery);
    const searchParams = getSearchParams(classification);
    
    logger.info('✅ Query classified', { 
      type: classification.type,
      strategy: classification.searchStrategy
    });

    // STEP 2: Generate multiple queries (BOOST RECALL BY 15-20%)
    logger.info('🔍 Generating multiple search queries...');
    const queries = await generateMultipleQueries(enhancedQuery);
    
    // STEP 3: Generate embeddings for all queries
    const embeddingServiceHealthy = await embeddingClient.checkHealth();
    const queryEmbeddings = [];
    
    if (embeddingServiceHealthy) {
      try {
        logger.info('🧮 Generating query embeddings...', { count: queries.length });
        
        for (const q of queries) {
          const embedding = await embeddingClient.generateEmbedding(q);
          if (embedding && embedding.length === 768) {
            queryEmbeddings.push({ query: q, embedding });
          }
        }
        
        logger.info('✅ Embeddings generated', { count: queryEmbeddings.length });
      } catch (error) {
        logger.warn('Embedding generation failed', { error: error.message });
      }
    }

    // STEP 4: Multi-query hybrid search
    let relevantPages = [];
    let sources = [];
    let confidence = 0.5;
    
    if (queryEmbeddings.length > 0) {
      // Use hybrid search with MULTIPLE queries (BEST ACCURACY!)
      logger.info('🔍 Multi-query hybrid search', { 
        queries: queryEmbeddings.length,
        documents: documentIds.length || 'all'
      });
      
      const queryResults = [];
      
      for (const { query: searchQuery, embedding } of queryEmbeddings) {
        try {
          if (documentIds && documentIds.length > 0) {
            const { data, error } = await supabase.rpc('hybrid_search_ultimate', {
              doc_ids: documentIds,
              search_query: searchQuery,
              query_embedding: embedding,
              result_limit: Math.floor(searchParams.resultLimit / queryEmbeddings.length), // Split limit
              keyword_weight: searchParams.keywordWeight,
              semantic_weight: searchParams.semanticWeight
            });
            
            if (!error && data) {
              queryResults.push(data);
            }
          } else {
            const { data, error } = await supabase.rpc('hybrid_search_all_user_documents', {
              user_uuid: req.userId,
              search_query: searchQuery,
              query_embedding: embedding,
              result_limit: Math.floor(searchParams.resultLimit / queryEmbeddings.length),
              keyword_weight: searchParams.keywordWeight,
              semantic_weight: searchParams.semanticWeight
            });
            
            if (!error && data) {
              queryResults.push(data);
            }
          }
        } catch (error) {
          logger.warn('Query search failed', { query: searchQuery.substring(0, 30), error: error.message });
        }
      }
      
      // Merge results from all queries (DEDUPLICATES & BOOSTS MULTI-MATCHES)
      if (queryResults.length > 0) {
        relevantPages = mergeMultiQueryResults(queryResults);
        logger.info('✅ Multi-query search complete', { totalResults: relevantPages.length });
      }
    }
    
    // Fallback to keyword-only if no embeddings
    if (relevantPages.length === 0) {
      logger.info('📝 Fallback: keyword-only search');
      if (documentIds && documentIds.length > 0) {
        relevantPages = await searchDocumentPages(documentIds, query, searchParams.resultLimit);
      } else {
        relevantPages = await searchAllUserDocuments(req.userId, query, searchParams.resultLimit);
      }
    }

    logger.info('✅ Search complete', { resultsFound: relevantPages.length });

    // Debug: Log score distribution
    if (relevantPages.length > 0) {
      const scores = relevantPages.map(p => p.combined_score || p.rank || 0);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      logger.debug('Score distribution', { 
        max: maxScore.toFixed(4), 
        min: minScore.toFixed(4), 
        avg: avgScore.toFixed(4),
        threshold: searchParams.minRelevanceScore 
      });
    }

    // STEP 4: Filter by relevance threshold
    const MIN_COMBINED_SCORE = searchParams.minRelevanceScore;
    const relevantResults = relevantPages.filter(page => {
      const score = page.combined_score || page.rank || 0;
      return score >= MIN_COMBINED_SCORE;
    });
    
    // Debug: Show how many were filtered
    if (relevantPages.length > 0 && relevantResults.length === 0) {
      logger.warn('⚠️ ALL results filtered out!', {
        totalFound: relevantPages.length,
        threshold: MIN_COMBINED_SCORE,
        maxScore: Math.max(...relevantPages.map(p => p.combined_score || p.rank || 0)).toFixed(4)
      });
    } else if (relevantPages.length > relevantResults.length) {
      logger.debug('Filtered results', {
        before: relevantPages.length,
        after: relevantResults.length,
        removed: relevantPages.length - relevantResults.length
      });
    }
    
    if (relevantResults && relevantResults.length > 0) {
      logger.info('✅ Found relevant pages', { 
        pageCount: relevantResults.length,
        avgScore: (relevantResults.reduce((sum, p) => sum + (p.combined_score || p.rank || 0), 0) / relevantResults.length).toFixed(3)
      });
      
      // STEP 5: Reranking (Cohere or fallback)
      let finalResults = relevantResults;
      
      if (relevantResults.length > 5) {  // Only rerank if we have enough results
        try {
          // Try Cohere first (best quality, FREE tier!)
          if (isCohereAvailable()) {
            const topK = Math.min(30, relevantResults.length);
            finalResults = await rerankWithCohere(query, relevantResults, topK);
          } 
          // Fallback to local reranker if Cohere not available
          else if (searchParams.useReranker && embeddingServiceHealthy && relevantResults.length > 10) {
            logger.info('🎯 Local reranking...', { count: relevantResults.length });
            
            const maxRerank = 50;
            const documentsToRerank = relevantResults.slice(0, maxRerank);
            const reranked = await embeddingClient.rerank(query, documentsToRerank.map(d => d.content), 20);
            
            finalResults = reranked.map(r => ({
              ...documentsToRerank[r.index],
              reranker_score: r.score
            }));
            
            logger.info('✅ Local reranking complete', { returned: finalResults.length });
          } else {
            logger.debug('No reranking available, using original order');
            finalResults = relevantResults.slice(0, 30);
          }
        } catch (error) {
          logger.warn('⚠️ Reranking failed, using original order', { 
            error: error.message
          });
          finalResults = relevantResults.slice(0, 30);
        }
      } else {
        logger.debug('Too few results to rerank', { count: relevantResults.length });
        finalResults = relevantResults;
      }
      
      // Map sources with DEBUG logging
      sources = finalResults.slice(0, 30).map(page => ({
        documentId: page.document_id,
        documentName: page.document_name || 'Document',
        page: page.page_number,
        relevance: page.combined_score || page.rank || 0,
        keywordScore: page.keyword_score,
        semanticScore: page.semantic_score
      }));
      
      // DEBUG: Log page numbers being returned
      const pageNumbers = sources.map(s => s.page).filter(p => p != null);
      logger.debug('📄 Page numbers returned', {
        pages: pageNumbers.slice(0, 10).join(', '),
        min: Math.min(...pageNumbers),
        max: Math.max(...pageNumbers),
        unique: [...new Set(pageNumbers)].length,
        total: pageNumbers.length
      });

      const topScore = finalResults[0].combined_score || finalResults[0].rank || 0;
      confidence = Math.min(0.95, topScore * 1.2);
    } else {
      logger.info('⚠️ No relevant pages found - using AI general knowledge');
    }

    const contextText = relevantResults
      .slice(0, 30)  // Limit to top 30 results for context
      .map(page => `[Document: ${page.document_name}, Page: ${page.page_number}]\n${page.content}`)
      .join('\n\n---\n\n');

    // Language mapping
    const languageNames = {
      'en': 'English',
      'hi': 'Hindi (हिंदी)',
      'te': 'Telugu (తెలుగు)',
      'ta': 'Tamil (தமிழ்)',
      'ml': 'Malayalam (മലയാളം)',
      'bn': 'Bengali (বাংলা)',
      'ne': 'Nepali (नेपाली)',
      'mai': 'Maithili (मैथिली)'
    };
    const languageName = languageNames[language] || 'English';

    let prompt = `You are an expert AI assistant like ChatGPT. Answer questions with perfect accuracy, even if the query has typos or poor grammar.

${
      contextText
        ? `**📚 DOCUMENT CONTEXT (Your PRIMARY Source):**\nThe following excerpts are from the user's uploaded documents. Base your answer ENTIRELY on this:\n\n${contextText}\n\n`
        : '**❌ NO RELEVANT DOCUMENTS FOUND** - The question topic was not found in the uploaded documents.\n\n'
    }**❓ USER QUESTION:** ${query}
${preprocessed.needsPreprocessing ? `\n**🔧 INTERPRETED AS:** ${preprocessed.corrected || query}` : ''}

**ANSWER STRATEGY (CRITICAL - MUST FOLLOW):**
${contextText ? `
1. **COMPLETENESS IS MANDATORY**: If the document has 10 points, you MUST include ALL 10 points
2. **DO NOT SKIP**: Do not summarize or skip ANY information from the documents
3. **THOROUGH ANALYSIS**: Read and analyze EVERY excerpt provided above carefully
4. **FULL COVERAGE**: Include ALL relevant details, examples, definitions, and explanations
5. **CHECK YOUR WORK**: Before finishing, verify you haven't missed ANY points from the documents
6. **BE COMPREHENSIVE**: If there are multiple aspects, cover ALL of them
7. **HONEST INDICATION**: ONLY if the specific answer is NOT in documents, start with:
   "⚠️ The specific answer to your question is not found in your uploaded documents. Based on my general knowledge:"
8. **DOCUMENT-FIRST**: Always prefer and use ALL document content over general knowledge
` : `
1. **NO RELEVANT DOCUMENTS**: The question topic was not found in your uploaded documents
2. **USE GENERAL KNOWLEDGE**: Provide a comprehensive answer using your trained knowledge
3. **CLEAR INDICATION**: Start your answer with: "📚 Based on general knowledge (no relevant documents found):"
4. **BE COMPREHENSIVE**: Provide detailed, accurate information as if this were a textbook answer
5. **PROFESSIONAL QUALITY**: Give complete explanations with examples, definitions, and key concepts
`}

**CRITICAL FORMATTING RULES:**
- Use proper markdown syntax (##, **, *, -, etc.)
- Use ## for main headings, ### for subheadings
- Use **bold** for important terms and emphasis
- Use * or - for bullet points
- Use numbered lists (1., 2., 3.) for sequential steps
- Add blank lines between paragraphs for proper spacing
- Use \`code\` for inline code and \`\`\`language for code blocks
- Keep formatting clean and readable like Claude AI

**CITATION RULES (CRITICAL):**
- DO NOT include inline citations like (Doc ID: xxx, Page: x) in your answer
- DO NOT add page numbers or document IDs anywhere in the text
- Write clean, flowing prose without any citation markers
- The system will automatically show sources at the bottom
- Focus on providing clear, well-structured information

Provide a comprehensive, accurate, and professionally formatted answer.`;

    // Add language instruction if not English
    if (language !== 'en') {
      prompt += `\n\n🌍 **LANGUAGE REQUIREMENT (CRITICAL):**
- You MUST respond in ${languageName}
- The user's question may be in English, but your ENTIRE response must be in ${languageName}
- Translate ALL content including headings, explanations, examples, and lists
- Keep markdown formatting intact (**, ##, -, etc.)
- Maintain professional tone in ${languageName}
- Do NOT mix languages - use ONLY ${languageName}`;
    }

    const answer = await generateResponse(prompt, [], language, {
      temperature: searchParams.temperature,
      maxTokens: searchParams.maxTokens
    });

    // Return pure markdown - let frontend ReactMarkdown handle formatting
    // DO NOT convert to HTML here!

    const tokensUsed = Math.ceil((prompt.length + answer.length) / 4);

    await saveChat(req.userId, {
      query,
      answer: answer,
      sources: JSON.stringify(sources),
      confidence,
      tokens_used: tokensUsed,
      metadata: JSON.stringify({
        classification: classification.type,
        searchStrategy: classification.searchStrategy,
        resultsCount: relevantResults.length,
        usedHybridSearch: queryEmbedding !== null,
        usedReranking: searchParams.useReranker
      })
    });

    const response = {
      answer: answer,
      message: answer,
      sources,
      confidence,
      tokensUsed,
      metadata: {
        classification: classification.type,
        searchStrategy: classification.searchStrategy,
        resultsFound: relevantResults.length,
        usedHybridSearch: queryEmbedding !== null
      }
    };

    if (generatePdf) {
      const pdfBuffer = await generateAnswerPDF({
        question: query,
        answer: answer,
        sources,
        confidence
      });

      response.pdfUrl = `/api/query/pdf/${Date.now()}`;
      res.locals.pdfBuffer = pdfBuffer;
    }

    logger.info('Query processed', {
      userId: req.userId,
      documentCount: documentIds.length,
      sourceCount: sources.length,
      tokensUsed
    });

    res.json(response);

  } catch (error) {
    logger.error('Query processing error', { error: error.message, userId: req.userId });
    res.status(500).json({
      error: 'Failed to process query',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ========================================
// STREAMING ENDPOINT (ChatGPT-style)
// ========================================
router.post('/stream', requireAuth, geminiRateLimiter, async (req, res) => {
  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { query, documentIds = [], language = 'en' } = req.body;

    if (!query) {
      sendEvent('error', { error: 'Query is required' });
      return res.end();
    }

    logger.info('🎬 Starting streaming query', { userId: req.userId, query: query.substring(0, 50) });

    // === REUSE ALL EXISTING LOGIC ===
    
    // STEP 0: Preprocess query
    let preprocessed = null;
    let enhancedQuery = query;
    
    if (query.length < 100) {
      sendEvent('status', { stage: 'preprocessing', message: 'Enhancing query...' });
      preprocessed = await preprocessQuery(query);
      enhancedQuery = buildEnhancedQuery(preprocessed);
    } else {
      preprocessed = {
        original: query,
        corrected: query,
        expandedTerms: [],
        needsPreprocessing: false
      };
    }

    // STEP 1: Analyze query
    sendEvent('status', { stage: 'analyzing', message: 'Understanding your question...' });
    const classification = await analyzeQuery(enhancedQuery);
    const searchParams = getSearchParams(classification);

    // STEP 2: Generate embedding
    let queryEmbedding = null;
    const embeddingServiceHealthy = await embeddingClient.checkHealth();
    
    if (embeddingServiceHealthy) {
      sendEvent('status', { stage: 'embedding', message: 'Generating query embedding...' });
      try {
        queryEmbedding = await embeddingClient.generateEmbedding(enhancedQuery);
      } catch (error) {
        logger.warn('Embedding generation failed', { error: error.message });
      }
    }

    // STEP 3: Search documents
    sendEvent('status', { stage: 'searching', message: 'Searching your documents...' });
    let relevantPages = [];
    
    if (queryEmbedding && queryEmbedding.length === 768) {
      if (documentIds && documentIds.length > 0) {
        const { data, error } = await supabase.rpc('hybrid_search_ultimate', {
          doc_ids: documentIds,
          search_query: enhancedQuery,
          query_embedding: queryEmbedding,
          result_limit: searchParams.resultLimit,
          keyword_weight: searchParams.keywordWeight,
          semantic_weight: searchParams.semanticWeight
        });
        
        if (!error) relevantPages = data || [];
      } else {
        const { data, error } = await supabase.rpc('hybrid_search_all_user_documents', {
          user_uuid: req.userId,
          search_query: enhancedQuery,
          query_embedding: queryEmbedding,
          result_limit: searchParams.resultLimit,
          keyword_weight: searchParams.keywordWeight,
          semantic_weight: searchParams.semanticWeight
        });
        
        if (!error) relevantPages = data || [];
      }
    }

    // Fallback to keyword-only
    if (!relevantPages.length) {
      relevantPages = documentIds.length
        ? await searchDocumentPages(documentIds, query, searchParams.resultLimit)
        : await searchAllUserDocuments(req.userId, query, searchParams.resultLimit);
    }

    sendEvent('status', { 
      stage: 'found', 
      message: `Found ${relevantPages.length} relevant pages`,
      count: relevantPages.length 
    });

    // STEP 4: Filter by relevance
    const MIN_COMBINED_SCORE = searchParams.minRelevanceScore;
    const relevantResults = relevantPages.filter(page => {
      const score = page.combined_score || page.rank || 0;
      return score >= MIN_COMBINED_SCORE;
    });

    // STEP 5: Reranking (if applicable)
    let finalResults = relevantResults;
    if (searchParams.useReranker && relevantResults.length > 10 && embeddingServiceHealthy) {
      try {
        sendEvent('status', { stage: 'reranking', message: 'Optimizing results...' });
        const documents = relevantResults.map(p => p.content);
        const maxRerank = 50;
        const documentsToRerank = documents.slice(0, maxRerank);
        
        const reranked = await embeddingClient.rerank(query, documentsToRerank, 20);
        
        finalResults = reranked.map(r => ({
          ...relevantResults[r.index],
          reranker_score: r.score
        }));
      } catch (error) {
        logger.warn('Reranking failed', { error: error.message });
        finalResults = relevantResults;
      }
    }

    // Build context
    const contextText = finalResults
      .slice(0, 30)
      .map(page => `[Document: ${page.document_name}, Page: ${page.page_number}]\n${page.content}`)
      .join('\n\n---\n\n');

    // Build sources
    const sources = finalResults.slice(0, 30).map(page => ({
      documentId: page.document_id,
      documentName: page.document_name || 'Document',
      page: page.page_number,
      relevance: page.combined_score || page.rank || 0,
      keywordScore: page.keyword_score,
      semanticScore: page.semantic_score
    }));

    sendEvent('sources', { sources });

    // Generate prompt (same as existing)
    const languageNames = {
      'en': 'English',
      'hi': 'Hindi (हिंदी)',
      'te': 'Telugu (తెలుగు)',
      'ta': 'Tamil (தமிழ்)',
      'ml': 'Malayalam (മലയാളം)',
      'bn': 'Bengali (বাংলা)',
      'ne': 'Nepali (नेपाली)',
      'mai': 'Maithili (मैथिली)'
    };
    const languageName = languageNames[language] || 'English';

    let prompt = `You are an expert AI assistant like ChatGPT. Answer questions with perfect accuracy, even if the query has typos or poor grammar.

${
      contextText
        ? `**📚 DOCUMENT CONTEXT (Your PRIMARY Source):**\nThe following excerpts are from the user's uploaded documents. Base your answer ENTIRELY on this:\n\n${contextText}\n\n`
        : '**❌ NO RELEVANT DOCUMENTS FOUND** - The question topic was not found in the uploaded documents.\n\n'
    }**❓ USER QUESTION:** ${query}
${preprocessed?.needsPreprocessing ? `\n**🔧 INTERPRETED AS:** ${preprocessed.corrected || query}` : ''}

**ANSWER STRATEGY (CRITICAL - MUST FOLLOW):**
${contextText ? `
1. **COMPLETENESS IS MANDATORY**: If the document has 10 points, you MUST include ALL 10 points
2. **DO NOT SKIP**: Do not summarize or skip ANY information from the documents
3. **THOROUGH ANALYSIS**: Read and analyze EVERY excerpt provided above carefully
4. **FULL COVERAGE**: Include ALL relevant details, examples, definitions, and explanations
5. **CHECK YOUR WORK**: Before finishing, verify you haven't missed ANY points from the documents
6. **BE COMPREHENSIVE**: If there are multiple aspects, cover ALL of them
7. **HONEST INDICATION**: ONLY if the specific answer is NOT in documents, start with:
   "⚠️ The specific answer to your question is not found in your uploaded documents. Based on my general knowledge:"
8. **DOCUMENT-FIRST**: Always prefer and use ALL document content over general knowledge
` : `
1. **NO RELEVANT DOCUMENTS**: The question topic was not found in your uploaded documents
2. **USE GENERAL KNOWLEDGE**: Provide a comprehensive answer using your trained knowledge
3. **CLEAR INDICATION**: Start your answer with: "📚 Based on general knowledge (no relevant documents found):"
4. **BE COMPREHENSIVE**: Provide detailed, accurate information as if this were a textbook answer
5. **PROFESSIONAL QUALITY**: Give complete explanations with examples, definitions, and key concepts
`}

**CRITICAL FORMATTING RULES:**
- Use proper markdown syntax (##, **, *, -, etc.)
- Use ## for main headings, ### for subheadings
- Use **bold** for important terms and emphasis
- Use * or - for bullet points
- Use numbered lists (1., 2., 3.) for sequential steps
- Add blank lines between paragraphs for proper spacing
- Use \`code\` for inline code and \`\`\`language for code blocks
- Keep formatting clean and readable like Claude AI

**CITATION RULES (CRITICAL):**
- DO NOT include inline citations like (Doc ID: xxx, Page: x) in your answer
- DO NOT add page numbers or document IDs anywhere in the text
- Write clean, flowing prose without any citation markers
- The system will automatically show sources at the bottom
- Focus on providing clear, well-structured information

Provide a comprehensive, accurate, and professionally formatted answer.`;

    if (language !== 'en') {
      prompt += `\n\n🌍 **LANGUAGE REQUIREMENT (CRITICAL):**
- You MUST respond in ${languageName}
- The user's question may be in English, but your ENTIRE response must be in ${languageName}
- Translate ALL content including headings, explanations, examples, and lists
- Keep markdown formatting intact (**, ##, -, etc.)
- Maintain professional tone in ${languageName}
- Do NOT mix languages - use ONLY ${languageName}`;
    }

    // STREAM THE RESPONSE using Gemini
    sendEvent('status', { stage: 'generating', message: 'Generating answer...' });
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini 2.5 Flash (only working model)
    logger.debug('Using model', { model: 'gemini-2.5-flash' });
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: searchParams.temperature || 0.7,
        maxOutputTokens: searchParams.maxTokens || 8192
      }
    });

    const result = await model.generateContentStream(prompt);
    
    let fullAnswer = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullAnswer += text;
        sendEvent('token', { token: text });
      }
    }

    // Save chat history
    try {
      const topScore = finalResults[0]?.combined_score || finalResults[0]?.rank || 0;
      const confidence = Math.min(0.95, topScore * 1.2);
      const tokensUsed = Math.ceil((prompt.length + fullAnswer.length) / 4);

      await saveChat(req.userId, {
        query,
        answer: fullAnswer,
        sources: JSON.stringify(sources),
        confidence,
        tokens_used: tokensUsed,
        metadata: JSON.stringify({
          classification: classification.type,
          searchStrategy: classification.searchStrategy,
          resultsCount: relevantResults.length,
          usedHybridSearch: queryEmbedding !== null,
          usedReranking: searchParams.useReranker
        })
      });
    } catch (error) {
      logger.error('Failed to save streaming chat', { error: error.message });
    }

    sendEvent('done', { message: 'Answer complete', sources });
    res.end();

    logger.info('✅ Streaming query completed', { userId: req.userId });

  } catch (error) {
    logger.error('❌ Streaming query error', { error: error.message, userId: req.userId });
    sendEvent('error', { 
      error: 'Failed to process query',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
    res.end();
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const chats = await getUserChats(req.userId, limit);

    res.json({
      chats: chats.map(chat => ({
        id: chat.id,
        query: chat.query,
        answer: chat.answer,
        sources: typeof chat.sources === 'string' ? JSON.parse(chat.sources) : chat.sources,
        confidence: chat.confidence,
        tokensUsed: chat.tokens_used,
        createdAt: chat.created_at
      }))
    });

  } catch (error) {
    logger.error('Failed to get chat history', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

router.get('/:chatId/pdf', requireAuth, async (req, res) => {
  try {
    res.status(501).json({ error: 'PDF generation for specific chat not yet implemented' });
  } catch (error) {
    logger.error('Failed to generate chat PDF', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
