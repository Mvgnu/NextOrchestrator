import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for the browser
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase; 