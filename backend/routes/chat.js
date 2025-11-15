import express from 'express';
import { generateResponse } from '../utils/gemini.js';

const router = express.Router();

// Store conversation context in memory (use Redis/DB in production)
const conversationContexts = new Map();

// Import documents array from documents route
let documentsStore = [];

// Function to set documents store (called from documents route)
export function setDocumentsStore(docs) {
  documentsStore = docs;
}

// Function to get documents store
export function getDocumentsStore() {
  return documentsStore;
}

router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, documents, context, language = 'en' } = req.body;
    console.log('🌍 Backend received language:', language);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation context
    let conversationContext = conversationContexts.get(sessionId) || {
      history: [],
      topic: null,
      intent: null,
      documents: []
    };

    // Update context with new documents
    if (documents && documents.length > 0) {
      conversationContext.documents = documents;
    }

    // Build prompt with context and document content
    const documentIds = documents?.map(d => d.id) || [];
    const prompt = buildPrompt(message, conversationContext, documentIds, language);

    // Generate response from Gemini
    const aiResponse = await generateResponse(prompt, conversationContext.history);

    // Update conversation history
    conversationContext.history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: aiResponse }] }
    );

    // Analyze and update intent/topic
    conversationContext.topic = extractTopic(message, aiResponse);
    conversationContext.intent = analyzeIntent(message);

    // Save context
    conversationContexts.set(sessionId, conversationContext);

    // Extract source information
    const sources = extractSources(aiResponse, documents);

    res.json({
      response: aiResponse,  // Send raw markdown response (no formatting needed)
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
router.post('/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    conversationContexts.delete(sessionId);
  }
  res.json({ message: 'Context cleared' });
});

function buildPrompt(message, context, documentIds = [], language = 'en') {
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

  // Add document context with actual content
  if (documentIds && documentIds.length > 0) {
    availableDocs = documentIds
      .map(docId => documentsStore.find(d => d.id === docId))
      .filter(doc => doc && doc.textContent);
    
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
  } else if (lowerMsg.includes('data structure')) {
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