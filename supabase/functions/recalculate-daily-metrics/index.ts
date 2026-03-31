import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createDualClients, mirrorWrite } from "../_shared/dual-write.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const EdgeRuntime: { waitUntil: (promise: Promise<any>) => void } | undefined;

/**
 * METRIC DATE BASIS:
 * - leads / leads_created: counted by leads.created_at (GHL dateAdded)
 * - calls / calls_scheduled: counted by calls.booked_at (when appointment was created)
 * - showed_calls / calls_showed: counted by calls.scheduled_at (actual appointment date when they showed)
 * - funded_investors / funded_on_day: counted by funded_investors.funded_at (stage change date)
 * - commitments / commitments_on_day: counted by funded_investors.funded_at where commitment_amount > 0
 * - ad_spend / impressions / clicks / ctr: NEVER touched here — owned by sync-meta-ads
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let startDate: string;
  let endDate: string;
  let clientId: string | null = null;

  try {
    const body = await req.json();
    clientId = body.clientId || null;
    
    if (body.startDate && body.endDate) {
      startDate = body.startDate;
      endDate = body.endDate;
    } else {
      // Default: 7-day lookback to catch backdated imports and late-arriving data
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }
  } catch {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    startDate = weekAgo.toISOString().split("T")[0];
    endDate = today.toISOString().split("T")[0];
  }

  console.log(`[recalculate-daily-metrics] Range: ${startDate} to ${endDate}, client: ${clientId || "all"}`);

  // Get active clients
  let clientsQuery = supabase
    .from("clients")
    .select("id, name")
    .in("status", ["active", "onboarding"]);

  if (clientId) {
    clientsQuery = clientsQuery.eq("id", clientId);
  }

  const { data: clients, error: clientsError } = await clientsQuery;
  if (clientsError || !clients) {
    console.error("Failed to fetch clients:", clientsError);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch clients" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const doRecalc = async () => {
    const summary: Array<{ clientId: string; name: string; daysUpdated: number; errors: string[] }> = [];

    // Pre-fetch sales stage config for all clients
    const clientIds = clients.map((c: any) => c.id);
    const { data: allSettings } = await supabase
      .from("client_settings")
      .select("client_id, sales_stage_ids, funded_pipeline_id")
      .in("client_id", clientIds);
    
    const salesConfigMap: Record<string, { salesStageIds: string[]; pipelineId: string | null }> = {};
    for (const s of (allSettings || [])) {
      salesConfigMap[(s as any).client_id] = {
        salesStageIds: (s as any).sales_stage_ids || [],
        pipelineId: (s as any).funded_pipeline_id || null,
      };
    }

    for (const client of clients) {
      const clientResult = { clientId: client.id, name: client.name, daysUpdated: 0, errors: [] as string[] };

      const current = new Date(startDate + "T00:00:00Z");
      const end = new Date(endDate + "T00:00:00Z");

      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const dayStart = `${dateStr}T00:00:00.000Z`;
        const next = new Date(current);
        next.setUTCDate(next.getUTCDate() + 1);
        const dayNext = `${next.toISOString().split("T")[0]}T00:00:00.000Z`;

        try {
          // ── Leads: by created_at ──
          const { count: leadsCount } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("is_spam", false)
            .gte("created_at", dayStart)
            .lt("created_at", dayNext);

          const { count: nullSpamCount } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .is("is_spam", null)
            .gte("created_at", dayStart)
            .lt("created_at", dayNext);

          const { count: spamCount } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("is_spam", true)
            .gte("created_at", dayStart)
            .lt("created_at", dayNext);

          const totalValidLeads = (leadsCount || 0) + (nullSpamCount || 0);

          // ── Calls booked: by booked_at (non-reconnect) ──
          const { count: callsCount } = await supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .neq("is_reconnect", true)
            .gte("booked_at", dayStart)
            .lt("booked_at", dayNext);

          // ── Showed calls: by scheduled_at (actual appointment date) ──
          const { count: showedCount } = await supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("showed", true)
            .neq("is_reconnect", true)
            .gte("scheduled_at", dayStart)
            .lt("scheduled_at", dayNext);

          // ── Calls scheduled for that day: by scheduled_at ──
          const { count: callsScheduledCount } = await supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .neq("is_reconnect", true)
            .gte("scheduled_at", dayStart)
            .lt("scheduled_at", dayNext);

          // ── Reconnect calls by booked_at ──
          const { count: reconnectCount } = await supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("is_reconnect", true)
            .gte("booked_at", dayStart)
            .lt("booked_at", dayNext);

          // ── Reconnect showed by scheduled_at ──
          const { count: reconnectShowedCount } = await supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("is_reconnect", true)
            .eq("showed", true)
            .gte("scheduled_at", dayStart)
            .lt("scheduled_at", dayNext);

          // ── Funded investors: by funded_at (stage change date) ──
          const { data: fundedData, count: fundedCount } = await supabase
            .from("funded_investors")
            .select("funded_amount, commitment_amount", { count: "exact" })
            .eq("client_id", client.id)
            .gte("funded_at", dayStart)
            .lt("funded_at", dayNext);

          const fundedDollars = (fundedData || []).reduce((sum: number, f: any) => {
            const amount = f.funded_amount && f.funded_amount > 0 ? f.funded_amount : f.commitment_amount || 0;
            return sum + amount;
          }, 0);
          const commitmentDollars = (fundedData || []).reduce((sum: number, f: any) => sum + (f.commitment_amount || 0), 0);
          const commitmentCount = (fundedData || []).filter((f: any) => f.commitment_amount && f.commitment_amount > 0).length;

          // ── Sales: from pipeline_opportunities where stage matches sales_stage_ids ──
          let salesCount = 0;
          let salesDollars = 0;
          const salesConfig = salesConfigMap[client.id];
          if (salesConfig?.salesStageIds?.length > 0 && salesConfig.pipelineId) {
            // Get the internal pipeline ID
            const { data: dbPipeline } = await supabase
              .from("client_pipelines")
              .select("id")
              .eq("client_id", client.id)
              .eq("ghl_pipeline_id", salesConfig.pipelineId)
              .maybeSingle();
            
            if (dbPipeline) {
              // Get stage IDs that match the GHL stage IDs in sales_stage_ids
              const { data: salesStages } = await supabase
                .from("pipeline_stages")
                .select("id")
                .eq("pipeline_id", dbPipeline.id)
                .in("ghl_stage_id", salesConfig.salesStageIds);
              
              if (salesStages && salesStages.length > 0) {
                const stageIds = salesStages.map((s: any) => s.id);
                const { data: salesOpps, count: salesOppCount } = await supabase
                  .from("pipeline_opportunities")
                  .select("monetary_value", { count: "exact" })
                  .eq("pipeline_id", dbPipeline.id)
                  .in("stage_id", stageIds)
                  .gte("last_stage_change_at", dayStart)
                  .lt("last_stage_change_at", dayNext);
                
                salesCount = salesOppCount || 0;
                salesDollars = (salesOpps || []).reduce((sum: number, o: any) => sum + Number(o.monetary_value || 0), 0);
              }
            }
          }
          const { error: upsertError } = await supabase
            .from("daily_metrics")
            .upsert(
              {
                client_id: client.id,
                date: dateStr,
                leads: totalValidLeads,
                spam_leads: spamCount || 0,
                calls: callsCount || 0,
                showed_calls: showedCount || 0,
                reconnect_calls: reconnectCount || 0,
                reconnect_showed: reconnectShowedCount || 0,
                funded_investors: fundedCount || 0,
                funded_dollars: fundedDollars,
                commitments: commitmentCount,
                commitment_dollars: commitmentDollars,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "client_id,date", ignoreDuplicates: false }
            );

          if (upsertError) {
            clientResult.errors.push(`${dateStr}: ${upsertError.message}`);
          } else {
            clientResult.daysUpdated++;
          }
        } catch (err) {
          clientResult.errors.push(`${dateStr}: ${err instanceof Error ? err.message : "Unknown"}`);
        }

        current.setUTCDate(current.getUTCDate() + 1);
      }

      console.log(`[recalculate-daily-metrics] ${client.name}: ${clientResult.daysUpdated} days updated, ${clientResult.errors.length} errors`);
      summary.push(clientResult);
    }

    const totalUpdated = summary.reduce((s, c) => s + c.daysUpdated, 0);
    const totalErrors = summary.reduce((s, c) => s + c.errors.length, 0);
    console.log(`[recalculate-daily-metrics] Complete: ${totalUpdated} days across ${clients.length} clients, ${totalErrors} errors`);
    return { success: true, summary, totalUpdated, totalErrors };
  };

  // Use background processing for large date ranges to avoid timeouts
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const dayCount = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isLargeRange = dayCount > 7 || (clients.length > 1 && dayCount > 3);

  if (isLargeRange && typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(doRecalc());
    return new Response(
      JSON.stringify({
        success: true,
        message: `Recalculation started in background for ${clients.length} client(s) over ${dayCount} days (${startDate} to ${endDate})`,
        background: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else {
    const result = await doRecalc();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
