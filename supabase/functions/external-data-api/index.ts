import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PASSWORD = "HPA1234$";

const ALLOWED_TABLES = [
  "clients", "leads", "calls", "funded_investors", "daily_metrics",
  "agency_members", "agency_pods", "agency_settings", "agency_meetings",
  "tasks", "task_comments", "task_files", "task_history",
  "creatives", "client_settings", "client_pipelines", "client_custom_tabs",
  "client_funnel_steps", "client_live_ads", "client_pod_assignments",
  "client_voice_notes", "pipeline_stages", "pipeline_opportunities",
  "funnel_campaigns", "funnel_step_variants", "ad_spend_reports",
  "alert_configs", "chat_conversations", "chat_messages",
  "ai_hub_conversations", "ai_hub_messages", "custom_gpts", "gpt_files",
  "gpt_knowledge_base", "knowledge_base_documents", "csv_import_logs",
  "contact_timeline_events", "data_discrepancies", "sync_logs", "sync_queue",
  "sync_outbound_events", "pixel_verifications", "pixel_expected_events",
  "email_parsed_investors", "pending_meeting_tasks", "member_activity_log",
  "dashboard_preferences",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { password, action, table, filters, limit, offset, order_by, order_dir, data, match } = body;

    if (password !== VALID_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // list_tables
    if (action === "list_tables") {
      return new Response(JSON.stringify({ tables: ALLOWED_TABLES }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Invalid table. Allowed: ${ALLOWED_TABLES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SELECT
    if (action === "select") {
      let query = supabase.from(table).select("*", { count: "exact" });
      if (filters) Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
      if (order_by) query = query.order(order_by, { ascending: order_dir !== "desc" });
      query = query.range(offset || 0, (offset || 0) + (limit || 1000) - 1);
      const { data: rows, count, error } = await query;
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ data: rows, count, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // COUNT
    if (action === "count") {
      let query = supabase.from(table).select("*", { count: "exact", head: true });
      if (filters) Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
      const { count, error } = await query;
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ count, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // INSERT
    if (action === "insert") {
      if (!data) return new Response(JSON.stringify({ error: "Missing 'data' field" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: rows, error } = await supabase.from(table).insert(data).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ data: rows, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // UPDATE
    if (action === "update") {
      if (!data || !match) return new Response(JSON.stringify({ error: "Missing 'data' and/or 'match' fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      let query = supabase.from(table).update(data);
      Object.entries(match).forEach(([k, v]) => { query = query.eq(k, v); });
      const { data: rows, error } = await query.select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ data: rows, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE
    if (action === "delete") {
      if (!match) return new Response(JSON.stringify({ error: "Missing 'match' field" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      let query = supabase.from(table).delete();
      Object.entries(match).forEach(([k, v]) => { query = query.eq(k, v); });
      const { data: rows, error } = await query.select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ data: rows, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: list_tables, select, count, insert, update, delete" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
