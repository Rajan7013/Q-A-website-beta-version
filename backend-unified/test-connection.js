
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

console.log('--- DIAGNOSTIC START ---');
console.log(`Checking URL: ${url}`);

// Test 1: Direct Fetch
async function testDirectFetch() {
  console.log('\nTest 1: Direct Fetch to Supabase REST endpoint...');
  try {
    // Supabase REST endpoint is usually /rest/v1/
    const target = `${url}/rest/v1/`;
    console.log(`Fetching ${target}...`);
    const res = await fetch(target, {
       method: 'GET',
       headers: {
         'apikey': key,
         'Authorization': `Bearer ${key}`
       }
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Direct Fetch: SUCCESS ✅');
  } catch (error) {
    console.error('Direct Fetch: FAILED ❌');
    console.error('Error details:', error);
    if (error.cause) console.error('Cause:', error.cause);
  }
}

// Test 2: Supabase Client
async function testSupabaseClient() {
  console.log('\nTest 2: Supabase Client Connection...');
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase Client: FAILED ❌ (API Error)');
      console.error(error);
    } else {
      console.log('Supabase Client: SUCCESS ✅');
    }
  } catch (err) {
    console.error('Supabase Client: FAILED ❌ (Network/JS Error)');
    console.error(err);
  }
}

async function run() {
  await testDirectFetch();
  await testSupabaseClient();
  console.log('\n--- DIAGNOSTIC END ---');
}

run();
