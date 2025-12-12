import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateResponse(prompt, conversationHistory = [], language = 'en') {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log language for debugging
      if (language !== 'en') {
        console.log('🌍 Generating response in:', language);
      }

      // Use Gemini 2.5 Flash (only working model)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.8,  // Slightly higher for more comprehensive output
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,  // Maximum tokens for complete answers
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
      return response.text();

    } catch (error) {
      const isRateLimitOrOverload = error.message?.includes('503') || 
                                    error.message?.includes('429') ||
                                    error.message?.includes('overloaded');
      
      if (isRateLimitOrOverload && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⚠️ Gemini API overloaded. Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      }
      
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response: ' + error.message);
    }
  }
}

export async function analyzeDocument(documentText, query) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze the following document and answer the question.

Document content:
${documentText.substring(0, 10000)}

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
