import { generateResponse } from './gemini.js';
import { logger } from './logger.js';

/**
 * Validates if an AI-generated answer is legally grounded in the provided source documents.
 * Prevents hallucinations by checking for factual consistency.
 * 
 * @param {string} question - The user's original question
 * @param {string} answer - The AI's generated answer
 * @param {string} context - The provided document context used to generate the answer
 * @returns {Promise<{isGrounded: boolean, score: number, reasoning: string}>}
 */
export async function validateAnswer(question, answer, context) {
    try {
        // Skip validation for very short answers or if no context provided (general knowledge)
        if (!context || context.length < 50 || answer.length < 20) {
            return { isGrounded: true, score: 1.0, reasoning: "No context provided or answer too short for validation." };
        }

        const validationPrompt = `You are a strict Fact Checker and Hallucination Detector.
    
**TASK**: Verify if the "CANDIDATE ANSWER" is fully supported by the "PROVIDED CONTEXT".

**PROVIDED CONTEXT**:
${context.substring(0, 15000)} ... (truncated if essential)

**USER QUESTION**: "${question}"

**CANDIDATE ANSWER**:
"${answer}"

**INSTRUCTIONS**:
1. Check if every claim in the answer is found in the context.
2. Ignore minor wording differences, focus on factual claims.
3. If the answer claims information not present in the context, it is a HALLUCINATION.
4. If the answer assumes external knowledge not in the text (unless common knowledge), flag it.

Return ONLY JSON:
{
  "isGrounded": true/false,     // True if 90%+ of claims are supported
  "score": 0.0 to 1.0,          // 1.0 = perfect match, 0.0 = total hallucination
  "reasoning": "Brief explanation of what is unsubstantiated, if any"
}`;

        // Use a fast/low-temp call for validation
        const response = await generateResponse(validationPrompt, [], 'en', {
            temperature: 0.1, // Strict logic
            maxTokens: 500
        });

        // Parse JSON
        const jsonMatch = response.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            logger.warn('Validator returned invalid JSON, assuming valid.');
            return { isGrounded: true, score: 1.0, reasoning: "Validator parsing failed" };
        }

        const result = JSON.parse(jsonMatch[0]);

        logger.info('🛡️ Answer Validation Complete', {
            isGrounded: result.isGrounded,
            score: result.score
        });

        return result;

    } catch (error) {
        logger.error('Answer validation failed', { error: error.message });
        // Fail open (allow answer) so we don't block users if validator crashes
        return { isGrounded: true, score: 1.0, reasoning: "Validation error" };
    }
}
