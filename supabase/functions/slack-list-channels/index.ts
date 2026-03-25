import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
  if (!SLACK_API_KEY) {
    return new Response(JSON.stringify({ error: "SLACK_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const allChannels: any[] = [];
    let cursor: string | undefined;

    // Paginate through all channels
    do {
      const params = new URLSearchParams({
        types: "public_channel,private_channel",
        limit: "200",
        exclude_archived: "true",
      });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`${GATEWAY_URL}/conversations.list?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": SLACK_API_KEY,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(`Slack API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      allChannels.push(
        ...data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          is_private: ch.is_private,
          num_members: ch.num_members,
          topic: ch.topic?.value || "",
        }))
      );

      cursor = data.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // Sort alphabetically
    allChannels.sort((a, b) => a.name.localeCompare(b.name));

    return new Response(JSON.stringify({ channels: allChannels }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error listing Slack channels:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
