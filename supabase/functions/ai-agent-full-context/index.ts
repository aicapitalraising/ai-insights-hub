import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Context-Tokens, X-System-Tokens",
};

const PAGE_SIZE = 1000;

/** Paginate a Supabase query to get all rows beyond the 1000 limit */
async function fetchAll(queryBuilder: any): Promise<any[]> {
  const allRows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryBuilder.range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("fetchAll error:", error.message);
      break;
    }
    const rows = data || [];
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model = "gemini-2.5-pro", clientFilter } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all data in parallel — 30 day window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const clientQuery = supabase.from("clients").select("id, name, status, industry, slug, meta_ad_account_id, ghl_location_id, hubspot_portal_id");
    if (clientFilter && clientFilter !== "all") {
      clientQuery.eq("id", clientFilter);
    }

    const [
      { data: clients },
      dailyMetrics,
      leads,
      calls,
      fundedInvestors,
      { data: tasks },
      { data: clientSettings },
    ] = await Promise.all([
      clientQuery,
      fetchAll(
        supabase
          .from("daily_metrics")
          .select("client_id, date, ad_spend, leads, calls, showed_calls, funded_investors, funded_dollars, spam_leads, commitment_dollars, commitments, reconnect_calls, reconnect_showed")
          .gte("date", thirtyDaysAgoStr)
      ),
      fetchAll(
        supabase
          .from("leads")
          .select("id, client_id, source, status, is_spam, created_at, name, utm_source, utm_campaign")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
      ),
      fetchAll(
        supabase
          .from("calls")
          .select("id, client_id, showed, outcome, scheduled_at, contact_name, is_reconnect, appointment_status, booked_at, created_at")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
      ),
      fetchAll(
        supabase
          .from("funded_investors")
          .select("id, client_id, name, funded_amount, funded_at, commitment_amount, time_to_fund_days, calls_to_fund")
          .order("funded_at", { ascending: false })
      ),
      supabase
        .from("tasks")
        .select("id, client_id, title, status, priority, due_date")
        .in("status", ["todo", "in_progress"]),
      supabase
        .from("client_settings")
        .select("client_id, mrr, monthly_ad_spend_target, total_raise_amount, funded_investor_label, meta_ads_sync_error")
    ]);

    console.log(`[ai-agent] Fetched: ${clients?.length || 0} clients, ${dailyMetrics.length} daily_metrics, ${leads.length} leads, ${calls.length} calls, ${fundedInvestors.length} funded`);

    // Build comprehensive context per client
    const clientDataBlocks: string[] = [];
    const clientList = clients || [];

    for (const client of clientList) {
      const cId = client.id;
      const cMetrics = dailyMetrics.filter((m: any) => m.client_id === cId);
      const cLeads = leads.filter((l: any) => l.client_id === cId);
      const cCalls = calls.filter((c: any) => c.client_id === cId);
      const cFunded = fundedInvestors.filter((f: any) => f.client_id === cId);
      const cTasks = (tasks || []).filter((t: any) => t.client_id === cId);
      const cSettings = (clientSettings || []).find((s: any) => s.client_id === cId);

      // Aggregate metrics
      const totalAdSpend = cMetrics.reduce((s: number, m: any) => s + (m.ad_spend || 0), 0);
      const totalLeads = cMetrics.reduce((s: number, m: any) => s + (m.leads || 0), 0);
      const totalCalls = cMetrics.reduce((s: number, m: any) => s + (m.calls || 0), 0);
      const totalShowed = cMetrics.reduce((s: number, m: any) => s + (m.showed_calls || 0), 0);
      const totalFundedCount = cMetrics.reduce((s: number, m: any) => s + (m.funded_investors || 0), 0);
      const totalFundedDollars = cMetrics.reduce((s: number, m: any) => s + (m.funded_dollars || 0), 0);
      const totalSpam = cMetrics.reduce((s: number, m: any) => s + (m.spam_leads || 0), 0);
      const totalCommitments = cMetrics.reduce((s: number, m: any) => s + (m.commitments || 0), 0);
      const totalCommitmentDollars = cMetrics.reduce((s: number, m: any) => s + (m.commitment_dollars || 0), 0);
      const cpl = totalLeads > 0 ? totalAdSpend / totalLeads : 0;
      const cpc = totalCalls > 0 ? totalAdSpend / totalCalls : 0;
      const costOfCapital = totalFundedDollars > 0 ? (totalAdSpend / totalFundedDollars) * 100 : 0;

      // Lead sources breakdown
      const sourceMap: Record<string, number> = {};
      cLeads.forEach((l: any) => {
        const src = l.utm_source || l.source || "unknown";
        sourceMap[src] = (sourceMap[src] || 0) + 1;
      });

      const openTasks = cTasks.filter((t: any) => t.status !== "done");
      const overdueTasks = openTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());

      // Integrations status
      const integrations: string[] = [];
      if (client.meta_ad_account_id) integrations.push("Meta Ads");
      if (client.ghl_location_id) integrations.push("GHL");
      if (client.hubspot_portal_id) integrations.push("HubSpot");

      let block = `\n## ${client.name} (${client.status})${client.industry ? ` | ${client.industry}` : ""}
**Integrations:** ${integrations.length > 0 ? integrations.join(", ") : "None"}${cSettings?.meta_ads_sync_error ? ` | ⚠️ Meta Sync Error: ${cSettings.meta_ads_sync_error}` : ""}
**30-Day Metrics:**
- Ad Spend: $${totalAdSpend.toLocaleString()} | Leads: ${totalLeads} (${totalSpam} spam) | CPL: $${cpl.toFixed(2)}
- Calls: ${totalCalls} | Shows: ${totalShowed} (${totalCalls > 0 ? ((totalShowed / totalCalls) * 100).toFixed(1) : 0}%) | Cost/Call: $${cpc.toFixed(2)}
- Funded: ${totalFundedCount} investors, $${totalFundedDollars.toLocaleString()} | Cost of Capital: ${costOfCapital.toFixed(2)}%
- Commitments: ${totalCommitments} ($${totalCommitmentDollars.toLocaleString()})`;

      if (cSettings) {
        const parts: string[] = [];
        if (cSettings.mrr) parts.push(`MRR: $${cSettings.mrr}`);
        if (cSettings.monthly_ad_spend_target) parts.push(`Monthly Ad Spend Target: $${cSettings.monthly_ad_spend_target}`);
        if (cSettings.total_raise_amount) parts.push(`Total Raise: $${cSettings.total_raise_amount.toLocaleString()}`);
        if (parts.length > 0) block += `\n**Goals:** ${parts.join(" | ")}`;
      }

      if (Object.keys(sourceMap).length > 0) {
        block += `\n**Lead Sources:** ${Object.entries(sourceMap).map(([s, c]) => `${s}: ${c}`).join(", ")}`;
      }

      if (cFunded.length > 0) {
        const recentFunded = cFunded.slice(0, 5);
        block += `\n**Recent Funded:** ${recentFunded.map((f: any) => `${f.name || "Unknown"} ($${(f.funded_amount || 0).toLocaleString()}, ${f.time_to_fund_days || "?"} days)`).join("; ")}`;
      }

      if (openTasks.length > 0) {
        block += `\n**Open Tasks:** ${openTasks.length} (${overdueTasks.length} overdue)`;
        const topTasks = openTasks.slice(0, 3);
        block += ` — ${topTasks.map((t: any) => `"${t.title}" [${t.priority}]`).join(", ")}`;
      }

      clientDataBlocks.push(block);
    }

    // Build client ID lookup for task creation
    const clientIdLookup = clientList.map((c: any) => `- "${c.name}" → ${c.id}`).join("\n");

    const systemPrompt = `You are an expert agency performance analyst with COMPLETE access to all client data across the portfolio.

Today's Date: ${new Date().toISOString().split("T")[0]}
Total Clients: ${clientList.length} (${clientList.filter((c: any) => c.status === "active").length} active)

# Full Portfolio Data (Last 30 Days)
${clientDataBlocks.join("\n")}

# Task Creation Capability
You can create tasks for any client. When the user asks you to create tasks, add action items, or set up to-dos, include a JSON block in your response using this exact format:

\`\`\`create_tasks
[
  {
    "client_id": "<uuid>",
    "title": "Task title",
    "description": "Optional description",
    "priority": "low|medium|high|urgent",
    "due_date": "YYYY-MM-DD or null"
  }
]
\`\`\`

Client ID Reference:
${clientIdLookup}

IMPORTANT RULES FOR TASK CREATION:
- Always use the exact client UUID from the reference above
- If the user says "for all clients" or "for every client", create one task per active client
- If the user says "for [client name]", match it to the correct client
- Set priority based on urgency keywords: "urgent/asap" → urgent, "important" → high, default → medium
- Set due_date if the user mentions a deadline, otherwise null
- Always explain what tasks you created after the JSON block
- You can create multiple tasks in a single block

---
Provide specific, data-driven insights. Reference exact numbers. Compare clients when relevant. Flag concerning trends proactively. When asked to create tasks, always include the create_tasks JSON block.`;

    // Estimate tokens
    const systemTokens = Math.ceil(systemPrompt.length / 4);
    const conversationTokens = (messages || []).reduce(
      (sum: number, m: any) => sum + Math.ceil((m.content || "").length / 4),
      0
    );
    const totalTokens = systemTokens + conversationTokens;

    // Resolve model
    const GATEWAY_MODEL_MAP: Record<string, string> = {
      "gemini-2.5-pro": "google/gemini-2.5-pro",
      "gemini-3-pro": "google/gemini-3.1-pro-preview",
      "gemini-3-flash": "google/gemini-3-flash-preview",
      "gpt-5": "openai/gpt-5",
      "grok": "google/gemini-2.5-pro", // fallback
      "grok-4-reasoning": "google/gemini-2.5-pro", // fallback
    };

    const resolvedModel = GATEWAY_MODEL_MAP[model] || "google/gemini-2.5-pro";

    console.log(`[ai-agent] Using model: ${resolvedModel}, system tokens: ~${systemTokens}, context chars: ${systemPrompt.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Context-Tokens": String(totalTokens),
        "X-System-Tokens": String(systemTokens),
      },
    });
  } catch (e) {
    console.error("ai-agent-full-context error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
