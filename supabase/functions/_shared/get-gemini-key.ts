import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get Gemini API key with priority:
 * 1. Key passed in request body (from client-side useGeminiKey)
 * 2. Agency settings (stored in settings JSONB) — reads from PRODUCTION DB
 * 3. GEMINI_API_KEY env var (fallback)
 */
export async function getGeminiApiKey(requestApiKey?: string): Promise<string | null> {
  // Priority 1: Key from request
  if (requestApiKey?.trim()) return requestApiKey;

  // Priority 2: Agency settings from PRODUCTION database
  try {
    const supabaseUrl = Deno.env.get('ORIGINAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('ORIGINAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await sb
      .from('agency_settings')
      .select('settings')
      .limit(1)
      .maybeSingle();

    const settings = (data as any)?.settings;
    if (settings?.gemini_api_key?.trim()) {
      return settings.gemini_api_key;
    }
  } catch (err) {
    console.warn('Failed to fetch agency settings for Gemini key:', err);
  }

  // Priority 3: Env var
  return Deno.env.get('GEMINI_API_KEY') || null;
}
