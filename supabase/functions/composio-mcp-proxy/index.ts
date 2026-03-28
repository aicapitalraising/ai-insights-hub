import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, toolkits, tool_name, tool_args } = await req.json();

    // Get Composio API key from secrets or agency_settings
    let composioKey = Deno.env.get("COMPOSIO_API_KEY");

    if (!composioKey) {
      // Fallback: read from agency_settings
      const supabase = createClient(
        Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: settings } = await supabase
        .from("agency_settings")
        .select("settings")
        .limit(1)
        .single();
      composioKey = (settings?.settings as any)?.composio_api_key;
    }

    if (!composioKey) {
      return new Response(
        JSON.stringify({ error: "COMPOSIO_API_KEY is not configured. Add it in Agency Settings → Integrations." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const COMPOSIO_BASE = "https://backend.composio.dev/api/v2";

    // Action: create_session — creates a Composio session for a user and returns MCP connection details
    if (action === "create_session") {
      const sessionUserId = userId || "agency_default";

      const res = await fetch(`${COMPOSIO_BASE}/mcp/session`, {
        method: "POST",
        headers: {
          "x-api-key": composioKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: sessionUserId,
          ...(toolkits ? { toolkits } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Composio session error:", res.status, errText);
        return new Response(
          JSON.stringify({ error: `Composio API error [${res.status}]: ${errText}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sessionData = await res.json();
      return new Response(JSON.stringify({ success: true, session: sessionData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list_tools — list available tools/toolkits
    if (action === "list_tools") {
      const res = await fetch(`${COMPOSIO_BASE}/actions?limit=100${toolkits ? `&apps=${toolkits}` : ""}`, {
        headers: { "x-api-key": composioKey },
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ error: `Composio API error [${res.status}]: ${errText}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tools = await res.json();
      return new Response(JSON.stringify({ success: true, tools }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: execute_tool — execute a specific tool
    if (action === "execute_tool") {
      if (!tool_name) {
        return new Response(
          JSON.stringify({ error: "tool_name is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(`${COMPOSIO_BASE}/actions/${tool_name}/execute`, {
        method: "POST",
        headers: {
          "x-api-key": composioKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connected_account_id: userId || "agency_default",
          input: tool_args || {},
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ error: `Tool execution error [${res.status}]: ${errText}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await res.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list_connections — list connected accounts
    if (action === "list_connections") {
      const res = await fetch(`${COMPOSIO_BASE}/connectedAccounts?showActiveOnly=true`, {
        headers: { "x-api-key": composioKey },
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ error: `Composio API error [${res.status}]: ${errText}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const connections = await res.json();
      return new Response(JSON.stringify({ success: true, connections }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: initiate_connection — start OAuth flow for an app
    if (action === "initiate_connection") {
      const { app_name, redirect_url } = tool_args || {};
      if (!app_name) {
        return new Response(
          JSON.stringify({ error: "app_name is required in tool_args" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(`${COMPOSIO_BASE}/connectedAccounts`, {
        method: "POST",
        headers: {
          "x-api-key": composioKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          integrationId: app_name,
          redirectUri: redirect_url || "https://report-bloom-magic.lovable.app",
          userUuid: userId || "agency_default",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ error: `Connection error [${res.status}]: ${errText}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const connection = await res.json();
      return new Response(JSON.stringify({ success: true, connection }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Supported: create_session, list_tools, execute_tool, list_connections, initiate_connection` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("composio-mcp-proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
