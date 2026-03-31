import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const EdgeRuntime: { waitUntil: (promise: Promise<any>) => void } | undefined;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Production DB for data queries
  const dbUrl = Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
  const dbKey = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(dbUrl, dbKey);
  // Lovable Cloud URL for calling other edge functions
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Parse optional sinceDateDays from request body
  let sinceDateDays: number | undefined;
  try {
    const body = await req.json();
    if (body?.sinceDateDays) {
      sinceDateDays = Math.min(Math.max(parseInt(body.sinceDateDays) || 7, 1), 365);
    }
  } catch {}

  console.log(`[sync-ghl-all-clients] Starting GHL sync${sinceDateDays ? ` (${sinceDateDays} days back)` : ''}`);

  // Get all clients with valid GHL credentials (sync every credentialed client)
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, ghl_api_key, ghl_location_id, hubspot_portal_id")
    .not("ghl_api_key", "is", null)
    .not("ghl_location_id", "is", null);

  if (error || !clients) {
    console.error("Failed to fetch clients:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch clients" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Use ALL clients with GHL credentials - do NOT exclude clients that also have HubSpot
  const ghlClients = clients;
  console.log(`[sync-ghl-all-clients] Found ${ghlClients.length} GHL clients to sync`);

  // Helper: fetch with 1 retry and exponential backoff
  async function fetchWithRetry(url: string, options: RequestInit, label: string): Promise<any> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, options);
        return await res.json();
      } catch (err) {
        if (attempt === 0) {
          console.warn(`[sync-ghl-all-clients] ${label} failed, retrying in 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
          throw err;
        }
      }
    }
  }

  const doSync = async () => {
    const results: Array<{ clientId: string; name: string; contacts: boolean; calendar: boolean; pipelines: boolean; errors: string[] }> = [];

    for (let i = 0; i < ghlClients.length; i++) {
      const client = ghlClients[i];
      const clientResult = { clientId: client.id, name: client.name, contacts: false, calendar: false, pipelines: false, errors: [] as string[] };
      console.log(`[sync-ghl-all-clients] (${i + 1}/${ghlClients.length}) Syncing ${client.name}...`);

      // 1. Sync contacts (leads) - pass sinceDateDays if provided
      try {
        const contactsBody: Record<string, unknown> = { client_id: client.id, syncType: "contacts" };
        if (sinceDateDays) contactsBody.sinceDateDays = sinceDateDays;
        
        const data = await fetchWithRetry(`${supabaseUrl}/functions/v1/sync-ghl-contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify(contactsBody),
        }, `${client.name} contacts`);
        clientResult.contacts = !data.error;
        if (data.error) clientResult.errors.push(`contacts: ${data.error}`);
        else console.log(`[sync-ghl-all-clients] ✓ ${client.name} contacts synced`);
      } catch (err) {
        clientResult.errors.push(`contacts: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      // 2. Sync calendar appointments
      try {
        const calendarBody: Record<string, unknown> = { clientId: client.id };
        if (sinceDateDays) calendarBody.sinceDateDays = sinceDateDays;
        
        const data = await fetchWithRetry(`${supabaseUrl}/functions/v1/sync-calendar-appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify(calendarBody),
        }, `${client.name} calendar`);
        clientResult.calendar = !data.error;
        if (data.error) clientResult.errors.push(`calendar: ${data.error}`);
        else console.log(`[sync-ghl-all-clients] ✓ ${client.name} calendar synced`);
      } catch (err) {
        clientResult.errors.push(`calendar: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      // 3. Sync pipelines (committed + funded from pipeline stages)
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/sync-ghl-pipelines`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ client_id: client.id }),
        });
        const data = await res.json();
        clientResult.pipelines = !data.error;
        if (data.error) clientResult.errors.push(`pipelines: ${data.error}`);
        else console.log(`[sync-ghl-all-clients] ✓ ${client.name} pipelines synced`);
      } catch (err) {
        clientResult.errors.push(`pipelines: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      results.push(clientResult);

      // 15-second delay between clients
      if (i < ghlClients.length - 1) {
        console.log(`[sync-ghl-all-clients] Waiting 15s before next client...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }

    const successCount = results.filter(r => r.errors.length === 0).length;
    console.log(`[sync-ghl-all-clients] Complete: ${successCount}/${results.length} clients fully synced`);

    // NOTE: Metrics recalculation is handled by daily-master-sync or full-historical-sync orchestrators
    console.log(`[sync-ghl-all-clients] Sync complete. Metrics recalculation deferred to orchestrator.`);

    return results;
  };

  if (typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(doSync());
    return new Response(JSON.stringify({
      success: true,
      message: `GHL sync started for ${ghlClients.length} clients (background)${sinceDateDays ? `, ${sinceDateDays} days back` : ''}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } else {
    const results = await doSync();
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
