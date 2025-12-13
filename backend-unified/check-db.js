import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', process.env.SUPABASE_URL);
// Do not log the full key for security

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function check() {
    try {
        // 1. Check if we can connect
        console.log('1️⃣  Checking connection...');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed or Table Missing:', error.message);
            console.error('   Hint: Does the "users" table exist?');
            return;
        }

        console.log('✅ Connection Successful!');
        console.log('   "users" table exists.');

        // 2. Check documents table
        console.log('2️⃣  Checking "documents" table...');
        const { error: docError } = await supabase.from('documents').select('count', { count: 'exact', head: true });

        if (docError) {
            console.error('❌ "documents" table error:', docError.message);
        } else {
            console.log('✅ "documents" table exists.');
        }

    } catch (err) {
        console.error('💥 Critical Error:', err);
    }
}

check();
