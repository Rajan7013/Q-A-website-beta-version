import { generateResponse } from './src/utils/gemini.js';

console.log('Testing Groq API...');
generateResponse('Hello, are you working?')
    .then(response => {
        console.log('✅ Success! Response:', response);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
