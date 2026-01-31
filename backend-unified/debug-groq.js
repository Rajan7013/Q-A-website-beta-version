import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

console.log('API Key:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
    try {
        console.log('Sending request to Groq...');
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello' }],
            model: "llama3-70b-8192",
        });
        console.log('Success:', chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Groq Error:', error);
        if (error.status) console.error('Status Code:', error.status);
        if (error.error) console.error('Error Details:', error.error);
    }
}

test();
