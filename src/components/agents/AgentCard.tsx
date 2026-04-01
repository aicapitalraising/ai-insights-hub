import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import type { Agent } from '@/hooks/useAgents';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
  onRun: () => void;
  onDelete: () => void;
  lastRunStatus?: string;
}

export function AgentCard({ agent, isSelected, onSelect, onToggle, onRun, onDelete, lastRunStatus }: AgentCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{agent.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
            </div>
          </div>
          <Switch
            checked={agent.enabled}
            onCheckedChange={(e) => { e && e; onToggle(!agent.enabled); }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {agent.schedule_cron}
          </Badge>
          {agent.client?.name ? (
            <Badge variant="secondary" className="text-[10px]">{agent.client.name}</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">All Clients</Badge>
          )}
          {lastRunStatus && (
            <Badge
              variant={lastRunStatus === 'completed' ? 'default' : lastRunStatus === 'failed' ? 'destructive' : 'outline'}
              className="text-[10px]"
            >
              {lastRunStatus}
            </Badge>
          )}
        </div>
        <div className="flex gap-1 mt-3">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onRun(); }}>
            <Play className="h-3 w-3 mr-1" /> Run Now
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
