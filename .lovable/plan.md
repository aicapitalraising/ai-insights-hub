

## Full-Portfolio AI Agent with Token Usage Tracking

### What This Does
Build an AI agent that loads **every client's complete data** (metrics, leads, calls, funded investors, tasks, meetings, pipeline) into a single conversation context, with a live token usage bar showing how full the context window is. Model selection lets you switch between models with different context limits.

### Important Note on Model Choice
Grok (xAI) is not available through the platform's AI gateway. The best alternatives with the largest context windows are:
- **Gemini 2.5 Pro** -- 1M token context (biggest available)
- **Gemini 3 Pro Preview** -- next-gen reasoning
- **GPT-5** -- strong reasoning, 128K context

Gemini 2.5 Pro at 1M tokens can hold data for dozens of clients simultaneously. The token bar will show usage against each model's limit.

### Changes

**1. New Edge Function: `ai-agent-full-context`**
- Queries the database directly for ALL client data using the service role:
  - `clients` (all records with status)
  - `daily_metrics` (aggregated per client for the selected date range)
  - `leads` (counts and recent entries per client)
  - `calls` (counts, show rates, recent transcripts)
  - `funded_investors` (counts and amounts per client)
  - `tasks` (open tasks with assignees per client)
  - `agency_meetings` (recent meetings with summaries)
  - `pipeline_opportunities` (pipeline values per client)
- Builds a comprehensive system prompt with all data
- Estimates token count (characters / 4) and returns it alongside the stream
- Routes through **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `LOVABLE_API_KEY`
- Supports model switching: `google/gemini-2.5-pro`, `google/gemini-3-pro-preview`, `google/gemini-3-flash-preview`, `openai/gpt-5`
- Returns token estimate in a header (`X-Context-Tokens`) before streaming begins

**2. Update `AIHubChat.tsx`**
- Add new model options with context limits:
  - Gemini 2.5 Pro (1M) -- default for full-portfolio analysis
  - Gemini 3 Flash (1M)
  - Gemini 3 Pro (1M)
  - GPT-5 (128K)
- Add **token usage bar** below the header:
  - Shows `{usedTokens} / {maxTokens}` with a progress bar
  - Color changes: green (under 50%), yellow (50-80%), red (over 80%)
  - Updates after each message exchange
  - Tooltip shows breakdown (system prompt tokens vs conversation tokens)
- Route requests to new `ai-agent-full-context` function when "Full Portfolio" mode is active
- Add a toggle/badge for "Full Portfolio Mode" that loads all data server-side vs the current client-side metrics injection

**3. Update `AgencyAIChat.tsx` (floating chat)**
- Add the same token usage bar
- Add model selector with the expanded model list
- When set to "All Clients", use the new full-context edge function

### Technical Details

**Edge function data assembly:**
```text
For each client:
  - Name, status, ad spend, leads, calls, shows, CPL, CPC
  - Funded investors count + total dollars + cost of capital
  - Open tasks count + overdue count
  - Recent meeting summaries (last 30 days)
  - Pipeline stage distribution + total value
  - Recent lead sources breakdown

Estimated tokens for 20 clients: ~15K-30K tokens
Estimated tokens for 50 clients: ~40K-80K tokens
Gemini 2.5 Pro limit: 1,000,000 tokens (plenty of room)
```

**Token estimation logic:**
```text
systemPromptTokens = systemPrompt.length / 4
conversationTokens = sum(messages.map(m => m.content.length / 4))
totalTokens = systemPromptTokens + conversationTokens
maxTokens = MODEL_LIMITS[selectedModel]  // e.g. 1000000 for gemini-2.5-pro
```

**Token bar component:**
```text
[============================--------] 72% (720K / 1M tokens)
      yellow bar at 72%

Colors:
  < 50%  -> green (bg-green-500)
  50-80% -> yellow (bg-yellow-500)  
  > 80%  -> red (bg-red-500)
```

**Model limits map:**
```text
google/gemini-2.5-pro      -> 1,048,576
google/gemini-3-pro-preview -> 1,048,576
google/gemini-3-flash-preview -> 1,048,576
openai/gpt-5               -> 128,000
```

**Files to create/edit:**
- Create: `supabase/functions/ai-agent-full-context/index.ts`
- Edit: `src/components/ai/AIHubChat.tsx` (token bar, model options, full-portfolio toggle)
- Edit: `src/components/ai/AgencyAIChat.tsx` (token bar, model options)
- Edit: `supabase/config.toml` (register new function with `verify_jwt = false`)

