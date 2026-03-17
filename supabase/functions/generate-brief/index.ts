import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

interface BriefRequest {
  action: "generate_brief" | "generate_scripts";
  clientId: string;
  briefId?: string; // Required for generate_scripts
  platform?: string;
  reason?: string; // "high_cpa" | "fatigue" | "scaling" | "new_angle"
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Claude API ${res.status}: ${errBody.substring(0, 500)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BriefRequest = await req.json();
    const { action, clientId, briefId, platform = "meta", reason = "scaling" } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Claude API key from agency_settings
    const { data: settings } = await supabase
      .from("agency_settings")
      .select("anthropic_api_key")
      .limit(1)
      .maybeSingle();

    const ANTHROPIC_API_KEY = settings?.anthropic_api_key || Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Add it in Agency Settings or as an environment variable.");
    }

    // Get client info
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, name, industry, description")
      .eq("id", clientId)
      .single();

    if (clientErr || !client) {
      throw new Error("Client not found");
    }

    // Get client settings for KPI context
    const { data: clientSettings } = await supabase
      .from("client_settings")
      .select("target_cpl, target_cost_per_call, target_cost_per_show, target_cost_per_investor, mrr")
      .eq("client_id", clientId)
      .maybeSingle();

    if (action === "generate_brief") {
      // Fetch top-performing campaigns (by attributed_leads)
      const { data: campaigns } = await supabase
        .from("meta_campaigns")
        .select("name, status, spend, impressions, clicks, ctr, cpc, cpm, attributed_leads, attributed_calls, attributed_funded, cost_per_lead, cost_per_funded")
        .eq("client_id", clientId)
        .gt("spend", 0)
        .order("spend", { ascending: false })
        .limit(10);

      // Fetch top ad sets
      const { data: adSets } = await supabase
        .from("meta_ad_sets")
        .select("name, status, spend, impressions, clicks, ctr, attributed_leads, attributed_funded, targeting")
        .eq("client_id", clientId)
        .gt("spend", 0)
        .order("spend", { ascending: false })
        .limit(10);

      // Fetch top ads
      const { data: ads } = await supabase
        .from("meta_ads")
        .select("name, status, spend, impressions, clicks, ctr, cpc, attributed_leads, attributed_funded, cost_per_lead")
        .eq("client_id", clientId)
        .gt("spend", 0)
        .order("spend", { ascending: false })
        .limit(10);

      // Calculate aggregate performance
      const totalSpend = (campaigns || []).reduce((s, c) => s + (Number(c.spend) || 0), 0);
      const totalLeads = (campaigns || []).reduce((s, c) => s + (Number(c.attributed_leads) || 0), 0);
      const totalFunded = (campaigns || []).reduce((s, c) => s + (Number(c.attributed_funded) || 0), 0);
      const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const avgCPF = totalFunded > 0 ? totalSpend / totalFunded : 0;

      const systemPrompt = `You are a senior performance creative strategist at a digital marketing agency specializing in direct response advertising. You analyze Meta Ads performance data and generate strategic creative briefs that produce high-converting ads.

Your briefs are data-driven, specific, and actionable. You identify winning patterns and develop new angles based on what the data shows is working.

Always respond with valid JSON matching this exact schema:
{
  "title": "string - concise brief title",
  "objective": "string - what this brief aims to achieve",
  "target_audience": {
    "demographics": "string",
    "psychographics": "string",
    "pain_points": ["string"],
    "desires": ["string"]
  },
  "messaging_angles": [
    {
      "angle": "string - angle name",
      "hook": "string - opening hook text",
      "rationale": "string - why this angle based on data"
    }
  ],
  "creative_direction": "string - visual and copy direction",
  "ad_format": "string - recommended format (image/video/carousel)"
}`;

      const userPrompt = `Generate a creative brief for ${client.name} (${client.industry || "industry not specified"}).
${client.description ? `Business description: ${client.description}` : ""}

PERFORMANCE DATA:
- Total spend: $${totalSpend.toFixed(2)}
- Total leads: ${totalLeads}
- Total funded/converted: ${totalFunded}
- Average CPL: $${avgCPL.toFixed(2)}
- Average cost per funded: $${avgCPF.toFixed(2)}
${clientSettings?.target_cpl ? `- Target CPL: $${clientSettings.target_cpl}` : ""}
${clientSettings?.target_cost_per_investor ? `- Target cost per investor: $${clientSettings.target_cost_per_investor}` : ""}

TOP CAMPAIGNS:
${(campaigns || []).map(c => `- ${c.name}: $${Number(c.spend).toFixed(0)} spend, ${c.attributed_leads || 0} leads, ${c.attributed_funded || 0} funded, CTR: ${Number(c.ctr).toFixed(2)}%`).join("\n")}

TOP AD SETS (with targeting):
${(adSets || []).map(a => `- ${a.name}: $${Number(a.spend).toFixed(0)} spend, ${a.attributed_leads || 0} leads, targeting: ${JSON.stringify(a.targeting || {}).substring(0, 200)}`).join("\n")}

TOP ADS:
${(ads || []).map(a => `- ${a.name}: $${Number(a.spend).toFixed(0)} spend, ${a.attributed_leads || 0} leads, CTR: ${Number(a.ctr).toFixed(2)}%, CPC: $${Number(a.cpc).toFixed(2)}`).join("\n")}

GENERATION REASON: ${reason}
PLATFORM: ${platform}

Based on this data, generate a strategic creative brief with 3 messaging angles. Focus on what's working and identify opportunities for new creative directions.`;

      const response = await callClaude(ANTHROPIC_API_KEY, systemPrompt, userPrompt);

      // Parse Claude's JSON response
      let briefData;
      try {
        // Extract JSON from potential markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
        briefData = JSON.parse(jsonMatch[1]!.trim());
      } catch (parseErr) {
        throw new Error(`Failed to parse brief JSON: ${parseErr}. Raw response: ${response.substring(0, 200)}`);
      }

      // Save to database
      const { data: brief, error: insertErr } = await supabase
        .from("creative_briefs")
        .insert({
          client_id: clientId,
          title: briefData.title,
          objective: briefData.objective,
          target_audience: briefData.target_audience,
          messaging_angles: briefData.messaging_angles,
          creative_direction: briefData.creative_direction,
          platform,
          ad_format: briefData.ad_format,
          source_campaigns: (campaigns || []).map(c => c.name),
          performance_snapshot: { totalSpend, totalLeads, totalFunded, avgCPL, avgCPF },
          generation_reason: reason,
          status: "pending",
          generated_by: "ai",
        })
        .select()
        .single();

      if (insertErr) throw new Error(`Failed to save brief: ${insertErr.message}`);

      return new Response(JSON.stringify({ success: true, brief }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_scripts") {
      if (!briefId) throw new Error("briefId is required for generate_scripts");

      // Fetch the brief
      const { data: brief, error: briefErr } = await supabase
        .from("creative_briefs")
        .select("*")
        .eq("id", briefId)
        .single();

      if (briefErr || !brief) throw new Error("Brief not found");

      const angles = brief.messaging_angles || [];

      const systemPrompt = `You are an expert direct response copywriter who writes high-converting Meta ads. You take creative briefs and produce production-ready ad scripts.

Your copy is punchy, specific, and drives action. You use proven direct response frameworks: AIDA, PAS, hook-story-offer.

For each messaging angle in the brief, generate one complete ad script.

Always respond with valid JSON matching this exact schema:
{
  "scripts": [
    {
      "title": "string - script name",
      "angle": "string - which angle this uses",
      "headline": "string - primary headline (max 40 chars)",
      "headlines": ["string - 3 headline variants"],
      "body_copy": "string - primary body text (max 125 chars for Meta primary text)",
      "body_variants": ["string - 2 body copy variants"],
      "cta": "string - call to action",
      "hook": "string - opening hook (first line or first 3 seconds)",
      "script_body": "string - full script if video format, otherwise null"
    }
  ]
}`;

      const userPrompt = `Generate ad scripts from this creative brief for ${client.name}:

BRIEF: ${brief.title}
OBJECTIVE: ${brief.objective}
TARGET AUDIENCE: ${JSON.stringify(brief.target_audience)}
CREATIVE DIRECTION: ${brief.creative_direction}
AD FORMAT: ${brief.ad_format || "image"}
PLATFORM: ${brief.platform || "meta"}

MESSAGING ANGLES:
${angles.map((a: any, i: number) => `${i + 1}. ${a.angle}: ${a.hook} (Rationale: ${a.rationale})`).join("\n")}

Generate one production-ready ad script per angle (${angles.length} scripts total). Each script should be ready to hand to a designer/videographer.`;

      const response = await callClaude(ANTHROPIC_API_KEY, systemPrompt, userPrompt);

      let scriptData;
      try {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
        scriptData = JSON.parse(jsonMatch[1]!.trim());
      } catch (parseErr) {
        throw new Error(`Failed to parse scripts JSON: ${parseErr}. Raw: ${response.substring(0, 200)}`);
      }

      // Save each script
      const savedScripts = [];
      for (const script of scriptData.scripts || []) {
        const { data: saved, error: saveErr } = await supabase
          .from("ad_scripts")
          .insert({
            client_id: clientId,
            brief_id: briefId,
            title: script.title,
            headline: script.headline,
            headlines: script.headlines,
            body_copy: script.body_copy,
            body_variants: script.body_variants,
            cta: script.cta,
            hook: script.hook,
            script_body: script.script_body,
            platform: brief.platform || "meta",
            ad_format: brief.ad_format || "image",
            angle: script.angle,
            status: "draft",
            generated_by: "ai",
          })
          .select()
          .single();

        if (saveErr) {
          console.error(`Failed to save script: ${saveErr.message}`);
        } else {
          savedScripts.push(saved);
        }
      }

      // Update brief status
      await supabase
        .from("creative_briefs")
        .update({ status: "in_production" })
        .eq("id", briefId);

      return new Response(JSON.stringify({ success: true, scripts: savedScripts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("generate-brief error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
