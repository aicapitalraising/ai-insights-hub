import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, strategy = 'mobile' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Extract key metrics from Lighthouse results
    const lighthouse = data.lighthouseResult;
    
    if (!lighthouse || !lighthouse.categories || !lighthouse.audits) {
      throw new Error('Invalid response from PageSpeed API');
    }

    const result = {
      performanceScore: (lighthouse.categories.performance?.score || 0) * 100,
      metrics: {
        firstContentfulPaint: lighthouse.audits['first-contentful-paint']?.displayValue || 'N/A',
        speedIndex: lighthouse.audits['speed-index']?.displayValue || 'N/A',
        largestContentfulPaint: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
        timeToInteractive: lighthouse.audits['interactive']?.displayValue || 'N/A',
        totalBlockingTime: lighthouse.audits['total-blocking-time']?.displayValue || 'N/A',
        cumulativeLayoutShift: lighthouse.audits['cumulative-layout-shift']?.displayValue || 'N/A',
      }
    };

    console.log(`PageSpeed test complete. Score: ${result.performanceScore}`);

    return new Response(
      JSON.stringify(result),
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
