import { useState } from 'react';
import { Plus, Terminal, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCard } from './AgentCard';
import { AgentEditor } from './AgentEditor';
import { AgentRunHistory } from './AgentRunHistory';
import { AgentTemplateGallery } from './AgentTemplateGallery';
import { toast } from 'sonner';
import {
  useAgents, useAgentRuns, useCreateAgent, useUpdateAgent, useDeleteAgent, useRunAgent,
  AGENT_TEMPLATES, type Agent,
} from '@/hooks/useAgents';
import type { Client } from '@/hooks/useClients';

interface Props {
  clients: Client[];
}

function McpConnectionInfo() {
  const [copied, setCopied] = useState(false);
  const mcpUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-agent-server`;

  const mcpConfig = JSON.stringify({
    mcpServers: {
      "hpa-agents": {
        url: mcpUrl,
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }
      }
    }
  }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    toast.success('MCP config copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Claude Code Desktop Connection</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Add this to your Claude Code Desktop MCP settings to connect your agents:
      </p>
      <div className="relative">
        <pre className="bg-background border rounded p-3 text-[11px] font-mono overflow-x-auto max-h-48">
          {mcpConfig}
        </pre>
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 h-7"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Available tools: list_agents, run_agent, get_agent_runs, list_clients, get_client_metrics, create_agent, update_agent, get_tasks, create_task
      </p>
    </div>
  );
}

export function AgentsTab({ clients }: Props) {
  const { data: agents = [], isLoading } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMcp, setShowMcp] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedId) || null;
  const { data: runs = [], isLoading: runsLoading } = useAgentRuns(selectedId);

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const runAgent = useRunAgent();

  const handleCreateFromTemplate = (templateKey: string) => {
    const t = AGENT_TEMPLATES.find(t => t.key === templateKey);
    if (!t) return;
    createAgent.mutate({
      name: t.name,
      icon: t.icon,
      description: t.description,
      prompt_template: t.prompt_template,
      schedule_cron: t.schedule_cron,
      model: t.model,
      connectors: t.connectors as any,
      template_key: t.key,
      enabled: false,
    } as any);
    setShowTemplates(false);
  };

  const handleCreateBlank = () => {
    createAgent.mutate({
      name: 'New Agent',
      icon: '🤖',
      description: '',
      prompt_template: '',
      schedule_cron: '0 6 * * *',
      model: 'google/gemini-2.5-pro',
      connectors: ['database'] as any,
      enabled: false,
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">AI Agents</h2>
          <p className="text-sm text-muted-foreground">Autonomous workers that run on schedule with full data access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowMcp(!showMcp); setShowTemplates(false); }}>
            <Terminal className="h-3.5 w-3.5 mr-1" /> MCP
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowTemplates(!showTemplates); setShowMcp(false); }}>
            {showTemplates ? 'Hide Templates' : 'Templates'}
          </Button>
          <Button size="sm" onClick={handleCreateBlank} disabled={createAgent.isPending}>
            <Plus className="h-4 w-4 mr-1" /> New Agent
          </Button>
        </div>
      </div>

      {showMcp && <McpConnectionInfo />}

      {showTemplates && (
        <AgentTemplateGallery onSelect={handleCreateFromTemplate} />
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
      ) : agents.length === 0 && !showTemplates ? (
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <span className="text-4xl mb-4 block">🤖</span>
          <h3 className="font-semibold mb-2">No agents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first agent from a template or start from scratch.</p>
          <Button onClick={() => setShowTemplates(true)}>Browse Templates</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="space-y-3 lg:col-span-1">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedId === agent.id}
                onSelect={() => setSelectedId(agent.id)}
                onToggle={(enabled) => updateAgent.mutate({ id: agent.id, enabled } as any)}
                onRun={() => runAgent.mutate({ agentId: agent.id, clientId: agent.client_id || undefined })}
                onDelete={() => {
                  if (selectedId === agent.id) setSelectedId(null);
                  deleteAgent.mutate(agent.id);
                }}
                lastRunStatus={undefined}
              />
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="border rounded-lg p-5 space-y-6">
                <Tabs defaultValue="config">
                  <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="history">Run History ({runs.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="config">
                    <AgentEditor
                      agent={selectedAgent}
                      clients={clients}
                      onSave={(updates) => updateAgent.mutate(updates as any)}
                      isSaving={updateAgent.isPending}
                    />
                  </TabsContent>
                  <TabsContent value="history">
                    <AgentRunHistory runs={runs} isLoading={runsLoading} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">Select an agent to view its configuration and run history</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
