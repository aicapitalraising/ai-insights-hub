import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { fetchAllRows } from '@/lib/fetchAllRows';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: File[];
}

interface ClientData {
  id: string;
  name: string;
  status: string;
  industry?: string;
  meta_ad_account_id?: string;
  ghl_location_id?: string;
  hubspot_portal_id?: string;
}

interface ClientMetricsInput {
  totalAdSpend: number;
  totalLeads: number;
  totalCalls: number;
  showedCalls: number;
  costPerLead: number;
  costPerCall: number;
  fundedInvestors: number;
  fundedDollars: number;
  costOfCapital: number;
  spamLeads?: number;
  commitments?: number;
  commitmentDollars?: number;
}

type FullModel = 'gemini-2.5-pro' | 'gemini-3-flash' | 'gemini-3-pro' | 'gpt-5';

/** Build a comprehensive text context from client data + metrics */
function buildSystemContext(
  clients: ClientData[],
  clientMetrics: Record<string, ClientMetricsInput>,
  focusedClientId?: string | null,
  tasks?: any[],
  fundedInvestors?: any[],
  clientSettings?: any[],
): string {
  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'onboarding');
  const blocks: string[] = [];

  const filteredClients = focusedClientId
    ? clients.filter(c => c.id === focusedClientId)
    : clients;

  for (const client of filteredClients) {
    const m = clientMetrics[client.id];
    if (!m) continue;

    const integrations: string[] = [];
    if (client.meta_ad_account_id) integrations.push('Meta Ads');
    if (client.ghl_location_id) integrations.push('GHL');
    if (client.hubspot_portal_id) integrations.push('HubSpot');

    const settings = clientSettings?.find((s: any) => s.client_id === client.id);
    const cTasks = (tasks || []).filter((t: any) => t.client_id === client.id);
    const openTasks = cTasks.filter((t: any) => t.status !== 'done');
    const overdueTasks = openTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());
    const cFunded = (fundedInvestors || []).filter((f: any) => f.client_id === client.id);

    let block = `\n## ${client.name} (${client.status})${client.industry ? ` | ${client.industry}` : ''}
**Integrations:** ${integrations.length > 0 ? integrations.join(', ') : 'None'}
**Performance Metrics:**
- Ad Spend: $${m.totalAdSpend.toLocaleString()} | Leads: ${m.totalLeads}${m.spamLeads ? ` (${m.spamLeads} spam)` : ''} | CPL: $${m.costPerLead.toFixed(2)}
- Calls: ${m.totalCalls} | Shows: ${m.showedCalls} (${m.totalCalls > 0 ? ((m.showedCalls / m.totalCalls) * 100).toFixed(1) : 0}%) | Cost/Call: $${m.costPerCall.toFixed(2)}
- Funded: ${m.fundedInvestors} investors, $${m.fundedDollars.toLocaleString()} | Cost of Capital: ${m.costOfCapital.toFixed(2)}%`;

    if (m.commitments) {
      block += `\n- Commitments: ${m.commitments} ($${(m.commitmentDollars || 0).toLocaleString()})`;
    }

    if (settings) {
      const parts: string[] = [];
      if (settings.mrr) parts.push(`MRR: $${settings.mrr}`);
      if (settings.monthly_ad_spend_target) parts.push(`Monthly Ad Spend Target: $${settings.monthly_ad_spend_target}`);
      if (settings.total_raise_amount) parts.push(`Total Raise: $${Number(settings.total_raise_amount).toLocaleString()}`);
      if (parts.length > 0) block += `\n**Goals:** ${parts.join(' | ')}`;
    }

    if (cFunded.length > 0) {
      const recent = cFunded.slice(0, 5);
      block += `\n**Recent Funded:** ${recent.map((f: any) => `${f.name || 'Unknown'} ($${(f.funded_amount || 0).toLocaleString()}, ${f.time_to_fund_days || '?'} days)`).join('; ')}`;
    }

    if (openTasks.length > 0) {
      block += `\n**Open Tasks:** ${openTasks.length} (${overdueTasks.length} overdue)`;
      const top = openTasks.slice(0, 3);
      block += ` — ${top.map((t: any) => `"${t.title}" [${t.priority}]`).join(', ')}`;
    }

    blocks.push(block);
  }

  // Client ID lookup for task creation
  const clientIdLookup = filteredClients.map(c => `- "${c.name}" → ${c.id}`).join('\n');

  return `Total Clients: ${clients.length} (${activeClients.length} active)

# Portfolio Data
${blocks.join('\n')}

# Client ID Reference (for task creation):
${clientIdLookup}`;
}

export function useAgencyAIAnalysis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const streamResponse = useCallback(async (response: Response) => {
    let assistantContent = '';

    const updateAssistant = (newChunk: string) => {
      assistantContent += newChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) updateAssistant(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  }, []);

  /** Send a message with full context built client-side */
  const sendMessage = useCallback(async (
    input: string,
    clients: ClientData[],
    clientMetrics: Record<string, ClientMetricsInput>,
    existingMessages: Message[],
    model: FullModel = 'gemini-2.5-pro',
    focusedClientId?: string | null,
    onTokenUsage?: (used: number, system: number) => void,
  ) => {
    const userMsg: Message = { role: 'user', content: input };
    const allMessages = [...existingMessages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    try {
      // Fetch additional context data from original DB in parallel
      const [
        { data: tasks },
        { data: clientSettingsData },
        fundedData,
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, client_id, title, status, priority, due_date')
          .in('status', ['todo', 'in_progress']),
        supabase
          .from('client_settings')
          .select('client_id, mrr, monthly_ad_spend_target, total_raise_amount, funded_investor_label'),
        fetchAllRows((sb) =>
          sb.from('funded_investors')
            .select('id, client_id, name, funded_amount, funded_at, time_to_fund_days, calls_to_fund')
            .order('funded_at', { ascending: false })
            .limit(50)
        ),
      ]);

      const systemContext = buildSystemContext(
        clients,
        clientMetrics,
        focusedClientId,
        tasks || [],
        fundedData,
        clientSettingsData || [],
      );

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-full-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            systemContext,
            model,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
        if (response.status === 402) throw new Error('AI credits exhausted. Please add more credits.');
        throw new Error('Failed to get AI response');
      }

      // Read token headers
      const contextTokens = parseInt(response.headers.get('X-Context-Tokens') || '0', 10);
      const systemTokens = parseInt(response.headers.get('X-System-Tokens') || '0', 10);
      if (onTokenUsage && contextTokens > 0) {
        onTokenUsage(contextTokens, systemTokens);
      }

      await streamResponse(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [streamResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
