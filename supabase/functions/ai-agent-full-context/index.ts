import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Context-Tokens, X-System-Tokens",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemContext, model = "gemini-2.5-pro" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert agency performance analyst with COMPLETE access to all client data across the portfolio.

Today's Date: ${new Date().toISOString().split("T")[0]}

${systemContext || "No context provided."}

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

IMPORTANT RULES FOR TASK CREATION:
- Always use the exact client UUID from the data above
- If the user says "for all clients" or "for every client", create one task per active client
- Set priority based on urgency keywords: "urgent/asap" → urgent, "important" → high, default → medium
- Set due_date if the user mentions a deadline, otherwise null
- Always explain what tasks you created after the JSON block

---
Provide specific, data-driven insights. Reference exact numbers. Compare clients when relevant. Flag concerning trends proactively.`;

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
    };

    const resolvedModel = GATEWAY_MODEL_MAP[model] || "google/gemini-2.5-pro";

    console.log(`[ai-agent] model: ${resolvedModel}, system chars: ${systemPrompt.length}, tokens: ~${systemTokens}`);

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
