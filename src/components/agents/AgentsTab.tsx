import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCard } from './AgentCard';
import { AgentEditor } from './AgentEditor';
import { AgentRunHistory } from './AgentRunHistory';
import { AgentTemplateGallery } from './AgentTemplateGallery';
import {
  useAgents, useAgentRuns, useCreateAgent, useUpdateAgent, useDeleteAgent, useRunAgent,
  AGENT_TEMPLATES, type Agent,
} from '@/hooks/useAgents';
import type { Client } from '@/hooks/useClients';

interface Props {
  clients: Client[];
}

export function AgentsTab({ clients }: Props) {
  const { data: agents = [], isLoading } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

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

  // Get last run status for each agent
  const lastRunByAgent: Record<string, string> = {};
  // We'll use the runs for the selected agent, but for cards we need a quick lookup
  // For simplicity, just show it for the selected agent

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">AI Agents</h2>
          <p className="text-sm text-muted-foreground">Autonomous workers that run on schedule with full data access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide Templates' : 'Templates'}
          </Button>
          <Button size="sm" onClick={handleCreateBlank} disabled={createAgent.isPending}>
            <Plus className="h-4 w-4 mr-1" /> New Agent
          </Button>
        </div>
      </div>

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
