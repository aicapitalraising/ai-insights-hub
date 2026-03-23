import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const PAGE_SIZE = 25;

export function SyncLogsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const channel = supabase
      .channel('sync-logs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sync_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sync-logs-table'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['sync-log-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      return data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sync-logs-table', page, clientFilter, statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('sync_logs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (clientFilter !== 'all') query = query.eq('client_id', clientFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (typeFilter !== 'all') query = query.eq('sync_type', typeFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
  });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'destructive' | 'secondary' | 'default' | 'outline'> = {
      success: 'success', error: 'destructive', timeout: 'destructive',
      running: 'default', pending: 'outline', partial: 'secondary',
    };
    return map[s] || 'outline';
  };

  const getDuration = (row: any) => {
    if (!row.completed_at || !row.started_at) return '—';
    const secs = differenceInSeconds(new Date(row.completed_at), new Date(row.started_at));
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={clientFilter} onValueChange={v => { setClientFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ghl_contacts">GHL Contacts</SelectItem>
            <SelectItem value="ghl_single_contact">GHL Single Contact</SelectItem>
            <SelectItem value="ghl_calls">GHL Calls</SelectItem>
            <SelectItem value="daily-master-sync">Daily Master Sync</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : !data?.rows.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No sync logs found</TableCell></TableRow>
            ) : (
              data.rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs font-medium">{clientMap[row.client_id] || row.client_id?.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{row.sync_type}</Badge></TableCell>
                  <TableCell><Badge variant={statusBadge(row.status)} className="text-[10px]">{row.status}</Badge></TableCell>
                  <TableCell className="text-xs text-right">{row.records_synced ?? '—'}</TableCell>
                  <TableCell className="text-xs">{getDuration(row)}</TableCell>
                  <TableCell className="text-xs">
                    <span title={format(new Date(row.started_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(row.started_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={row.error_message || ''}>
                    {row.error_message || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} ({data?.total} total)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
