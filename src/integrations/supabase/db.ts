import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Original Supabase project with all production data
const ORIGINAL_SUPABASE_URL = 'https://jgwwmtuvjlmzapwqiabu.supabase.co';
const ORIGINAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd3dtdHV2amxtemFwd3FpYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDkzODIsImV4cCI6MjA4MzMyNTM4Mn0.STFrUoif30xXQCjabc3skP6_tTnVIATwHhwWxeZoUr4';

export const supabase: SupabaseClient<any> = createClient(ORIGINAL_SUPABASE_URL, ORIGINAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
}) as SupabaseClient<any>;
