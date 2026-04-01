import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { AVAILABLE_MODELS, AVAILABLE_CONNECTORS, type Agent } from '@/hooks/useAgents';
import type { Client } from '@/hooks/useClients';

interface Props {
  agent: Agent;
  clients: Client[];
  onSave: (updates: Partial<Agent>) => void;
  isSaving: boolean;
}

export function AgentEditor({ agent, clients, onSave, isSaving }: Props) {
  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    prompt_template: agent.prompt_template,
    schedule_cron: agent.schedule_cron,
    schedule_timezone: agent.schedule_timezone,
    model: agent.model,
    client_id: agent.client_id || '__all__',
    connectors: agent.connectors || [],
    enabled: agent.enabled,
  });

  useEffect(() => {
    setForm({
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      prompt_template: agent.prompt_template,
      schedule_cron: agent.schedule_cron,
      schedule_timezone: agent.schedule_timezone,
      model: agent.model,
      client_id: agent.client_id || '__all__',
      connectors: agent.connectors || [],
      enabled: agent.enabled,
    });
  }, [agent.id]);

  const toggleConnector = (key: string) => {
    setForm(f => ({
      ...f,
      connectors: f.connectors.includes(key)
        ? f.connectors.filter(c => c !== key)
        : [...f.connectors, key],
    }));
  };

  const handleSave = () => {
    onSave({
      id: agent.id,
      name: form.name,
      description: form.description,
      icon: form.icon,
      prompt_template: form.prompt_template,
      schedule_cron: form.schedule_cron,
      schedule_timezone: form.schedule_timezone,
      model: form.model,
      client_id: form.client_id === '__all__' ? null : form.client_id,
      connectors: form.connectors,
      enabled: form.enabled,
    });
  };

  const variables = ['{{client_name}}', '{{date}}', '{{yesterday}}', '{{data}}'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            value={form.icon}
            onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
            className="w-14 text-center text-xl"
          />
          <Input
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="text-lg font-semibold"
            placeholder="Agent name"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Enabled</Label>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm(f => ({ ...f, enabled: v }))} />
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="What does this agent do?"
        />
      </div>

      {/* Schedule + Model + Client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Schedule (Cron)</Label>
          <Input
            value={form.schedule_cron}
            onChange={(e) => setForm(f => ({ ...f, schedule_cron: e.target.value }))}
            placeholder="0 6 * * *"
          />
          <p className="text-[10px] text-muted-foreground mt-1">e.g. "0 6 * * *" = daily at 6 AM</p>
        </div>
        <div>
          <Label className="text-xs">AI Model</Label>
          <Select value={form.model} onValueChange={(v) => setForm(f => ({ ...f, model: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Client Scope</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Active Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Connectors */}
      <div>
        <Label className="text-xs mb-2 block">Connectors</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AVAILABLE_CONNECTORS.map((c) => (
            <div
              key={c.key}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                form.connectors.includes(c.key) ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => toggleConnector(c.key)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{c.label}</span>
                <Switch checked={form.connectors.includes(c.key)} onCheckedChange={() => toggleConnector(c.key)} />
              </div>
              <p className="text-[10px] text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Template */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Prompt Template</Label>
          <div className="flex gap-1">
            {variables.map(v => (
              <Badge
                key={v}
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={() => {
                  setForm(f => ({ ...f, prompt_template: f.prompt_template + ' ' + v }));
                }}
              >
                {v}
              </Badge>
            ))}
          </div>
        </div>
        <Textarea
          value={form.prompt_template}
          onChange={(e) => setForm(f => ({ ...f, prompt_template: e.target.value }))}
          rows={12}
          className="font-mono text-xs"
          placeholder="Write the system prompt for this agent..."
        />
      </div>
    </div>
  );
}
