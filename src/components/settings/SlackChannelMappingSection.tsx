import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, MessageSquare, Zap, Eye, Bot } from 'lucide-react';
import {
  useSlackChannelMappings,
  useAddSlackChannel,
  useUpdateSlackChannel,
  useRemoveSlackChannel,
} from '@/hooks/useSlackIntegration';

interface SlackChannelMappingSectionProps {
  clientId: string;
}

const CHANNEL_TYPES = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'tasks', label: 'Tasks', icon: '📋' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'reporting', label: 'Reporting', icon: '📊' },
  { value: 'review', label: 'Review', icon: '👀' },
  { value: 'other', label: 'Other', icon: '📌' },
];

export function SlackChannelMappingSection({ clientId }: SlackChannelMappingSectionProps) {
  const { data: mappings = [], isLoading } = useSlackChannelMappings(clientId);
  const addChannel = useAddSlackChannel();
  const updateChannel = useUpdateSlackChannel();
  const removeChannel = useRemoveSlackChannel();

  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('general');

  const handleAdd = () => {
    if (!newChannelId.trim()) return;
    addChannel.mutate({
      client_id: clientId,
      channel_id: newChannelId.trim(),
      channel_name: newChannelName.trim() || null,
      channel_type: newChannelType,
      monitor_messages: true,
      auto_create_tasks: false,
    });
    setNewChannelId('');
    setNewChannelName('');
    setNewChannelType('general');
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-1 flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Slack Channel Integration
        </h4>
        <p className="text-sm text-muted-foreground">
          Map multiple Slack channels to this client. Messages are logged as activity, and the AI bot can auto-create tasks, update existing ones, and provide summaries.
        </p>
      </div>

      {/* Existing mappings */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading channels...</p>
      ) : mappings.length > 0 ? (
        <div className="space-y-3">
          {mappings.map((mapping) => {
            const typeInfo = CHANNEL_TYPES.find(t => t.value === mapping.channel_type) || CHANNEL_TYPES[5];
            return (
              <div key={mapping.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{typeInfo.icon}</span>
                    <span className="font-medium text-sm">
                      {mapping.channel_name || mapping.channel_id}
                    </span>
                    <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                    <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                      {mapping.channel_id}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeChannel.mutate({ id: mapping.id, client_id: clientId })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={mapping.monitor_messages}
                      onCheckedChange={(checked) =>
                        updateChannel.mutate({ id: mapping.id, client_id: clientId, monitor_messages: checked })
                      }
                    />
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Monitor Messages</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={mapping.auto_create_tasks}
                      onCheckedChange={(checked) =>
                        updateChannel.mutate({ id: mapping.id, client_id: clientId, auto_create_tasks: checked })
                      }
                    />
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Auto-Create Tasks</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
          No Slack channels mapped yet. Add one below.
        </div>
      )}

      {/* Add new channel */}
      <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-sm font-medium flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          Add Channel
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Channel ID</Label>
            <Input
              value={newChannelId}
              onChange={(e) => setNewChannelId(e.target.value)}
              placeholder="C0123456789"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Name (optional)</Label>
            <Input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="#client-general"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={newChannelType} onValueChange={setNewChannelType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newChannelId.trim() || addChannel.isPending}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Channel
        </Button>
        <p className="text-xs text-muted-foreground">
          Right-click the channel in Slack → View channel details → copy the Channel ID at the bottom
        </p>
      </div>
    </div>
  );
}
