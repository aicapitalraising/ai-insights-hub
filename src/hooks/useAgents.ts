import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as cloudDb } from '@/integrations/supabase/client';
import { supabase as prodDb } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { invokeCloudFunction } from '@/lib/cloudFunctions';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt_template: string;
  schedule_cron: string;
  schedule_timezone: string;
  model: string;
  client_id: string | null;
  connectors: string[];
  enabled: boolean;
  template_key: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  client_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  input_summary: string | null;
  output_summary: string | null;
  actions_taken: any[];
  error: string | null;
  tokens_used: number;
  client?: { id: string; name: string } | null;
}

// Helper to enrich records with client names from production DB
async function enrichWithClientNames<T extends { client_id?: string | null }>(records: T[]): Promise<(T & { client?: { id: string; name: string } | null })[]> {
  const clientIds = [...new Set(records.map(r => r.client_id).filter(Boolean))] as string[];
  if (!clientIds.length) return records.map(r => ({ ...r, client: null }));

  const { data: clients } = await prodDb
    .from('clients')
    .select('id, name')
    .in('id', clientIds);

  const clientMap = new Map((clients || []).map(c => [c.id, c]));
  return records.map(r => ({
    ...r,
    client: r.client_id ? clientMap.get(r.client_id) || null : null,
  }));
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await cloudDb
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return enrichWithClientNames(data || []) as Promise<Agent[]>;
    },
  });
}

export function useAgentRuns(agentId: string | null) {
  return useQuery({
    queryKey: ['agent-runs', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await cloudDb
        .from('agent_runs')
        .select('*')
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return enrichWithClientNames(data || []) as Promise<AgentRun[]>;
    },
    enabled: !!agentId,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agent: Partial<Agent>) => {
      const { data, error } = await cloudDb
        .from('agents')
        .insert(agent as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Agent> & { id: string }) => {
      const { error } = await cloudDb
        .from('agents')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await cloudDb.from('agents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRunAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, clientId }: { agentId: string; clientId?: string }) => {
      const { data, error } = await invokeCloudFunction('run-agent', {
        body: { agent_id: agentId, client_id: clientId, password: 'HPA1234$' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-runs'] });
      toast.success('Agent run started');
    },
    onError: (e: Error) => toast.error(`Run failed: ${e.message}`),
  });
}

export const AVAILABLE_MODELS = [
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];

export const AVAILABLE_CONNECTORS = [
  { key: 'database', label: 'Database', description: 'Access leads, calls, metrics, funded investors' },
  { key: 'meta_ads', label: 'Meta Ads', description: 'Pull ad spend and campaign data from Meta' },
  { key: 'ghl_crm', label: 'GHL CRM', description: 'Access GoHighLevel contacts, pipelines, calendars' },
  { key: 'slack', label: 'Slack', description: 'Send messages and reports to Slack channels' },
  { key: 'claude_code', label: 'Claude Code', description: 'Connect to Claude Code Desktop for automations via MCP' },
];

export const AGENT_TEMPLATES = [
  {
    key: 'data_qa',
    name: 'Data QA Agent',
    icon: '🔍',
    description: 'Cross-checks yesterday\'s ad spend, CRM leads, booked calls, showed calls, funded investors against daily_metrics. Corrects discrepancies and posts a summary to Slack.',
    connectors: ['database', 'ghl_crm', 'meta_ads', 'slack'],
    schedule_cron: '0 6 * * *',
    model: 'google/gemini-2.5-pro',
    prompt_template: `You are a Data QA Agent for {{client_name}}.

Today's date: {{date}}
You are checking data for: {{yesterday}}

## Your Task
1. Review the raw data pulled from the CRM (leads, calls, showed calls) and Meta Ads (ad spend) for {{yesterday}}.
2. Compare counts against the daily_metrics row for that date.
3. If there are discrepancies, output the corrected values.
4. Summarize what you found and any corrections made.

## Data Provided
{{data}}

## Output Format
Respond with a JSON object:
{
  "findings": "summary of what you found",
  "corrections": { "field": "new_value" },
  "slack_message": "formatted summary for Slack"
}`,
  },
  {
    key: 'creatives_performance',
    name: 'Creatives Performance Agent',
    icon: '🎨',
    description: 'Analyzes last 7 days of CPL from Meta. Identifies top/bottom performing ads and suggests new creative directions.',
    connectors: ['database', 'meta_ads'],
    schedule_cron: '0 9 * * 1',
    model: 'google/gemini-2.5-flash',
    prompt_template: `You are a Creatives Performance Agent for {{client_name}}.

## Your Task
Analyze the last 7 days of ad performance data. Identify:
1. Top 3 performing creatives by cost-per-lead
2. Bottom 3 underperforming creatives
3. Trends in creative performance
4. Suggestions for new creative directions

## Data Provided
{{data}}

## Output Format
Respond with a JSON object:
{
  "findings": "detailed analysis",
  "top_performers": [...],
  "underperformers": [...],
  "recommendations": [...]
}`,
  },
  {
    key: 'onboarding_qa',
    name: 'Client Onboarding QA Agent',
    icon: '✅',
    description: 'Validates all required fields are populated when a new client is added: GHL keys, Meta tokens, calendar IDs, pipeline stages, offers.',
    connectors: ['database', 'slack'],
    schedule_cron: '0 8 * * *',
    model: 'google/gemini-2.5-flash',
    prompt_template: `You are a Client Onboarding QA Agent for {{client_name}}.

## Your Task
Check that all required configuration fields are populated for this client:
1. GHL Location ID and API Key
2. Meta Ad Account ID and Access Token
3. Pipeline stage IDs (committed, funded, sales)
4. Calendar IDs for tracking
5. At least one offer uploaded
6. Client settings configured (thresholds, MRR, targets)

## Data Provided
{{data}}

## Output Format
Respond with a JSON object:
{
  "status": "complete" | "incomplete",
  "missing_items": ["list of missing fields"],
  "slack_message": "formatted summary"
}`,
  },
];
