import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { AgentRun } from '@/hooks/useAgents';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  runs: AgentRun[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  completed: 'default',
  failed: 'destructive',
  running: 'outline',
  pending: 'secondary',
};

export function AgentRunHistory({ runs, isLoading }: Props) {
  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading runs...</div>;
  if (!runs.length) return <div className="text-sm text-muted-foreground py-4">No runs yet. Click "Run Now" to execute this agent.</div>;

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Client</TableHead>
            <TableHead className="text-xs">Started</TableHead>
            <TableHead className="text-xs">Duration</TableHead>
            <TableHead className="text-xs">Summary</TableHead>
            <TableHead className="text-xs">Tokens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const duration = run.completed_at && run.started_at
              ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
              : null;
            return (
              <TableRow key={run.id}>
                <TableCell>
                  <Badge variant={statusColors[run.status] as any || 'outline'} className="text-[10px]">
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{run.client?.name || 'All'}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(run.started_at), 'MMM d, h:mm a')}
                </TableCell>
                <TableCell className="text-xs">{duration !== null ? `${duration}s` : '—'}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {run.error || run.output_summary || '—'}
                </TableCell>
                <TableCell className="text-xs">{run.tokens_used || 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
