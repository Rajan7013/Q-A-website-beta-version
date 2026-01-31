// Setup environment FIRST
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const TEST_USER_ID = 'user_test_manual_1';
const FILE_PATH = 'C:/Users/rajan/.gemini/antigravity/scratch/CSV Final Report.pdf';

async function runTest() {
    console.log('🚀 STARTING E2E RAG TEST');
    console.log(`📂 File: ${FILE_PATH}`);

    try {
        // Dynamic imports to ensure env vars are loaded BEFORE modules use them
        const { createClient } = await import('@supabase/supabase-js');
        const { processDocument } = await import('./src/utils/documentProcessor.js');
        const { ensureUser, createDocument, saveDocumentPages, searchDocumentPages } = await import('./src/utils/supabase.js');
        const embeddingClient = (await import('./src/utils/embeddingClient.js')).default;
        const { generateResponse } = await import('./src/utils/gemini.js');
        const fs = (await import('fs')).default;

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

        // Sanity Check
        console.log('🕵️ Running raw sanity check...');
        const { error: sanityAppError } = await supabase.from('users').select('count');
        if (sanityAppError) throw new Error('Sanity check failed: ' + sanityAppError.message);
        console.log('✅ Sanity check passed (users table accessible)');

        // 1. READ FILE
        if (!fs.existsSync(FILE_PATH)) {
            throw new Error('File not found at path!');
        }
        const buffer = fs.readFileSync(FILE_PATH);
        const filename = path.basename(FILE_PATH);
        console.log(`✅ File read: ${buffer.length} bytes`);

        // 2. PROCESS DOCUMENT (Parsing)
        console.log('🔄 Processing document...');
        const processed = await processDocument(buffer, '.pdf');
        console.log(`✅ Parsed: ${processed.totalPages} pages, ${processed.wordCount} words`);

        // 3. ENSURE USER
        console.log('👤 Ensuring user...');
        await ensureUser(TEST_USER_ID, 'test@example.com', 'Test', 'User');
        console.log('✅ User ensured');

        // 4. CREATE DOCUMENT IN DB
        console.log('💾 Saving document to DB...');
        const doc = await createDocument(TEST_USER_ID, {
            filename: filename,
            file_key: 'test_uploads/' + filename,
            file_size: buffer.length,
            file_type: '.pdf',
            page_count: processed.totalPages,
            word_count: processed.wordCount,
            status: 'processed'
        });
        console.log(`✅ Document created with ID: ${doc.id}`);

        // 5. SAVE PAGES
        console.log(`📄 Saving ${processed.pages.length} pages...`);
        const savedPages = await saveDocumentPages(doc.id, processed.pages);
        console.log('✅ Pages saved.');

        // 6. GENERATE EMBEDDINGS
        console.log('🧮 Generating embeddings...');
        const healthy = await embeddingClient.checkHealth();
        if (healthy) {
            for (const page of savedPages) {
                try {
                    const embedding = await embeddingClient.generateEmbedding(page.content);
                    if (embedding) {
                        await supabase.from('document_pages').update({ embedding }).eq('id', page.id);
                    }
                } catch (e) {
                    console.warn(`⚠️ Embedding failed for page ${page.page_number}`);
                }
            }
            console.log('✅ Embeddings generated (or skipped if service down).');
        } else {
            console.log('⚠️ Embedding service NOT healthy. Skipping embeddings.');
        }

        // 7. QUERY (RAG Simulation)
        const query = "What is the conclusion of this report?";
        console.log(`\n❓ QUESTION: "${query}"`);

        // Search
        console.log('🔍 Searching...');
        const relevantPages = await searchDocumentPages([doc.id], query, 5);
        console.log(`found ${relevantPages.length} pages via search`);

        if (relevantPages.length === 0) {
            console.log('❌ No relevant pages found!');
        } else {
            const context = relevantPages.map(p => p.content).join('\n\n');
            console.log(`✅ Context retrieved (${context.length} chars).`);

            // 8. GENERATE RESPONSE
            console.log('🤖 Generating Answer with Gemini...');
            const prompt = `Answer based on this context:\n\n${context}\n\nQuestion: ${query}`;
            const answer = await generateResponse(prompt);

            console.log('\n✨ ANSWER:');
            console.log('---------------------------------------------------');
            console.log(answer);
            console.log('---------------------------------------------------');
            console.log('✅✅✅ TEST COMPLETED SUCCESSFULLY ✅✅✅');
        }

    } catch (error) {
        console.error('💥 TEST FAILED:', error);
        process.exit(1);
    }
}

runTest();
