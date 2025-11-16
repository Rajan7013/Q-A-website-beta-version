import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateResponse(prompt, conversationHistory = [], userApiKey = null) {
  const maxRetries = 3;
  const baseDelay = 2000;
  
  // Use user's API key if provided, otherwise use system key
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('No API key available. Please add your Gemini API key in Settings.');
  }
  
  const genAIInstance = new GoogleGenerativeAI(apiKey);
  
  console.log('🔑 Using API key:', userApiKey ? 'User\'s personal key' : 'System fallback key');
  // API key details removed for security - no logging of sensitive data
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini API attempt ${attempt}/${maxRetries}`);
      console.log('📝 Prompt length:', prompt.length);
      console.log('📚 History length:', conversationHistory.length);
      
      const model = genAIInstance.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });

      // Clean conversation history format - handle empty history
      const cleanHistory = conversationHistory && conversationHistory.length > 0 
        ? conversationHistory.map(msg => ({
            role: msg.role,
            parts: Array.isArray(msg.parts) ? msg.parts : [{ text: msg.parts || msg.text || '' }]
          }))
        : [];
      
      console.log('🔄 Starting chat with history:', cleanHistory.length, 'messages');
      
      const chat = cleanHistory.length > 0 
        ? model.startChat({
            history: cleanHistory,
            generationConfig: {
              temperature: 0.7,
            },
          })
        : model.startChat({
            generationConfig: {
              temperature: 0.7,
            },
          });

      console.log('📤 Sending message to Gemini...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );
      
      const result = await Promise.race([
        chat.sendMessage(prompt),
        timeoutPromise
      ]);
      
      const response = await result.response;
      const responseText = response.text();
      
      console.log(`✅ Gemini API success on attempt ${attempt}`);
      console.log('📥 Response length:', responseText.length);
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      return responseText;

    } catch (error) {
      console.error(`❌ Gemini API error (attempt ${attempt}):`, {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details || 'No additional details',
        stack: error.stack?.substring(0, 200) + '...'
      });
      
      // Check if it's an API key issue
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key') || error.message.includes('API key not valid')) {
        throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
      }
      
      // Check if it's a quota issue
      if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED') || error.message.includes('Resource has been exhausted')) {
        throw new Error('API quota exceeded. Please add your personal Gemini API key in Settings for unlimited usage.');
      }
      
      // Check for model issues
      if (error.message.includes('model') || error.message.includes('not found')) {
        throw new Error('AI model temporarily unavailable. Please try again in a moment.');
      }
      
      // Check for safety issues
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new Error('Request blocked by safety filters. Please rephrase your question.');
      }
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        // Provide more specific error message
        const errorMsg = error.message.includes('fetch') 
          ? 'Network connection error. Please check your internet connection.'
          : error.message.includes('timeout')
          ? 'Request timed out. Please try again.'
          : `AI service error: ${error.message}`;
        
        throw new Error(`${errorMsg} Please try again or add your personal API key in Settings.`);
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function isRetryableError(error) {
  const retryableErrors = [
    '503', '429', '500', '502', '504',
    'overloaded', 'temporarily unavailable', 'service unavailable',
    'timeout', 'network error', 'fetch failed', 'connection refused',
    'internal error', 'server error'
  ];
  const errorMessage = error.message.toLowerCase();
  const statusCode = error.status?.toString() || '';
  
  return retryableErrors.some(code => 
    errorMessage.includes(code) || statusCode.includes(code)
  );
}

export async function analyzeDocument(documentText, query, userApiKey = null) {
  try {
    // Use user's API key if provided, otherwise use system key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('No API key available. Please add your Gemini API key in Settings.');
    }
    
    const genAIInstance = new GoogleGenerativeAI(apiKey);
    const model = genAIInstance.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze the following document and answer the question.

Document content:
${documentText.substring(0, 10000)} // Limit to first 10k chars

Question: ${query}

Provide a clear, well-formatted answer based on the document content.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Document analysis error:', error);
    
    // Check if it's an API key issue
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
    }
    
    // Check if it's a quota issue
    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please add your personal Gemini API key in Settings for unlimited usage.');
    }
    
    throw new Error('Failed to analyze document');
  }
}