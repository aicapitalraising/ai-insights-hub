import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const PAGE_SIZE = 25;

export function WebhookFeedTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('webhook-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webhook_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['webhook-feed'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['webhook-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      return data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['webhook-feed', page, clientFilter, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .order('processed_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (clientFilter !== 'all') query = query.eq('client_id', clientFilter);
      if (typeFilter !== 'all') query = query.eq('webhook_type', typeFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
  });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const statusColor = (s: string) => {
    if (s === 'success' || s === 'processed') return 'success';
    if (s === 'error') return 'destructive';
    return 'secondary';
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
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="opportunity">Opportunity</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : !data?.rows.length ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No webhook logs found</TableCell></TableRow>
            ) : (
              data.rows.map(row => (
                <>
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                    <TableCell className="text-xs">
                      <span title={format(new Date(row.processed_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(row.processed_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{clientMap[row.client_id] || row.client_id?.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{row.webhook_type}</Badge></TableCell>
                    <TableCell><Badge variant={statusColor(row.status)} className="text-[10px]">{row.status}</Badge></TableCell>
                    <TableCell>{expandedRow === row.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</TableCell>
                  </TableRow>
                  {expandedRow === row.id && (
                    <TableRow key={`${row.id}-payload`}>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <pre className="text-[10px] max-h-48 overflow-auto whitespace-pre-wrap break-all p-2 rounded bg-muted font-mono">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                        {row.error_message && (
                          <p className="text-xs text-destructive mt-2">{row.error_message}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
