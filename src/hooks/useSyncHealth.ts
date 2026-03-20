import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';

export interface SyncHealthItem {
  recordType: 'leads' | 'calls' | 'funded';
  label: string;
  count: number;
  lastSynced: string | null;
  status: 'healthy' | 'stale' | 'critical';
}

export interface QuickCheckItem {
  id: string;
  label: string;
  count: number;
  type: 'calls_missing_lead' | 'funded_missing_lead';
}

export interface ClientSyncStatus {
  status: 'healthy' | 'stale' | 'error' | 'not_configured';
  lastSyncAt: string | null;
  syncError: string | null;
  hasCredentials: boolean;
  source: 'ghl' | 'hubspot' | 'none';
}

export interface EnrichmentStats {
  totalLeads: number;
  enrichedCount: number;
  pendingCount: number;
  failedCount: number;
  enrichmentRate: number; // percentage
}

export interface SyncHealthData {
  items: SyncHealthItem[];
  quickChecks: QuickCheckItem[];
  clientSync: ClientSyncStatus;
  enrichment: EnrichmentStats;
}

function getSyncStatus(lastSynced: string | null): 'healthy' | 'stale' | 'critical' {
  if (!lastSynced) return 'critical';
  
  const now = new Date();
  const syncedAt = new Date(lastSynced);
  const hoursDiff = (now.getTime() - syncedAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff <= 1) return 'healthy';
  if (hoursDiff <= 24) return 'stale';
  return 'critical';
}

function getClientSyncStatus(
  ghlData: {
    lastSyncAt: string | null;
    syncStatus: string | null;
    syncError: string | null;
    hasCredentials: boolean;
  },
  hubspotData: {
    lastSyncAt: string | null;
    syncStatus: string | null;
    syncError: string | null;
    hasCredentials: boolean;
  }
): ClientSyncStatus {
  if (hubspotData.hasCredentials) {
    if (hubspotData.syncStatus) {
      return {
        status: hubspotData.syncStatus as 'healthy' | 'stale' | 'error' | 'not_configured',
        lastSyncAt: hubspotData.lastSyncAt,
        syncError: hubspotData.syncError,
        hasCredentials: true,
        source: 'hubspot',
      };
    }
    if (!hubspotData.lastSyncAt) {
      return { status: 'not_configured', lastSyncAt: null, syncError: null, hasCredentials: true, source: 'hubspot' };
    }
    const hoursDiff = (new Date().getTime() - new Date(hubspotData.lastSyncAt).getTime()) / (1000 * 60 * 60);
    const status: 'healthy' | 'stale' | 'error' = hoursDiff <= 2 ? 'healthy' : hoursDiff <= 24 ? 'stale' : 'error';
    return { status, lastSyncAt: hubspotData.lastSyncAt, syncError: hubspotData.syncError, hasCredentials: true, source: 'hubspot' };
  }
  
  if (ghlData.hasCredentials) {
    if (ghlData.syncStatus) {
      return {
        status: ghlData.syncStatus as 'healthy' | 'stale' | 'error' | 'not_configured',
        lastSyncAt: ghlData.lastSyncAt,
        syncError: ghlData.syncError,
        hasCredentials: true,
        source: 'ghl',
      };
    }
    if (!ghlData.lastSyncAt) {
      return { status: 'not_configured', lastSyncAt: null, syncError: null, hasCredentials: true, source: 'ghl' };
    }
    const hoursDiff = (new Date().getTime() - new Date(ghlData.lastSyncAt).getTime()) / (1000 * 60 * 60);
    const status: 'healthy' | 'stale' | 'error' = hoursDiff <= 2 ? 'healthy' : hoursDiff <= 24 ? 'stale' : 'error';
    return { status, lastSyncAt: ghlData.lastSyncAt, syncError: ghlData.syncError, hasCredentials: true, source: 'ghl' };
  }
  
  return { status: 'not_configured', lastSyncAt: null, syncError: null, hasCredentials: false, source: 'none' };
}

export function useSyncHealth(clientId: string | undefined) {
  return useQuery({
    queryKey: ['sync-health', clientId],
    queryFn: async (): Promise<SyncHealthData> => {
      if (!clientId) {
        return { 
          items: [], 
          quickChecks: [],
          clientSync: { status: 'not_configured', lastSyncAt: null, syncError: null, hasCredentials: false, source: 'none' },
          enrichment: { totalLeads: 0, enrichedCount: 0, pendingCount: 0, failedCount: 0, enrichmentRate: 0 },
        };
      }

      const [
        clientResult,
        leadsResult,
        callsResult,
        fundedResult,
        callsMissingLeadResult,
        fundedMissingLeadResult,
        enrichedCountResult,
        pendingCountResult,
        failedCountResult,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('ghl_api_key, ghl_location_id, last_ghl_sync_at, ghl_sync_status, ghl_sync_error, hubspot_portal_id, hubspot_access_token, last_hubspot_sync_at, hubspot_sync_status, hubspot_sync_error')
          .eq('id', clientId)
          .single(),
        supabase
          .from('leads')
          .select('ghl_synced_at', { count: 'exact' })
          .eq('client_id', clientId)
          .order('ghl_synced_at', { ascending: false, nullsFirst: false })
          .limit(1),
        supabase
          .from('calls')
          .select('ghl_synced_at', { count: 'exact' })
          .eq('client_id', clientId)
          .order('ghl_synced_at', { ascending: false, nullsFirst: false })
          .limit(1),
        supabase
          .from('funded_investors')
          .select('created_at', { count: 'exact' })
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .is('lead_id', null),
        supabase
          .from('funded_investors')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .is('lead_id', null),
        // Enrichment counts
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('enrichment_status', 'enriched'),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('enrichment_status', 'pending'),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('enrichment_status', 'failed'),
      ]);

      const clientData = clientResult.data;
      const hasGhlCredentials = !!(clientData?.ghl_api_key && clientData?.ghl_location_id);
      const hasHubspotCredentials = !!((clientData as any)?.hubspot_portal_id && (clientData as any)?.hubspot_access_token);
      
      const clientSync = getClientSyncStatus(
        {
          lastSyncAt: clientData?.last_ghl_sync_at || null,
          syncStatus: clientData?.ghl_sync_status || null,
          syncError: clientData?.ghl_sync_error || null,
          hasCredentials: hasGhlCredentials,
        },
        {
          lastSyncAt: (clientData as any)?.last_hubspot_sync_at || null,
          syncStatus: (clientData as any)?.hubspot_sync_status || null,
          syncError: (clientData as any)?.hubspot_sync_error || null,
          hasCredentials: hasHubspotCredentials,
        }
      );

      const leadsLastSync = leadsResult.data?.[0]?.ghl_synced_at || null;
      const callsLastSync = callsResult.data?.[0]?.ghl_synced_at || null;
      const fundedLastSync = fundedResult.data?.[0]?.created_at || null;
      const totalLeads = leadsResult.count || 0;
      const enrichedCount = enrichedCountResult.count || 0;
      const pendingCount = pendingCountResult.count || 0;
      const failedCount = failedCountResult.count || 0;

      const items: SyncHealthItem[] = [
        {
          recordType: 'leads',
          label: 'Leads',
          count: totalLeads,
          lastSynced: leadsLastSync,
          status: getSyncStatus(leadsLastSync),
        },
        {
          recordType: 'calls',
          label: 'Calls',
          count: callsResult.count || 0,
          lastSynced: callsLastSync,
          status: getSyncStatus(callsLastSync),
        },
        {
          recordType: 'funded',
          label: 'Funded',
          count: fundedResult.count || 0,
          lastSynced: fundedLastSync,
          status: getSyncStatus(fundedLastSync),
        },
      ];

      const quickChecks: QuickCheckItem[] = [
        {
          id: 'calls_missing_lead',
          label: 'Calls missing lead link',
          count: callsMissingLeadResult.count || 0,
          type: 'calls_missing_lead',
        },
        {
          id: 'funded_missing_lead',
          label: 'Funded without lead',
          count: fundedMissingLeadResult.count || 0,
          type: 'funded_missing_lead',
        },
      ];

      const enrichment: EnrichmentStats = {
        totalLeads,
        enrichedCount,
        pendingCount,
        failedCount,
        enrichmentRate: totalLeads > 0 ? Math.round((enrichedCount / totalLeads) * 100) : 0,
      };

      return { items, quickChecks, clientSync, enrichment };
    },
    enabled: !!clientId,
    staleTime: 30000,
  });
}
