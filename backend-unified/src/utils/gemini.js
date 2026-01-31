import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Using Llama 3.3 70B (Latest supported model)
const MODEL_NAME = "llama-3.3-70b-versatile";

export async function generateResponse(prompt, conversationHistory = [], language = 'en', options = {}) {
  try {
    // Convert history format if needed
    // Convert history format if needed
    const messages = conversationHistory.map(msg => {
      // Handle Frontend/Memory format { type: 'user'|'bot', text: '...' }
      if (msg.type && msg.text) {
        return {
          role: msg.type === 'bot' || msg.type === 'model' ? 'assistant' : 'user',
          content: msg.text
        };
      }
      // Handle Google Gemini format { role, parts: [{text}] }
      if (msg.parts && msg.parts[0]?.text) {
        return {
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.parts[0].text
        };
      }
      // Handle Groq/OpenAI format { role, content }
      return {
        role: msg.role || 'user',
        content: msg.content || ''
      };
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    // Add system instruction for language if needed
    if (language !== 'en') {
      messages.unshift({
        role: "system",
        content: `You must respond in ${language}.`
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: MODEL_NAME,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 8192,
      top_p: 1,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || "";

  } catch (error) {
    console.error('Groq API error:', error);

    if (error.status === 429) {
      return "⚠️ **AI Rate Limit Reached**\n\nThe Groq API is currently busy. Please try again in a moment.";
    }

    // Handle context length errors
    if (error.status === 400 && error.error?.code === 'context_length_exceeded') {
      return "⚠️ **Document Too Large**\n\nThe document context is too large for the AI to process at once. Please try asking about a specific part.";
    }

    throw new Error('Failed to generate AI response: ' + (error.message || error));
  }
}

export async function analyzeDocument(documentText, query) {
  try {
    const prompt = `Analyze the following document and answer the question.

Document content:
${documentText.substring(0, 50000)}

Question: ${query}

Provide a clear, well-formatted answer based on the document content.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: MODEL_NAME,
      temperature: 0.5,
      max_tokens: 4096,
    });

    return chatCompletion.choices[0]?.message?.content || "";

  } catch (error) {
    console.error('Document analysis error:', error);
    throw new Error('Failed to analyze document');
  }
}
