

# Agents Tab — Autonomous AI Workers

## Overview
Add an "Agents" tab to the agency sidebar that lets you create, configure, schedule, and monitor autonomous AI agents. Each agent has a defined role, schedule (cron), prompt, model selection, connected data sources (connectors), and an optional client scope. Agents run as scheduled edge functions that execute their prompts with full data access.

Inspired by Utari/Manus: each agent is a self-contained worker with a specific job, connectors, and a schedule.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Frontend: AgentsTab                            │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ Agent List   │  │ Agent Detail / Editor    │  │
│  │ (cards)      │→ │ - Name, description      │  │
│  │              │  │ - Schedule (cron picker)  │  │
│  │ + New Agent  │  │ - Prompt template         │  │
│  │              │  │ - Model selector          │  │
│  │ Templates ▾  │  │ - Client scope (all/one)  │  │
│  │              │  │ - Connectors (toggles)    │  │
│  └─────────────┘  │ - Run history / logs      │  │
│                    └──────────────────────────┘  │
└─────────────────────────────────────────────────┘
        │                       │
        ▼                       ▼
   DB: agents table      Edge Function:
   DB: agent_runs table  run-agent (scheduled)
```

## Database

**`agents` table:**
- `id`, `name`, `description`, `icon` (emoji/lucide)
- `prompt_template` (text — the system prompt with `{{client_name}}`, `{{date}}` variables)
- `schedule_cron` (text, e.g. `0 6 * * *` for 6 AM daily)
- `schedule_timezone` (text, default `America/Los_Angeles`)
- `model` (text, default `gemini-2.5-pro`)
- `client_id` (uuid, nullable — null = runs for all active clients)
- `connectors` (jsonb — list of enabled data sources: `["meta_ads", "ghl_crm", "database", "slack"]`)
- `enabled` (boolean)
- `template_key` (text, nullable — links to built-in templates)
- `created_at`, `updated_at`

**`agent_runs` table:**
- `id`, `agent_id` (FK), `client_id` (uuid, nullable)
- `status` (`pending` | `running` | `completed` | `failed`)
- `started_at`, `completed_at`
- `input_summary` (text — what data was pulled)
- `output_summary` (text — what the agent did/found)
- `actions_taken` (jsonb — list of mutations: records updated, messages sent, etc.)
- `error` (text, nullable)
- `tokens_used` (integer)

RLS: public full access (matches existing pattern).

## Edge Function: `run-agent`

A single edge function that:
1. Receives `{ agent_id, client_id? }` (called by pg_cron or manually)
2. Loads agent config from DB
3. Based on `connectors`, fetches relevant data:
   - `database` → queries leads, calls, daily_metrics, funded_investors
   - `meta_ads` → calls Meta API using client's `meta_access_token`
   - `ghl_crm` → calls GHL API using client's `ghl_api_key`
   - `slack` → reads/posts via Slack connector gateway
4. Interpolates data into `prompt_template`
5. Calls AI gateway with the assembled prompt
6. Parses AI response for actions (write-back data, send Slack messages, create tasks)
7. Executes actions and logs to `agent_runs`

## Built-in Agent Templates

Three starter templates the user can one-click create:

1. **Data QA Agent** — Pulls yesterday's ad spend, CRM leads, booked calls, showed calls, funded investors, and commitments. Cross-checks counts against daily_metrics. Overwrites/corrects the daily_metrics row. Posts a summary to Slack.

2. **Creatives Performance Agent** — Checks last 7 days of CPL from Meta. Identifies top/bottom performing ads. Suggests new creative directions. Can trigger static ad generation.

3. **Client Onboarding QA Agent** — Triggers when a new client is added (or on schedule). Validates all required fields are populated (GHL keys, Meta tokens, calendar IDs, pipeline stages, offers). Creates tasks for any missing items.

## Frontend Components

1. **`AgentsTab.tsx`** — Main tab with agent list + detail panel
2. **`AgentCard.tsx`** — Summary card showing name, schedule, last run status, client scope
3. **`AgentEditor.tsx`** — Full editor: name, description, prompt template (with variable chips), cron schedule builder, model dropdown, client selector, connector toggles
4. **`AgentRunHistory.tsx`** — Table of past runs with status, duration, summary, actions taken
5. **`AgentTemplateGallery.tsx`** — Grid of built-in templates with one-click create

## Sidebar Integration

Add to `AppSidebar.tsx` nav structure:
```
{ title: 'Agents', value: 'agents', icon: Cpu }
```

Add to `Index.tsx`:
```
{activeTab === 'agents' && <AgentsTab clients={clients} />}
```

## Schedule Execution

Use `pg_cron` + `pg_net` to trigger the edge function. When an agent is enabled/updated, upsert a cron job:
```sql
SELECT cron.schedule(
  'agent-{id}',
  '{schedule_cron}',
  $$ SELECT net.http_post(...run-agent..., body=>'{"agent_id":"..."}') $$
);
```

When disabled, unschedule it. Manual "Run Now" button calls the edge function directly.

## Implementation Order

1. Create `agents` + `agent_runs` tables (migration)
2. Build frontend: `AgentsTab`, `AgentEditor`, `AgentCard`, templates gallery
3. Add sidebar nav entry + Index.tsx routing
4. Build `run-agent` edge function with connector data fetching + AI execution
5. Wire up pg_cron scheduling for enabled agents
6. Add agent run history panel

## Technical Notes
- Prompt variables use `{{variable}}` syntax, replaced at runtime
- Connector data fetchers are modular functions within the edge function
- Model selector uses the same `GATEWAY_MODEL_MAP` from `ai-agent-full-context`
- Agent runs for "all clients" iterate over active clients, creating one `agent_runs` row per client
- The `run-agent` function uses `LOVABLE_API_KEY` for AI gateway and `ORIGINAL_SUPABASE_*` for production DB access

