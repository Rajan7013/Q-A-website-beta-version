import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateResponse(prompt, conversationHistory = []) {
  const maxRetries = 3;
  const baseDelay = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini API attempt ${attempt}/${maxRetries}`);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });

      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      console.log(`✅ Gemini API success on attempt ${attempt}`);
      return response.text();

    } catch (error) {
      console.error(`❌ Gemini API error (attempt ${attempt}):`, error.message);
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw new Error('AI service temporarily unavailable. Please try again in a moment.');
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function isRetryableError(error) {
  const retryableErrors = ['503', '429', '500', 'overloaded', 'temporarily unavailable'];
  const errorMessage = error.message.toLowerCase();
  return retryableErrors.some(code => errorMessage.includes(code));
}

export async function analyzeDocument(documentText, query) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    throw new Error('Failed to analyze document');
  }
}