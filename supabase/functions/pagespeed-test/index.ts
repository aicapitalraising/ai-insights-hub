import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CACHE_TTL_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, strategy = 'mobile', stepId, forceRefresh = false } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache if stepId provided and not forcing refresh
    if (stepId && !forceRefresh) {
      const { data: cached } = await supabase
        .from('pagespeed_cache')
        .select('*')
        .eq('step_id', stepId)
        .eq('strategy', strategy)
        .single();

      if (cached) {
        const fetchedAt = new Date(cached.fetched_at).getTime();
        const now = Date.now();
        const ageHours = (now - fetchedAt) / (1000 * 60 * 60);

        if (ageHours < CACHE_TTL_HOURS) {
          console.log(`Returning cached PageSpeed result for step ${stepId} (${ageHours.toFixed(1)}h old)`);
          return new Response(
            JSON.stringify({
              performanceScore: cached.performance_score,
              metrics: cached.metrics,
              cached: true,
              fetchedAt: cached.fetched_at,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log(`Running PageSpeed test for: ${url} (strategy: ${strategy})`);

    const apiUrl = `${PAGESPEED_API}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;

    let response: Response | null = null;
    const maxRetries = 4;
    let delay = 2000;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(apiUrl);
      if (response.status === 429 && attempt < maxRetries) {
        console.warn(`Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('PageSpeed API error:', errorText);
      throw new Error(`PageSpeed API returned ${response?.status || 'unknown'}`);
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse || !lighthouse.categories || !lighthouse.audits) {
      throw new Error('Invalid response from PageSpeed API');
    }

    const metrics = {
      firstContentfulPaint: lighthouse.audits['first-contentful-paint']?.displayValue || 'N/A',
      speedIndex: lighthouse.audits['speed-index']?.displayValue || 'N/A',
      largestContentfulPaint: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
      timeToInteractive: lighthouse.audits['interactive']?.displayValue || 'N/A',
      totalBlockingTime: lighthouse.audits['total-blocking-time']?.displayValue || 'N/A',
      cumulativeLayoutShift: lighthouse.audits['cumulative-layout-shift']?.displayValue || 'N/A',
    };

    const performanceScore = (lighthouse.categories.performance?.score || 0) * 100;
    const fetchedAt = new Date().toISOString();

    // Store in cache if stepId provided
    if (stepId) {
      await supabase.from('pagespeed_cache').upsert({
        step_id: stepId,
        strategy,
        url,
        performance_score: performanceScore,
        metrics,
        fetched_at: fetchedAt,
      }, { onConflict: 'step_id,strategy' });
    }

    console.log(`PageSpeed test complete. Score: ${performanceScore}`);

    return new Response(
      JSON.stringify({ performanceScore, metrics, cached: false, fetchedAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error running PageSpeed test:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
