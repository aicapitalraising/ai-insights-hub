import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const prodUrl = Deno.env.get('ORIGINAL_SUPABASE_URL')!;
    const prodKey = Deno.env.get('ORIGINAL_SUPABASE_SERVICE_ROLE_KEY')!;
    const prodDb = createClient(prodUrl, prodKey);

    // Add media_buyer column if not exists
    const { error: e1 } = await prodDb.rpc('exec_sql', {
      query: "ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS media_buyer text DEFAULT NULL"
    });

    // Add account_manager column if not exists
    const { error: e2 } = await prodDb.rpc('exec_sql', {
      query: "ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS account_manager text DEFAULT NULL"
    });

    // If rpc doesn't work, try direct REST approach - just test if columns exist
    // by doing a select
    const { data, error: testErr } = await prodDb
      .from('clients')
      .select('media_buyer, account_manager')
      .limit(1);

    return new Response(JSON.stringify({ 
      success: true, 
      rpc_errors: [e1?.message, e2?.message],
      test_select: testErr ? testErr.message : `OK - ${data?.length} rows`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
