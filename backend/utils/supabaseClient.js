import { createClient } from '@supabase/supabase-js';

// Get variables from Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create the client
// We use the SERVICE_ROLE_KEY here for backend operations,
// which bypasses Row Level Security.
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

export default supabase;