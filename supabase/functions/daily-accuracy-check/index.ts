import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Discrepancy {
  clientId: string;
  clientName: string;
  date: string;
  metricType: string;
  expected: number;
  actual: number;
  diff: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let startDate: string;
  let endDate: string;
  let mode = "daily"; // daily | weekly | monthly

  try {
    const body = await req.json();
    mode = body.mode || "daily";

    if (body.startDate && body.endDate) {
      startDate = body.startDate;
      endDate = body.endDate;
    } else if (mode === "weekly") {
      // Last 7 days
      const end = new Date();
      end.setUTCDate(end.getUTCDate() - 1);
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      startDate = start.toISOString().split("T")[0];
      endDate = end.toISOString().split("T")[0];
    } else if (mode === "monthly") {
      // Full current month up to yesterday
      const end = new Date();
      end.setUTCDate(end.getUTCDate() - 1);
      const start = new Date(end.getUTCFullYear(), end.getUTCMonth(), 1);
      startDate = start.toISOString().split("T")[0];
      endDate = end.toISOString().split("T")[0];
    } else {
      // Default: yesterday only
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 1);
      startDate = d.toISOString().split("T")[0];
      endDate = startDate;
    }
  } catch {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    startDate = d.toISOString().split("T")[0];
    endDate = startDate;
  }

  console.log(`[daily-accuracy-check] Mode: ${mode}, range: ${startDate} to ${endDate}`);

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
  let autoFixedClients = 0;
  const clientsNeedingFix: Set<string> = new Set();

  // Iterate each date in range
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (current <= end) {
    const checkDate = current.toISOString().split("T")[0];
    const dayStart = `${checkDate}T00:00:00.000Z`;
    const nextDay = new Date(current);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dayNext = `${nextDay.toISOString().split("T")[0]}T00:00:00.000Z`;

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
        .lt("created_at", dayNext);

      const { count: nullSpamCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .is("is_spam", null)
        .gte("created_at", dayStart)
        .lt("created_at", dayNext);

      const expectedLeads = (leadsCount || 0) + (nullSpamCount || 0);

      const { count: expectedCalls } = await supabase
        .from("calls")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .neq("is_reconnect", true)
        .gte("booked_at", dayStart)
        .lt("booked_at", dayNext);

      const { count: expectedShowed } = await supabase
        .from("calls")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("showed", true)
        .neq("is_reconnect", true)
        .gte("scheduled_at", dayStart)
        .lt("scheduled_at", dayNext);

      const { count: expectedFunded } = await supabase
        .from("funded_investors")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .gte("funded_at", dayStart)
        .lt("funded_at", dayNext);

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

      for (const check of checks) {
        if (check.expected !== check.actual) {
          clientsNeedingFix.add(client.id);
          discrepancies.push({
            clientId: client.id,
            clientName: client.name,
            date: checkDate,
            metricType: check.type,
            expected: check.expected,
            actual: check.actual,
            diff: check.expected - check.actual,
          });

          // Log to sync_accuracy_log
          await supabase.from("sync_accuracy_log").insert({
            client_id: client.id,
            check_date: checkDate,
            metric: check.type,
            expected_value: check.expected,
            actual_value: check.actual,
            discrepancy: check.expected - check.actual,
            status: 'discrepancy',
          });
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Auto-fix: trigger recalculation for each client that had discrepancies
  for (const cid of clientsNeedingFix) {
    try {
      console.log(`[daily-accuracy-check] Triggering recalc for client ${cid} (${startDate} to ${endDate})`);
      await fetch(`${supabaseUrl}/functions/v1/recalculate-daily-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ clientId: cid, startDate, endDate }),
      });
      autoFixedClients++;
    } catch (err) {
      console.error(`[daily-accuracy-check] Failed to auto-fix client ${cid}:`, err);
    }
  }

  console.log(
    `[daily-accuracy-check] Complete: ${discrepancies.length} discrepancies across ${clientsNeedingFix.size} clients, ${autoFixedClients} auto-fixed`
  );

  return new Response(
    JSON.stringify({
      success: true,
      mode,
      startDate,
      endDate,
      discrepanciesFound: discrepancies.length,
      clientsWithIssues: clientsNeedingFix.size,
      autoFixedClients,
      discrepancies,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
