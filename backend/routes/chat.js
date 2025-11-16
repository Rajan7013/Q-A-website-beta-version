import express from 'express';
import { generateResponse } from '../utils/gemini.js';
import supabase from '../utils/supabaseClient.js'; // IMPORT SUPABASE

const router = express.Router();

// The Supabase 'chat_histories' table now stores this.
// The old 'conversationContexts = new Map()' is GONE.

router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, documents, context, language = 'en', userApiKey } = req.body;
    
    if (Math.random() < 0.1) { // Log 10% of requests to reduce spam
      console.log('🌍 Language:', language);
    }

    if (!message || !sessionId) { // SessionID is now mandatory
      return res.status(400).json({ error: 'Message and SessionID are required' });
    }

    // NEW: Get conversation context from Supabase
    let conversationContext;
    const { data: historyData, error: historyError } = await supabase
      .from('chat_histories')
      .select('history, topic, intent, documents')
      .eq('session_id', sessionId)
      .single();

    if (historyError && historyError.code !== 'PGRST116') {
      // PGRST116 is "No rows found", which is fine.
      throw new Error(historyError.message);
    }

    if (historyData) {
      // History found in database
      conversationContext = historyData;
    } else {
      // No history found, create a new one
      conversationContext = {
        history: [],
        topic: null,
        intent: null,
        documents: []
      };
    }

    // Update context with new documents
    if (documents && documents.length > 0) {
      conversationContext.documents = documents;
    }

    // NEW: Fetch document content from Supabase
    const documentIds = documents?.map(d => d.id) || [];
    let userDocuments = []; // Default to empty

    if (documentIds.length > 0) {
      console.log(`💬 Fetching content for ${documentIds.length} docs from Supabase...`);
      const { data: fetchedDocs, error: docError } = await supabase
        .from('documents')
        // We MUST select textContent for the AI to read
        .select('id, name, textContent')
        .in('id', documentIds)
        .eq('userId', req.body.userId || 'anonymous'); // Ensure user owns docs

      if (docError) {
        console.error('Supabase error fetching documents for chat:', docError);
        // Don't throw, just proceed without documents
      } else {
        userDocuments = fetchedDocs;
      }
    }
    
    // Pass the freshly fetched documents to buildPrompt
    const prompt = buildPrompt(message, conversationContext, documentIds, language, userDocuments);

    // Generate response from Gemini (use user's API key if provided)
    const aiResponse = await generateResponse(prompt, conversationContext.history, userApiKey);

    // Update conversation history
    conversationContext.history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: aiResponse }] }
    );

    // Analyze and update intent/topic
    conversationContext.topic = extractTopic(message, aiResponse);
    conversationContext.intent = analyzeIntent(message);

    // NEW: Save context back to Supabase
    const { error: upsertError } = await supabase
      .from('chat_histories')
      .upsert({
        session_id: sessionId,
        history: conversationContext.history,
        topic: conversationContext.topic,
        intent: conversationContext.intent,
        documents: conversationContext.documents,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      // Don't fail the request, just log the error
    }

    // Extract source information
    const sources = extractSources(aiResponse, documents);

    res.json({
      response: aiResponse,  // Send raw markdown response
      rawResponse: aiResponse,
      context: {
        topic: conversationContext.topic,
        intent: conversationContext.intent
      },
      sources: sources
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message 
    });
  }
});

// Clear conversation context
router.post('/clear', async (req, res) => { // Made async
  const { sessionId } = req.body;
  if (sessionId) {
    // NEW: Delete from Supabase
    await supabase
      .from('chat_histories')
      .delete()
      .eq('session_id', sessionId);
  }
  res.json({ message: 'Context cleared' });
});

// Validate Gemini API Key
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Test the API key with a simple request
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello, this is a test. Please respond with 'API key is working'.");
      const response = await result.response;
      const text = response.text();
      
      if (text && text.length > 0) {
        res.json({ valid: true, message: 'API key is valid and working' });
      } else {
        res.json({ valid: false, message: 'API key validation failed' });
      }
    } catch (apiError) {
      console.error('Gemini API validation error:', apiError.message);
      res.json({ valid: false, message: 'Invalid API key or API error' });
    }
  } catch (error) {
    console.error('Key validation error:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

function buildPrompt(message, context, documentIds = [], language = 'en', userDocuments = null) {
  // Language name mapping
  const languageNames = {
    'en': 'English',
    'hi': 'Hindi (हिंदी)',
    'te': 'Telugu (తెలుగు)',
    'ta': 'Tamil (தமிழ்)',
    'ml': 'Malayalam (മലയാളം)',
    'bn': 'Bengali (বাংলা)',
    'ne': 'Nepali (नेपाली)',
    'mai': 'Maithili (मैथिली)',
    'kn': 'Kannada (ಕನ್ನಡ)'
  };
  const languageName = languageNames[language] || 'English';
  let prompt = '';
  let hasDocuments = false;
  let availableDocs = [];

  // Add document context with actual content (use filtered user documents if provided)
  if (documentIds && documentIds.length > 0) {
    // This logic is correct: it uses the 'userDocuments' variable from our Supabase query
    availableDocs = userDocuments || [];
    
    if (availableDocs.length > 0) {
      hasDocuments = true;
      prompt += `📚 **AVAILABLE DOCUMENTS:**\n\n`;
      
      availableDocs.forEach((doc, index) => {
        prompt += `\n=== DOCUMENT ${index + 1}: "${doc.name}" ===\n`;
        prompt += `[READ THIS COMPLETE DOCUMENT CAREFULLY]\n\n`;
        // Limit content to first 15000 characters for more context
        const content = doc.textContent.substring(0, 15000);
        prompt += `${content}\n`;
        if (doc.textContent.length > 15000) {
          prompt += `\n[Document continues beyond 15,000 characters...]\n`;
        }
        prompt += `\n=== END OF DOCUMENT "${doc.name}" ===\n`;
        prompt += `\n---\n`;
      });
    }
  }

  // Add conversation context
  if (context.topic) {
    prompt += `📌 **Current Topic:** ${context.topic}\n`;
  }

  if (context.intent) {
    prompt += `🎯 **User Intent:** ${context.intent}\n\n`;
  }

  // Add STRICT instructions for document-first approach
  prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  prompt += `🤖 **CRITICAL MANDATORY INSTRUCTIONS - FOLLOW EXACTLY:**\n`;
  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (hasDocuments) {
    prompt += `⚠️ **STRICT DOCUMENT-FIRST APPROACH - NO EXCEPTIONS:**\n\n`;
    
    prompt += `**STEP 1: READ DOCUMENTS COMPLETELY**\n`;
    prompt += `- You have been provided with ${availableDocs.length} document(s) above\n`;
    prompt += `- READ EVERY SINGLE LINE of each document carefully\n`;
    prompt += `- Understand the COMPLETE content before proceeding\n\n`;
    
    prompt += `**STEP 2: ANALYZE USER QUESTION**\n`;
    prompt += `- Understand what the user is asking\n`;
    prompt += `- Identify key concepts and topics\n`;
    prompt += `- Determine the scope of the question\n\n`;
    
    prompt += `**STEP 3: SEARCH IN DOCUMENTS (MANDATORY)**\n`;
    prompt += `- Search THOROUGHLY in the provided documents\n`;
    prompt += `- Look for ALL relevant information\n`;
    prompt += `- Check for partial matches, related topics, examples\n`;
    prompt += `- Do NOT skip this step\n\n`;
    
    prompt += `**STEP 4: DECISION RULES (STRICTLY FOLLOW):**\n\n`;
    
    prompt += `✅ **CASE A: Answer IS in documents (even partially)**\n`;
    prompt += `   → Use ONLY document content\n`;
    prompt += `   → Start response with: "📄 Based on your documents: [Document Name(s)]"\n`;
    prompt += `   → DO NOT add your own knowledge\n`;
    prompt += `   → Quote or paraphrase from documents\n`;
    prompt += `   → Cite specific document sections\n\n`;
    
    prompt += `⚠️ **CASE B: Answer is PARTIALLY in documents**\n`;
    prompt += `   → First present what IS in documents\n`;
    prompt += `   → Then clearly separate additional info\n`;
    prompt += `   → Start with: "📄 From your documents + 🧠 General knowledge:"\n`;
    prompt += `   → Make it clear which part is from where\n\n`;
    
    prompt += `❌ **CASE C: Answer is NOT in documents AT ALL**\n`;
    prompt += `   → ONLY if you've searched thoroughly and found nothing\n`;
    prompt += `   → Start with: "🧠 Based on general knowledge (not found in your documents):"\n`;
    prompt += `   → Then provide answer using AI knowledge\n`;
    prompt += `   → Be honest that documents don't contain this info\n\n`;
    
    prompt += `**IMPORTANT RULES:**\n`;
    prompt += `- If ANY relevant info exists in documents → Use CASE A\n`;
    prompt += `- PRIORITIZE document content over your knowledge\n`;
    prompt += `- When in doubt → Check documents again\n`;
    prompt += `- NEVER mix sources without clear indication\n`;
    prompt += `- Always cite document names when using them\n\n`;
  } else {
    prompt += `⚠️ **No documents uploaded yet.**\n`;
    prompt += `- Use your general AI knowledge to answer\n`;
    prompt += `- Start response with: "🧠 Based on general knowledge:"\n`;
    if (language !== 'en') {
      prompt += `- Remember: respond in ${languageName} only\n`;
    }
    prompt += `\n`;
  }

  prompt += `**FORMATTING RULES:**\n`;
  prompt += `- Use **Markdown** for ALL formatting (NOT HTML)\n`;
  prompt += `- Headings: # H1, ## H2, ### H3, etc.\n`;
  prompt += `- Bold: **text**, Italic: *text*, Bold+Italic: ***text***\n`;
  prompt += `- Lists: Use - or * for bullets, 1. 2. 3. for numbered\n`;
  prompt += `- Code: \`inline code\` or \`\`\`language\\ncode block\\n\`\`\`\n`;
  prompt += `- Tables: Use markdown table syntax\n`;
  prompt += `- Blockquotes: > quoted text\n`;
  prompt += `- Line breaks: Use double line breaks between sections\n\n`;

  prompt += `**ANSWER QUALITY:**\n`;
  prompt += `- Be comprehensive and detailed\n`;
  prompt += `- Use proper headings for organization\n`;
  prompt += `- Include examples when helpful\n`;
  prompt += `- Use bullet points for clarity\n`;
  prompt += `- Make text scannable with good structure\n\n`;
  
  // Add language instruction
  if (language !== 'en') {
    console.log('✅ Adding language instruction for:', languageName);
    prompt += `🌍 **LANGUAGE REQUIREMENT (CRITICAL):**\n`;
    prompt += `- You MUST respond ENTIRELY in ${languageName}\n`;
    prompt += `- User question language doesn't matter - respond ONLY in ${languageName}\n`;
    prompt += `- Translate ALL content: headings, text, examples, lists, everything\n`;
    prompt += `- Keep markdown formatting (**, ##, -, etc.) but translate the text\n`;
    prompt += `- Use natural, fluent ${languageName} - not literal translation\n`;
    prompt += `- NEVER mix languages - pure ${languageName} only\n\n`;
  } else {
    console.log('✅ Using English');
  }

  prompt += `---\n\n`;
  prompt += `**USER QUESTION:** ${message}\n\n`;
  prompt += `**YOUR RESPONSE** (in markdown format):\n`;

  return prompt;
}

function analyzeIntent(message) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('exam') || lowerMsg.includes('test') || lowerMsg.includes('prepare')) {
    return 'exam_prep';
  } else if (lowerMsg.includes('explain') || lowerMsg.includes('what is') || lowerMsg.includes('how')) {
    return 'explanation';
  } else if (lowerMsg.includes('example') || lowerMsg.includes('show me')) {
    return 'example_request';
  } else if (lowerMsg.includes('summarize') || lowerMsg.includes('summary')) {
    return 'summarization';
  }
  return 'general_query';
}

function extractTopic(message, response) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('machine learning') || lowerMsg.includes('ml')) {
    return 'machine learning';
  } else if (lowerMsg.includes('python')) {
    return 'python programming';
  } else if (lowerMsg.includes('data structure')) { // [!code ++] THE FIX IS HERE
    return 'data structures';
  } else if (lowerMsg.includes('algorithm')) {
    return 'algorithms';
  }
  return null;
}

function extractSources(response, documents = []) {
  const sources = [];
  
  // Check if response indicates it's from documents
  if (response.includes('📄 Based on your documents') || 
      response.includes('From your documents')) {
    // Extract document names mentioned in the response
    documents.forEach(doc => {
      if (doc && doc.name && response.toLowerCase().includes(doc.name.toLowerCase())) {
        sources.push(doc.name);
      }
    });
    
    // If no specific documents found but response claims to be from documents
    if (sources.length === 0 && documents.length > 0) {
      sources.push('User Documents');
    }
  } else if (response.includes('🧠 Based on general knowledge')) {
    sources.push('AI General Knowledge');
  }
  
  // Also check for explicit [Source: ...] patterns
  const sourcePattern = /\[Source: ([^\]]+)\]/g;
  let match;
  while ((match = sourcePattern.exec(response)) !== null) {
    sources.push(match[1]);
  }
  
  return [...new Set(sources)]; // Remove duplicates
}

export default router;