import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WebhookCoveragePanel() {
  const { data: coverage = [] } = useQuery({
    queryKey: ['webhook-coverage'],
    queryFn: async () => {
      // Get clients with GHL credentials
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, ghl_api_key, ghl_location_id')
        .not('ghl_api_key', 'is', null)
        .not('ghl_location_id', 'is', null);
      if (!clients?.length) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const results = await Promise.all(
        clients.map(async (client) => {
          const [todayRes, yesterdayRes] = await Promise.all([
            supabase
              .from('webhook_logs')
              .select('id', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .gte('processed_at', today.toISOString()),
            supabase
              .from('webhook_logs')
              .select('id', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .gte('processed_at', yesterday.toISOString())
              .lt('processed_at', today.toISOString()),
          ]);

          const todayCount = todayRes.count || 0;
          const yesterdayCount = yesterdayRes.count || 0;
          const dropped = yesterdayCount > 0 && todayCount < yesterdayCount * 0.5;

          return {
            id: client.id,
            name: client.name,
            todayCount,
            yesterdayCount,
            hasRecent: todayCount > 0,
            dropped,
          };
        })
      );
      return results;
    },
    staleTime: 60000,
  });

  if (!coverage.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Webhook Coverage (24h)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {coverage.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
            <div className="flex items-center gap-2">
              {c.hasRecent ? (
                <CheckCircle className="h-4 w-4 text-chart-2" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="truncate max-w-[140px]">{c.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Today: {c.todayCount}</span>
              <span>Yesterday: {c.yesterdayCount}</span>
              {c.dropped && (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
