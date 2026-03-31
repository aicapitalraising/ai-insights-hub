import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-slack-signature, x-slack-request-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const SLACK_GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

interface Env {
  LOVABLE_API_KEY: string;
  SLACK_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CLOUD_URL: string;
  CLOUD_KEY: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SLACK_SIGNING_SECRET = Deno.env.get("SLACK_SIGNING_SECRET");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
  // Production DB for tasks, clients, etc.
  const SUPABASE_URL = Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Cloud DB for slack_channel_mappings, slack_activity_log
  const CLOUD_URL = Deno.env.get("SUPABASE_URL")!;
  const CLOUD_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!SLACK_SIGNING_SECRET) throw new Error("SLACK_SIGNING_SECRET not configured");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  if (!SLACK_API_KEY) throw new Error("SLACK_API_KEY not configured");

  const env: Env = { LOVABLE_API_KEY, SLACK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLOUD_URL, CLOUD_KEY };

  const rawBody = await req.text();

  // --- Verify Slack signature ---
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";
  const slackSig = req.headers.get("x-slack-signature") || "";

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return new Response("Request too old", { status: 403 });
  }

  const sigBase = `v0:${timestamp}:${rawBody}`;
  const hmac = createHmac("sha256", SLACK_SIGNING_SECRET);
  hmac.update(sigBase);
  const expectedSig = `v0=${hmac.digest("hex")}`;

  if (expectedSig !== slackSig) {
    console.error("Slack signature mismatch");
    return new Response("Invalid signature", { status: 403 });
  }

  const body = JSON.parse(rawBody);

  // --- Handle URL verification challenge ---
  if (body.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: body.challenge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Handle events ---
  if (body.type === "event_callback") {
    const event = body.event;

    // Ignore bot messages to prevent loops
    if (event.bot_id || event.subtype === "bot_message") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Process asynchronously — return 200 immediately
    const processingPromise = routeEvent(event, env);
    processingPromise.catch((err) => console.error("Error processing event:", err));

    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  return new Response("ok", { status: 200, headers: corsHeaders });
});

// -------------------------------------------------------------------
// Event Router: dispatches based on event type
// -------------------------------------------------------------------
async function routeEvent(event: any, env: Env) {
  // Production DB for tasks, clients, client_settings, agency_members, task_comments
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  // Cloud DB for slack_channel_mappings, slack_activity_log
  const cloudDb = createClient(env.CLOUD_URL, env.CLOUD_KEY);
  const channelId = event.channel;

  // Try to join the channel (needed for Slack Connect channels the bot was @mentioned in but isn't formally a member of)
  try {
    await fetch(`${SLACK_GATEWAY_URL}/conversations.join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": env.SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: channelId }),
    });
  } catch { /* ignore — private/connect channels may reject join */ }

  // Look up channel mapping (Cloud DB)
  const { data: mapping } = await cloudDb
    .from("slack_channel_mappings")
    .select("*")
    .eq("channel_id", channelId)
    .maybeSingle();

  // Also check legacy client_settings mapping (Production DB)
  const { data: legacySettings } = await supabase
    .from("client_settings")
    .select("client_id")
    .or(`slack_channel_id.eq.${channelId},slack_review_channel_id.eq.${channelId}`)
    .limit(1);

  const clientId = mapping?.client_id || legacySettings?.[0]?.client_id || null;

  if (event.type === "app_mention") {
    await handleMention(event, env, supabase, cloudDb, clientId, mapping);
  } else if (event.type === "message" && !event.subtype) {
    // Regular message — log and optionally analyze
    await handleMessage(event, env, supabase, cloudDb, clientId, mapping);
  }
}

// -------------------------------------------------------------------
// Handle regular messages: log activity + AI analysis
// -------------------------------------------------------------------
async function handleMessage(event: any, env: Env, supabase: any, clientId: string | null, mapping: any) {
  const channelId = event.channel;
  const messageTs = event.ts;
  const threadTs = event.thread_ts || null;
  const userId = event.user;
  const text = event.text || "";

  // Skip very short or empty messages
  if (text.trim().length < 3) return;

  // Get user info
  const slackUser = await getSlackUserInfo(env.LOVABLE_API_KEY, env.SLACK_API_KEY, userId);
  const userName = slackUser?.real_name || slackUser?.name || "Unknown";

  // Log the message as activity
  const { error: logError } = await supabase.from("slack_activity_log").upsert({
    client_id: clientId,
    channel_id: channelId,
    message_ts: messageTs,
    thread_ts: threadTs,
    user_id: userId,
    user_name: userName,
    message_text: text,
    message_type: event.files ? "file_share" : "message",
  }, { onConflict: "channel_id,message_ts" });

  if (logError) {
    console.error("Failed to log slack activity:", logError);
  }

  // If monitoring is disabled for this channel, stop here
  if (mapping && !mapping.monitor_messages) return;

  // If auto_create_tasks is enabled, run AI analysis
  if (mapping?.auto_create_tasks && clientId) {
    await analyzeMessageForTasks(event, env, supabase, clientId, text, userName, channelId, messageTs, threadTs);
  }
}

// -------------------------------------------------------------------
// AI Message Analysis: detect actionable items
// -------------------------------------------------------------------
async function analyzeMessageForTasks(
  event: any, env: Env, supabase: any, clientId: string,
  text: string, userName: string, channelId: string, messageTs: string, threadTs: string | null
) {
  try {
    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You analyze Slack messages for a marketing agency. Determine if this message contains an actionable task, request, or action item.

Rules:
- Only flag messages that are clear requests, tasks, or action items
- Casual conversation, greetings, status updates, questions should be "none"
- Look for: "can you", "please", "need to", "let's", "TODO", deadlines, deliverable requests
- If it references an existing task (mentions task title or ID), classify as "update_task"
- If it's a new actionable request, classify as "create_task"`,
          },
          { role: "user", content: text },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_message",
            description: "Analyze the message for actionable content",
            parameters: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["none", "create_task", "update_task"] },
                confidence: { type: "number", description: "0-1 confidence score" },
                task_title: { type: "string", description: "Suggested task title if action is create_task" },
                task_priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                update_note: { type: "string", description: "Comment to add if action is update_task" },
              },
              required: ["action", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_message" } },
      }),
    });

    if (!response.ok) {
      console.error("AI analysis failed:", await response.text());
      return;
    }

    const data = await response.json();
    let analysis = { action: "none", confidence: 0, task_title: "", task_priority: "medium", update_note: "" };

    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        analysis = JSON.parse(toolCall.function.arguments);
      }
    } catch { /* use defaults */ }

    // Update the activity log with AI analysis
    await supabase.from("slack_activity_log")
      .update({ ai_analysis: analysis })
      .eq("channel_id", channelId)
      .eq("message_ts", messageTs);

    // Only act on high-confidence detections
    if (analysis.confidence < 0.7) return;

    if (analysis.action === "create_task" && analysis.task_title) {
      const links = extractLinks(text);
      const images = extractImages(event);

      let description = text;
      if (links.length > 0) description += `\n\n🔗 Links:\n${links.map(l => `- ${l}`).join("\n")}`;
      if (images.length > 0) description += `\n\n🖼️ Attached images:\n${images.map(img => `- ${img}`).join("\n")}`;

      const { data: newTask, error } = await supabase.from("tasks").insert({
        title: analysis.task_title,
        description,
        client_id: clientId,
        priority: analysis.task_priority || "medium",
        stage: "client_tasks",
        status: "todo",
        visible_to_client: true,
        created_by: `Slack Auto (${userName})`,
      }).select().single();

      if (!error && newTask) {
        // Update activity log with linked task
        await supabase.from("slack_activity_log")
          .update({ linked_task_id: newTask.id, message_type: "task_action" })
          .eq("channel_id", channelId)
          .eq("message_ts", messageTs);

        // React to the message to indicate task was created
        await reactToMessage(env, channelId, messageTs, "white_check_mark");

        // Reply in thread
        const replyTs = threadTs || messageTs;
        await postSlackMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channelId, replyTs,
          `📋 *Task auto-created:* ${newTask.title}\n🎯 Priority: ${analysis.task_priority}\n👤 From: ${userName}`
        );
      }
    } else if (analysis.action === "update_task" && analysis.update_note) {
      // Try to find the most recent relevant open task for this client
      const { data: recentTasks } = await supabase.from("tasks")
        .select("id, title")
        .eq("client_id", clientId)
        .in("status", ["todo", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(5);

      if (recentTasks && recentTasks.length > 0) {
        // Use AI to match the message to a specific task
        const matchResponse = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Given a Slack message and a list of open tasks, determine which task (if any) the message is about.
Tasks: ${recentTasks.map((t: any) => `"${t.title}" (${t.id})`).join(", ")}`,
              },
              { role: "user", content: text },
            ],
            tools: [{
              type: "function",
              function: {
                name: "match_task",
                parameters: {
                  type: "object",
                  properties: {
                    task_id: { type: "string", description: "UUID of matched task, or 'none'" },
                  },
                  required: ["task_id"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "match_task" } },
          }),
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          try {
            const tc = matchData.choices?.[0]?.message?.tool_calls?.[0];
            if (tc) {
              const parsed = JSON.parse(tc.function.arguments);
              if (parsed.task_id && parsed.task_id !== "none") {
                await supabase.from("task_comments").insert({
                  task_id: parsed.task_id,
                  author_name: `${userName} (via Slack)`,
                  content: analysis.update_note || text,
                  comment_type: "text",
                });

                await supabase.from("slack_activity_log")
                  .update({ linked_task_id: parsed.task_id, message_type: "task_action" })
                  .eq("channel_id", channelId)
                  .eq("message_ts", messageTs);

                await reactToMessage(env, channelId, messageTs, "memo");
              }
            }
          } catch { /* ignore */ }
        }
      }
    }
  } catch (err) {
    console.error("analyzeMessageForTasks error:", err);
  }
}

// -------------------------------------------------------------------
// Core handler for @HPA mentions
// -------------------------------------------------------------------
async function handleMention(event: any, env: Env, supabase: any, clientId: string | null, mapping: any) {
  const channelId = event.channel;
  const threadTs = event.thread_ts || event.ts;
  const userText = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();
  const slackUserId = event.user;

  // Log the mention as activity
  const slackUser = await getSlackUserInfo(env.LOVABLE_API_KEY, env.SLACK_API_KEY, slackUserId);
  const userEmail = slackUser?.profile?.email || null;
  const userName = slackUser?.real_name || slackUser?.name || "User";

  await supabase.from("slack_activity_log").upsert({
    client_id: clientId,
    channel_id: channelId,
    message_ts: event.ts,
    thread_ts: event.thread_ts || null,
    user_id: slackUserId,
    user_name: userName,
    message_text: userText,
    message_type: "mention",
  }, { onConflict: "channel_id,message_ts" });

  // Post a thinking indicator
  const thinkingMsg = await postSlackMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channelId, threadTs, "🤔 Thinking...");

  // Check if this is an agency member
  let agencyMember: any = null;
  if (userEmail) {
    const { data: member } = await supabase
      .from("agency_members")
      .select("id, name, role")
      .eq("email", userEmail)
      .maybeSingle();
    agencyMember = member;
  }

  const isAgencyUser = !!agencyMember;

  // Determine intent
  const intent = await detectIntent(userText, env.LOVABLE_API_KEY);

  switch (intent.action) {
    case "create_task":
      await handleCreateTask(supabase, env, channelId, threadTs, clientId, userText, event, userName, thinkingMsg?.ts);
      break;
    case "list_tasks":
      await handleListTasks(supabase, env, channelId, threadTs, clientId, userName, isAgencyUser, thinkingMsg?.ts);
      break;
    case "summarize":
      await handleSummarize(supabase, env, channelId, threadTs, clientId, userText, userName, isAgencyUser, thinkingMsg?.ts);
      break;
    default:
      await handleAIQuery(supabase, env, channelId, threadTs, clientId, userText, userName, isAgencyUser, agencyMember, thinkingMsg?.ts);
      break;
  }
}

// -------------------------------------------------------------------
// Intent detection (expanded with summarize)
// -------------------------------------------------------------------
async function detectIntent(text: string, apiKey: string): Promise<{ action: string }> {
  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `You are an intent classifier. Given a user message, determine the intent.
Return ONLY one of: create_task, list_tasks, summarize, analytics_query
- create_task: user wants to create a task, request, or action item
- list_tasks: user wants to see their tasks, open items, or to-do list
- summarize: user wants a summary, digest, recap, overview of recent activity or channel messages
- analytics_query: user wants to know about metrics, KPIs, ad spend, leads, calls, performance, comparisons, or any general question`,
        },
        { role: "user", content: text },
      ],
      tools: [{
        type: "function",
        function: {
          name: "classify_intent",
          description: "Classify the user's intent",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["create_task", "list_tasks", "summarize", "analytics_query"],
              },
            },
            required: ["action"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "classify_intent" } },
    }),
  });

  if (!response.ok) {
    console.error("Intent detection failed:", await response.text());
    return { action: "analytics_query" };
  }

  const data = await response.json();
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) return JSON.parse(toolCall.function.arguments);
  } catch { /* fallback */ }
  return { action: "analytics_query" };
}

// -------------------------------------------------------------------
// SUMMARIZE: AI-powered digest of recent activity
// -------------------------------------------------------------------
async function handleSummarize(
  supabase: any, env: Env, channel: string, thread: string,
  clientId: string | null, userText: string, userName: string,
  isAgencyUser: boolean, thinkingTs?: string
) {
  try {
    // Get recent activity from the log
    let activityQuery = supabase
      .from("slack_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (clientId) {
      activityQuery = activityQuery.eq("client_id", clientId);
    } else {
      activityQuery = activityQuery.eq("channel_id", channel);
    }

    const { data: recentActivity } = await activityQuery;

    // Get open tasks
    let taskQuery = supabase
      .from("tasks")
      .select("id, title, status, priority, stage, due_date, assigned_to, created_at, updated_at")
      .in("status", ["todo", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (clientId) taskQuery = taskQuery.eq("client_id", clientId);

    const { data: openTasks } = await taskQuery;

    // Build activity summary
    const activitySummary = (recentActivity || [])
      .map((a: any) => `[${a.created_at?.split("T")[0]}] ${a.user_name}: ${a.message_text?.slice(0, 200)}`)
      .join("\n");

    const tasksSummary = (openTasks || [])
      .map((t: any) => `- "${t.title}" [${t.priority}] (${t.stage}) ${t.due_date ? `due ${t.due_date}` : ""}`)
      .join("\n");

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    const aiEndpoint = XAI_API_KEY ? "https://api.x.ai/v1/chat/completions" : AI_GATEWAY;
    const aiKey = XAI_API_KEY || env.LOVABLE_API_KEY;
    const aiModel = XAI_API_KEY ? "grok-4-fast" : "google/gemini-3-flash-preview";

    const aiResponse = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are HPA, an agency assistant creating a concise summary/digest. Use Slack markdown (*bold*, _italic_).
Format the summary as:
1. 📊 *Key Activity Highlights* — most important things that happened
2. 📋 *Task Status* — open tasks, overdue items, recently completed
3. ⚡ *Action Items* — things that need attention
4. 💡 *Insights* — patterns or trends noticed

Keep it under 2000 characters. Be specific with names and details.`,
          },
          {
            role: "user",
            content: `Summarize recent activity. User asked: "${userText}"

Recent Slack Messages (${(recentActivity || []).length}):
${activitySummary || "No recent messages logged"}

Open Tasks (${(openTasks || []).length}):
${tasksSummary || "No open tasks"}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI summarize error:", aiResponse.status, errText);
      await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
        "❌ Couldn't generate summary right now. Please try again.");
      return;
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "Couldn't generate a summary.";

    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs, summary);
  } catch (err) {
    console.error("handleSummarize error:", err);
    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
      "❌ An error occurred generating the summary. Please try again.");
  }
}

// -------------------------------------------------------------------
// BUILD FULL CONTEXT
// -------------------------------------------------------------------
// RULE: If scopedClientId is set (channel is mapped to a specific client),
// ALWAYS scope to that client's data only — even for agency team members.
// Only show all-client data when the channel is NOT mapped to any client.
async function buildFullContext(supabase: any, scopedClientId: string | null, _isAgencyUser: boolean): Promise<string> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const clientQuery = supabase.from("clients").select("id, name, status, industry, slug");
  // CRITICAL: Always scope to the mapped client when in a client channel
  if (scopedClientId) {
    clientQuery.eq("id", scopedClientId);
  }

  // CRITICAL: When scoped to a client channel, filter ALL queries at the DB level
  // to prevent data leakage across clients
  const metricsQuery = supabase.from("daily_metrics").select("client_id, date, ad_spend, leads, calls, showed_calls, funded_investors, funded_dollars, spam_leads, commitment_dollars, commitments, reconnect_calls, reconnect_showed, clicks, impressions").gte("date", thirtyDaysAgoStr);
  const leadsQuery = supabase.from("leads").select("id, client_id, source, status, is_spam, created_at, name, utm_source, utm_campaign").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: false }).limit(500);
  const callsQuery = supabase.from("calls").select("id, client_id, showed, outcome, scheduled_at, contact_name, is_reconnect, appointment_status").gte("created_at", thirtyDaysAgo.toISOString()).limit(500);
  const fundedQuery = supabase.from("funded_investors").select("id, client_id, name, funded_amount, funded_at, commitment_amount, time_to_fund_days, calls_to_fund").order("funded_at", { ascending: false }).limit(300);
  const tasksQuery = supabase.from("tasks").select("id, client_id, title, status, priority, due_date, stage").in("status", ["todo", "in_progress"]);
  const meetingsQuery = supabase.from("agency_meetings").select("id, client_id, title, meeting_date, summary, action_items").gte("meeting_date", thirtyDaysAgo.toISOString()).order("meeting_date", { ascending: false }).limit(50);
  const briefsQuery = supabase.from("creative_briefs").select("id, client_id, client_name, status, hook_patterns, offer_angles, created_at").order("created_at", { ascending: false }).limit(20);

  if (scopedClientId) {
    metricsQuery.eq("client_id", scopedClientId);
    leadsQuery.eq("client_id", scopedClientId);
    callsQuery.eq("client_id", scopedClientId);
    fundedQuery.eq("client_id", scopedClientId);
    tasksQuery.eq("client_id", scopedClientId);
    meetingsQuery.eq("client_id", scopedClientId);
    briefsQuery.eq("client_id", scopedClientId);
  }

  const [
    { data: clients },
    { data: dailyMetrics },
    { data: leads },
    { data: calls },
    { data: fundedInvestors },
    { data: tasks },
    { data: meetings },
    { data: briefs },
  ] = await Promise.all([
    clientQuery,
    metricsQuery,
    leadsQuery,
    callsQuery,
    fundedQuery,
    tasksQuery,
    meetingsQuery,
    briefsQuery,
  ]);

  const clientList = clients || [];
  const clientDataBlocks: string[] = [];

  for (const client of clientList) {
    const cId = client.id;
    const cMetrics = (dailyMetrics || []).filter((m: any) => m.client_id === cId);
    const cLeads = (leads || []).filter((l: any) => l.client_id === cId);
    const cCalls = (calls || []).filter((c: any) => c.client_id === cId);
    const cFunded = (fundedInvestors || []).filter((f: any) => f.client_id === cId);
    const cTasks = (tasks || []).filter((t: any) => t.client_id === cId);
    const cMeetings = (meetings || []).filter((m: any) => m.client_id === cId);

    const totalAdSpend = cMetrics.reduce((s: number, m: any) => s + (m.ad_spend || 0), 0);
    const totalLeads = cMetrics.reduce((s: number, m: any) => s + (m.leads || 0), 0);
    const totalCalls = cMetrics.reduce((s: number, m: any) => s + (m.calls || 0), 0);
    const totalShowed = cMetrics.reduce((s: number, m: any) => s + (m.showed_calls || 0), 0);
    const totalFundedCount = cMetrics.reduce((s: number, m: any) => s + (m.funded_investors || 0), 0);
    const totalFundedDollars = cMetrics.reduce((s: number, m: any) => s + (m.funded_dollars || 0), 0);
    const cpl = totalLeads > 0 ? totalAdSpend / totalLeads : 0;
    const cpc = totalCalls > 0 ? totalAdSpend / totalCalls : 0;
    const costOfCapital = totalFundedDollars > 0 ? (totalAdSpend / totalFundedDollars) * 100 : 0;

    const openTasks = cTasks.filter((t: any) => t.status !== "done");
    const overdueTasks = openTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());

    let block = `\n## ${client.name} (${client.status})${client.industry ? ` | ${client.industry}` : ""}
*30-Day Metrics:*
- Ad Spend: $${totalAdSpend.toLocaleString()} | Leads: ${totalLeads} | CPL: $${cpl.toFixed(2)}
- Calls: ${totalCalls} | Shows: ${totalShowed} | CPC: $${cpc.toFixed(2)}
- Funded: ${totalFundedCount} investors, $${totalFundedDollars.toLocaleString()} | CoC: ${costOfCapital.toFixed(2)}%`;

    if (cFunded.length > 0) {
      const recentFunded = cFunded.slice(0, 5);
      block += `\n*Recent Funded:* ${recentFunded.map((f: any) => `${f.name || "Unknown"} ($${(f.funded_amount || 0).toLocaleString()})`).join("; ")}`;
    }

    if (openTasks.length > 0) {
      block += `\n*Open Tasks:* ${openTasks.length} (${overdueTasks.length} overdue)`;
    }

    if (cMeetings.length > 0) {
      block += `\n*Recent Meetings:* ${cMeetings.slice(0, 3).map((m: any) => `${m.title} (${m.meeting_date?.split("T")[0] || "?"})`).join(", ")}`;
    }

    clientDataBlocks.push(block);
  }

  const scopeNote = scopedClientId
    ? `⚠️ SCOPED TO CLIENT CHANNEL — Only ${clientList[0]?.name || "this client"}'s data is available.`
    : `Agency-wide view — all client data available.`;

  return `Today: ${new Date().toISOString().split("T")[0]}
${scopeNote}
Total Clients: ${clientList.length} (${clientList.filter((c: any) => c.status === "active").length} active)

# ${scopedClientId ? "Client" : "Full Portfolio"} Data (Last 30 Days)
${clientDataBlocks.join("\n")}`;
}

// -------------------------------------------------------------------
// AI QUERY
// -------------------------------------------------------------------
async function handleAIQuery(
  supabase: any, env: Env, channel: string, thread: string,
  scopedClientId: string | null, userText: string, userName: string,
  isAgencyUser: boolean, agencyMember: any, thinkingTs?: string
) {
  try {
    const context = await buildFullContext(supabase, scopedClientId, isAgencyUser);

    const scopeLabel = scopedClientId ? "this client's" : "all clients'";
    const roleDesc = isAgencyUser
      ? `You are HPA, an expert agency performance analyst and task manager for ${agencyMember?.name || userName}. You have COMPLETE access to ${scopeLabel} data.`
      : `You are HPA, a performance assistant. You have access to ${scopeLabel} data.`;

    const scopeRule = scopedClientId
      ? `CRITICAL SCOPE RULE: This is a CLIENT-SPECIFIC channel. You MUST ONLY discuss this client's data, tasks, and metrics. Do NOT reference, compare, or mention any other client. If the user asks about other clients, politely redirect them to the agency channel.`
      : `This is an AGENCY channel. You may reference and compare all clients' data.`;

    const systemPrompt = `${roleDesc}

${context}

---
RULES:
- ${scopeRule}
- Use Slack markdown: *bold*, _italic_, \`code\`
- Be concise but thorough. Reference exact numbers.
${!scopedClientId ? "- Compare clients when relevant." : "- Do NOT compare with or mention other clients."}
- Flag concerning trends proactively.
- If asked about creating tasks, tell them to say "@HPA create task: [description]"
- If asked about summarizing, tell them to say "@HPA summarize"
- Keep responses under 3000 characters for Slack readability`;

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    const aiEndpoint = XAI_API_KEY ? "https://api.x.ai/v1/chat/completions" : AI_GATEWAY;
    const aiKey = XAI_API_KEY || env.LOVABLE_API_KEY;
    const aiModel = XAI_API_KEY ? "grok-4-fast" : "google/gemini-3-flash-preview";

    const aiResponse = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
        "❌ Sorry, I couldn't process your question right now. Please try again.");
      return;
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "I couldn't generate an answer.";

    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs, answer);
  } catch (err) {
    console.error("handleAIQuery error:", err);
    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
      "❌ An error occurred while processing your request. Please try again.");
  }
}

// -------------------------------------------------------------------
// CREATE TASK
// -------------------------------------------------------------------
async function handleCreateTask(
  supabase: any, env: Env, channel: string, thread: string,
  scopedClientId: string | null, userText: string, event: any, userName: string, thinkingTs?: string
) {
  let clientId = scopedClientId;
  let clientName = "Unknown";

  let clientSlug: string | null = null;
  if (clientId) {
    const { data: client } = await supabase.from("clients").select("name, slug, public_token").eq("id", clientId).single();
    clientName = client?.name || "Unknown";
    clientSlug = client?.slug || client?.public_token || null;
  } else {
    const { data: allClients } = await supabase.from("clients").select("id, name").eq("status", "active");

    if (allClients && allClients.length > 0) {
      const clientNames = allClients.map((c: any) => `${c.name} (${c.id})`).join(", ");
      const detectResponse = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: `Given the user message and list of clients, determine which client this task is for. Clients: ${clientNames}` },
            { role: "user", content: userText },
          ],
          tools: [{ type: "function", function: { name: "identify_client", parameters: { type: "object", properties: { client_id: { type: "string" }, client_name: { type: "string" } }, required: ["client_id", "client_name"], additionalProperties: false } } }],
          tool_choice: { type: "function", function: { name: "identify_client" } },
        }),
      });

      if (detectResponse.ok) {
        const detectData = await detectResponse.json();
        try {
          const tc = detectData.choices?.[0]?.message?.tool_calls?.[0];
          if (tc) {
            const parsed = JSON.parse(tc.function.arguments);
            if (parsed.client_id && parsed.client_id !== "unknown") {
              clientId = parsed.client_id;
              clientName = parsed.client_name || "Unknown";
              // Fetch slug for public link
              const { data: detectedClient } = await supabase.from("clients").select("slug, public_token").eq("id", clientId).single();
              clientSlug = detectedClient?.slug || detectedClient?.public_token || null;
            }
          }
        } catch { /* fallback */ }
      }
    }

    if (!clientId) {
      await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
        "⚠️ I couldn't determine which client this task is for. Please mention the client name or use a client-specific channel.");
      return;
    }
  }

  const links = extractLinks(userText);
  const images = extractImages(event);

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are a task creation assistant for ${clientName}. Generate a structured task from the message. Create a clear, actionable title (max 80 chars), detailed description, and set priority.` },
        { role: "user", content: `Create a task from: "${userText}"${links.length > 0 ? `\nLinks: ${links.join(", ")}` : ""}${images.length > 0 ? `\nImages: ${images.length} file(s)` : ""}` },
      ],
      tools: [{ type: "function", function: { name: "create_task", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] } }, required: ["title", "description", "priority"], additionalProperties: false } } }],
      tool_choice: { type: "function", function: { name: "create_task" } },
    }),
  });

  if (!response.ok) {
    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs, "❌ Couldn't generate the task. Please try again.");
    return;
  }

  const data = await response.json();
  let taskData = { title: userText.slice(0, 80), description: userText, priority: "medium" };
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) taskData = JSON.parse(toolCall.function.arguments);
  } catch { /* use defaults */ }

  let fullDescription = taskData.description;
  if (links.length > 0) fullDescription += `\n\n🔗 Links:\n${links.map(l => `- ${l}`).join("\n")}`;
  if (images.length > 0) fullDescription += `\n\n🖼️ Attached images:\n${images.map(img => `- ${img}`).join("\n")}`;

  const { data: newTask, error: taskErr } = await supabase.from("tasks").insert({
    title: taskData.title,
    description: fullDescription,
    client_id: clientId,
    priority: taskData.priority,
    stage: "client_tasks",
    status: "todo",
    visible_to_client: true,
    created_by: `Slack (${userName})`,
  }).select().single();

  if (taskErr) {
    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs, "❌ Failed to create the task.");
    return;
  }

  await supabase.from("task_comments").insert({
    task_id: newTask.id,
    author_name: `${userName} (via Slack)`,
    content: userText,
    comment_type: "text",
  });

  const appUrl = Deno.env.get("APP_URL") || "https://reporting.highperformanceads.com";
  const taskLink = clientSlug
    ? `${appUrl}/public/${clientSlug}?task=${newTask.id}`
    : `${appUrl}/client/${clientId}?task=${newTask.id}`;

  await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
    `✅ *Task Created for ${clientName}!*\n\n📋 *Title:* ${newTask.title}\n📝 *Description:* ${taskData.description}\n🎯 *Priority:* ${taskData.priority}\n👤 *Created by:* ${userName}\n🔗 <${taskLink}|View Task in Dashboard>`
  );
}

// -------------------------------------------------------------------
// LIST TASKS
// -------------------------------------------------------------------
async function handleListTasks(
  supabase: any, env: Env, channel: string, thread: string,
  scopedClientId: string | null, userName: string, isAgencyUser: boolean, thinkingTs?: string
) {
  let query = supabase.from("tasks")
    .select("id, title, stage, priority, due_date, client_id, assigned_to")
    .neq("stage", "done")
    .is("parent_task_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (scopedClientId) query = query.eq("client_id", scopedClientId);

  const { data: tasks } = await query;

  if (!tasks || tasks.length === 0) {
    await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
      `📋 No open tasks right now. Type \`@HPA create task: [your request]\` to create one!`);
    return;
  }

  let clientNames: Record<string, string> = {};
  let clientSlugs: Record<string, string> = {};
  const clientIds = [...new Set(tasks.map((t: any) => t.client_id).filter(Boolean))];
  if (clientIds.length > 0) {
    const { data: clients } = await supabase.from("clients").select("id, name, slug, public_token").in("id", clientIds);
    for (const c of clients || []) {
      clientNames[c.id] = c.name;
      if (c.slug || c.public_token) clientSlugs[c.id] = c.slug || c.public_token;
    }
  }

  const appUrl = Deno.env.get("APP_URL") || "https://reporting.highperformanceads.com";
  const stageEmoji: Record<string, string> = {
    client_tasks: "📥", todo: "📝", in_progress: "🔧", stuck: "🚨", review: "👀", revisions: "🔄",
  };

  const lines = tasks.map((t: any) => {
    const emoji = stageEmoji[t.stage] || "📌";
    const due = t.due_date ? ` · Due: ${t.due_date}` : "";
    const clientLabel = !scopedClientId && clientNames[t.client_id] ? ` · ${clientNames[t.client_id]}` : "";
    const slug = clientSlugs[t.client_id];
    const taskLink = slug
      ? `${appUrl}/public/${slug}?task=${t.id}`
      : `${appUrl}/client/${t.client_id}?task=${t.id}`;
    return `${emoji} <${taskLink}|${t.title}> [${t.priority}]${clientLabel}${due}`;
  });

  await updateOrPostMessage(env.LOVABLE_API_KEY, env.SLACK_API_KEY, channel, thread, thinkingTs,
    `📋 *Open Tasks* (${tasks.length})\n\n${lines.join("\n")}\n\n_Type \`@HPA create task: [request]\` to add a new task_`
  );
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
async function updateOrPostMessage(lovableKey: string, slackKey: string, channel: string, threadTs: string, thinkingTs?: string, text?: string) {
  if (thinkingTs) {
    const res = await fetch(`${SLACK_GATEWAY_URL}/chat.update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, ts: thinkingTs, text: text || "", unfurl_links: false }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Failed to update Slack message:", data.error);
      return postSlackMessage(lovableKey, slackKey, channel, threadTs, text || "");
    }
    return data;
  }
  return postSlackMessage(lovableKey, slackKey, channel, threadTs, text || "");
}

async function postSlackMessage(lovableKey: string, slackKey: string, channel: string, threadTs: string, text: string) {
  const res = await fetch(`${SLACK_GATEWAY_URL}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, thread_ts: threadTs, text, unfurl_links: false }),
  });
  const data = await res.json();
  if (!data.ok) console.error("Failed to post Slack message:", data.error);
  return data;
}

async function reactToMessage(env: Env, channel: string, timestamp: string, emoji: string) {
  try {
    await fetch(`${SLACK_GATEWAY_URL}/reactions.add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": env.SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, timestamp, name: emoji }),
    });
  } catch (err) {
    console.error("Failed to add reaction:", err);
  }
}

async function getSlackUserInfo(lovableKey: string, slackKey: string, userId: string): Promise<any> {
  try {
    const res = await fetch(`${SLACK_GATEWAY_URL}/users.info?user=${userId}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
    });
    const data = await res.json();
    return data.ok ? data.user : null;
  } catch (err) {
    console.error("Failed to get Slack user info:", err);
    return null;
  }
}

function extractLinks(text: string): string[] {
  const linkRegex = /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) links.push(match[1]);
  return links;
}

function extractImages(event: any): string[] {
  const images: string[] = [];
  if (event.files) {
    for (const file of event.files) {
      if (file.mimetype?.startsWith("image/") && file.url_private) images.push(file.url_private);
    }
  }
  return images;
}
