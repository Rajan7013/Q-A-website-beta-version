import { analyzeQuery } from './src/utils/queryAnalyzer.js';
import { preprocessQuery } from './src/utils/queryPreprocessor.js';
import { generateResponse } from './src/utils/gemini.js';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
    try {
        console.log('Testing Direct Generate Response...');
        const response = await generateResponse("Hi", []);
        console.log('Direct Response:', response);

        console.log('\nTesting Query Analysis...');
        const analysis = await analyzeQuery("how to install nodejs");
        console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

        console.log('\n✅ Logic verification passed');
    } catch (error) {
        console.error('❌ Logic verification failed:', error);
        if (error.status) console.error('Status:', error.status);
    }
}

verify();
