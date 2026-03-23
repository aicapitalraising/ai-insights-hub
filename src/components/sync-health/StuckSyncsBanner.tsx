import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function StuckSyncsBanner() {
  const queryClient = useQueryClient();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: stuckSyncs } = useQuery({
    queryKey: ['stuck-syncs'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('sync_logs')
        .select('id', { count: 'exact' })
        .eq('status', 'running')
        .lt('started_at', thirtyMinAgo);
      if (error) throw error;
      return { ids: data?.map(r => r.id) || [], count: count || 0 };
    },
    refetchInterval: 30000,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!stuckSyncs?.ids.length) return;
      for (const id of stuckSyncs.ids) {
        await supabase.from('sync_logs').update({ status: 'timeout', completed_at: new Date().toISOString() }).eq('id', id);
      }
    },
    onSuccess: () => {
      toast.success('Stuck syncs reset to timeout');
      queryClient.invalidateQueries({ queryKey: ['stuck-syncs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs-table'] });
    },
  });

  if (!stuckSyncs?.count) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border-2 border-warning/30 bg-warning/10">
      <div className="flex items-center gap-2 text-warning-foreground">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">
          {stuckSyncs.count} sync{stuckSyncs.count > 1 ? 's' : ''} stuck running for 30+ minutes
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
        <RotateCcw className="h-3.5 w-3.5 mr-1" />
        Reset Stuck
      </Button>
    </div>
  );
}
