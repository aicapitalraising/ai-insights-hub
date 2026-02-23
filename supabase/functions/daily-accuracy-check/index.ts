import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Discrepancy {
  clientId: string;
  clientName: string;
  metricType: string;
  expected: number;
  actual: number;
  diff: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check yesterday by default
  let checkDate: string;
  try {
    const body = await req.json();
    checkDate = body.checkDate || (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().split("T")[0];
    })();
  } catch {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    checkDate = d.toISOString().split("T")[0];
  }

  console.log(`[daily-accuracy-check] Checking date: ${checkDate}`);

  const dayStart = `${checkDate}T00:00:00.000Z`;
  const dayEnd = `${checkDate}T23:59:59.999Z`;

  // Get all active clients
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name")
    .in("status", ["active", "onboarding"]);

  if (clientsError || !clients) {
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch clients" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const discrepancies: Discrepancy[] = [];
  let autoFixedCount = 0;

  for (const client of clients) {
    // Get current daily_metrics row
    const { data: metricsRow } = await supabase
      .from("daily_metrics")
      .select("leads, spam_leads, calls, showed_calls, reconnect_calls, reconnect_showed, funded_investors, funded_dollars")
      .eq("client_id", client.id)
      .eq("date", checkDate)
      .maybeSingle();

    // Count from source tables
    const { count: leadsCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("is_spam", false)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    const { count: nullSpamCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .is("is_spam", null)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    const expectedLeads = (leadsCount || 0) + (nullSpamCount || 0);

    const { count: expectedCalls } = await supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .neq("is_reconnect", true)
      .gte("booked_at", dayStart)
      .lte("booked_at", dayEnd);

    const { count: expectedShowed } = await supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("showed", true)
      .neq("is_reconnect", true)
      .gte("booked_at", dayStart)
      .lte("booked_at", dayEnd);

    const { count: expectedFunded } = await supabase
      .from("funded_investors")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("funded_at", dayStart)
      .lte("funded_at", dayEnd);

    // Compare
    const actualLeads = metricsRow?.leads ?? 0;
    const actualCalls = metricsRow?.calls ?? 0;
    const actualShowed = metricsRow?.showed_calls ?? 0;
    const actualFunded = metricsRow?.funded_investors ?? 0;

    const checks = [
      { type: "leads", expected: expectedLeads, actual: actualLeads },
      { type: "calls", expected: expectedCalls || 0, actual: actualCalls },
      { type: "showed_calls", expected: expectedShowed || 0, actual: actualShowed },
      { type: "funded_investors", expected: expectedFunded || 0, actual: actualFunded },
    ];

    let clientHasDiscrepancy = false;
    for (const check of checks) {
      if (check.expected !== check.actual) {
        clientHasDiscrepancy = true;
        const disc: Discrepancy = {
          clientId: client.id,
          clientName: client.name,
          metricType: check.type,
          expected: check.expected,
          actual: check.actual,
          diff: check.expected - check.actual,
        };
        discrepancies.push(disc);

        // Log to sync_accuracy_log
        await supabase.from("sync_accuracy_log").insert({
          client_id: client.id,
          check_date: checkDate,
          metric_type: check.type,
          expected_count: check.expected,
          actual_count: check.actual,
          discrepancy: check.expected - check.actual,
          auto_fixed: true,
        });
      }
    }

    // Auto-fix by triggering recalculation for this client/date
    if (clientHasDiscrepancy) {
      console.log(`[daily-accuracy-check] Discrepancy found for ${client.name}, triggering recalculation...`);
      try {
        await fetch(`${supabaseUrl}/functions/v1/recalculate-daily-metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            clientId: client.id,
            startDate: checkDate,
            endDate: checkDate,
          }),
        });
        autoFixedCount++;
      } catch (err) {
        console.error(`[daily-accuracy-check] Failed to auto-fix ${client.name}:`, err);
      }
    }
  }

  console.log(
    `[daily-accuracy-check] Complete: ${discrepancies.length} discrepancies found, ${autoFixedCount} clients auto-fixed`
  );

  return new Response(
    JSON.stringify({
      success: true,
      checkDate,
      discrepanciesFound: discrepancies.length,
      autoFixedClients: autoFixedCount,
      discrepancies,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
