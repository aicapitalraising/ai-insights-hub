import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClientRow {
  id: string;
  name: string;
  ghl_api_key: string | null;
  ghl_location_id: string | null;
  last_ghl_sync_at: string | null;
  ghl_sync_status: string | null;
  ghl_sync_error: string | null;
}

function getSyncBadge(client: ClientRow): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' } {
  if (!client.ghl_api_key || !client.ghl_location_id) return { label: 'Not Configured', variant: 'outline' };
  if (client.ghl_sync_status === 'error') return { label: 'Error', variant: 'destructive' };
  if (!client.last_ghl_sync_at) return { label: 'Never Synced', variant: 'outline' };
  const hours = (Date.now() - new Date(client.last_ghl_sync_at).getTime()) / (1000 * 60 * 60);
  if (hours <= 24) return { label: 'Healthy', variant: 'success' };
  return { label: 'Stale', variant: 'secondary' };
}

export function ClientSyncCards() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['sync-health-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, ghl_api_key, ghl_location_id, last_ghl_sync_at, ghl_sync_status, ghl_sync_error')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ClientRow[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { client_id: clientId, mode: 'contacts' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contacts sync triggered');
      queryClient.invalidateQueries({ queryKey: ['sync-health-clients'] });
    },
    onError: (e: any) => toast.error(`Sync failed: ${e.message}`),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onSync={() => syncMutation.mutate(client.id)}
          isSyncing={syncMutation.isPending && syncMutation.variables === client.id}
        />
      ))}
    </div>
  );
}

function ClientCard({ client, onSync, isSyncing }: { client: ClientRow; onSync: () => void; isSyncing: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const badge = getSyncBadge(client);
  const hasCredentials = !!(client.ghl_api_key && client.ghl_location_id);

  return (
    <Card className="relative">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm truncate">{client.name}</h3>
          <Badge variant={badge.variant} className="shrink-0 text-[10px]">{badge.label}</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {client.last_ghl_sync_at
            ? `Synced ${formatDistanceToNow(new Date(client.last_ghl_sync_at), { addSuffix: true })}`
            : 'Never synced'}
        </p>

        {client.ghl_sync_error && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide error' : 'Show error'}
            </button>
            {expanded && (
              <p className="text-xs text-destructive mt-1 bg-destructive/5 p-2 rounded break-all">
                {client.ghl_sync_error}
              </p>
            )}
          </div>
        )}

        {hasCredentials && (
          <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
            Sync Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
