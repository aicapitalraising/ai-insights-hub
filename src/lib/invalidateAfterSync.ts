import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized cache invalidation after any sync operation.
 * Call this instead of scattering invalidateQueries across hooks.
 */
const SYNC_QUERY_KEYS = [
  'leads', 'calls', 'funded-investors', 'daily-metrics', 'all-daily-metrics',
  'sync-health', 'gap-leads', 'data-discrepancies', 'pipeline-opportunities',
  'client-pipelines', 'clients', 'client', 'contact-timeline', 'sync-runs',
  'reconciliation-runs', 'source-metrics', 'yearly-metrics', 'meta-campaigns',
  'meta-ad-sets', 'meta-ads', 'live-ads', 'creatives', 'creative-briefs',
  'ad-scripts', 'deals', 'tasks', 'projects', 'call-recordings',
  'funnel-campaigns', 'webhook-logs', 'sync-queue-stats', 'sync-queue-jobs',
  'client-source-metrics',
];

export function invalidateAfterSync(queryClient: QueryClient, clientId?: string) {
  for (const key of SYNC_QUERY_KEYS) {
    if (clientId) {
      queryClient.invalidateQueries({ queryKey: [key, clientId] });
    }
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
