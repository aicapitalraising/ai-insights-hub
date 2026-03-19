import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invalidateAfterSync } from '@/lib/invalidateAfterSync';

export interface SyncProgress {
  isLoading: boolean;
  type: 'leads' | 'calls' | 'single' | null;
  message: string | null;
}

export interface SyncResult {
  success: boolean;
  created?: number;
  updated?: number;
  error?: string;
}

export function useSyncClient(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<SyncProgress>({
    isLoading: false,
    type: null,
    message: null,
  });
  const [syncingContactIds, setSyncingContactIds] = useState<Set<string>>(new Set());
  const syncLockRef = useRef(false); // 11.5: Prevent duplicate sync triggers

  const syncLeads = useCallback(async (): Promise<SyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };
    if (syncLockRef.current) {
      toast.info('A sync is already in progress.');
      return { success: false, error: 'Sync already in progress' };
    }
    syncLockRef.current = true;

    setProgress({ isLoading: true, type: 'leads', message: 'Syncing leads from GHL...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { client_id: clientId }
      });

      if (error) throw new Error(error.message);
      if (!data?.success && !data?.results) throw new Error(data?.error || 'Sync failed');

      const created = data?.results?.[0]?.contacts?.created || 0;
      const updated = data?.results?.[0]?.contacts?.updated || 0;

      invalidateAfterSync(queryClient, clientId);
      toast.success(`Leads synced: ${created} created, ${updated} updated`);
      
      return { success: true, created, updated };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Lead sync failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setProgress({ isLoading: false, type: null, message: null });
      syncLockRef.current = false;
    }
  }, [clientId, queryClient]);

  const syncCalls = useCallback(async (): Promise<SyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };
    if (syncLockRef.current) {
      toast.info('A sync is already in progress.');
      return { success: false, error: 'Sync already in progress' };
    }
    syncLockRef.current = true;

    setProgress({ isLoading: true, type: 'calls', message: 'Syncing calls from GHL...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { client_id: clientId, mode: 'calls' }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Sync failed');

      const linked = data?.linked || 0;
      const created = data?.calls_created || 0;
      const updated = data?.calls_updated || 0;

      invalidateAfterSync(queryClient, clientId);
      toast.success(`Calls synced: ${linked} linked, ${created} created, ${updated} updated`);
      
      return { success: true, created, updated };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Call sync failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setProgress({ isLoading: false, type: null, message: null });
      syncLockRef.current = false;
    }
  }, [clientId, queryClient]);

  const syncSingleRecord = useCallback(async (externalId: string): Promise<SyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };

    setSyncingContactIds(prev => new Set(prev).add(externalId));
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { 
          client_id: clientId, 
          contactId: externalId, 
          mode: 'single' 
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Sync failed');

      invalidateAfterSync(queryClient, clientId);
      toast.success('Record synced from GHL');
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Sync failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setSyncingContactIds(prev => {
        const next = new Set(prev);
        next.delete(externalId);
        return next;
      });
    }
  }, [clientId, queryClient]);

  // 1.7: Add delay between bulk sync calls to prevent GHL rate limiting
  const syncBulkRecords = useCallback(async (externalIds: string[]): Promise<SyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };
    if (externalIds.length === 0) return { success: false, error: 'No records selected' };

    setProgress({ 
      isLoading: true, 
      type: 'single', 
      message: `Syncing ${externalIds.length} records...` 
    });
    
    let successCount = 0;
    let errorCount = 0;
    const DELAY_MS = 500;
    const CONCURRENCY = 3;

    // Process in batches of CONCURRENCY with DELAY_MS between batches
    for (let i = 0; i < externalIds.length; i += CONCURRENCY) {
      const batch = externalIds.slice(i, i + CONCURRENCY);
      
      const results = await Promise.allSettled(
        batch.map(async (externalId) => {
          setSyncingContactIds(prev => new Set(prev).add(externalId));
          try {
            const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
              body: { client_id: clientId, contactId: externalId, mode: 'single' }
            });
            if (error || !data?.success) throw new Error('Failed');
            return true;
          } finally {
            setSyncingContactIds(prev => {
              const next = new Set(prev);
              next.delete(externalId);
              return next;
            });
          }
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') successCount++;
        else errorCount++;
      }

      // Delay between batches to avoid rate limiting
      if (i + CONCURRENCY < externalIds.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    invalidateAfterSync(queryClient, clientId);
    setProgress({ isLoading: false, type: null, message: null });
    
    if (errorCount === 0) {
      toast.success(`Successfully synced ${successCount} records`);
      return { success: true, updated: successCount };
    } else {
      toast.warning(`Synced ${successCount} records, ${errorCount} failed`);
      return { success: true, updated: successCount, error: `${errorCount} failed` };
    }
  }, [clientId, queryClient]);

  const isSyncingContact = useCallback((id: string) => syncingContactIds.has(id), [syncingContactIds]);

  return {
    progress,
    syncLeads,
    syncCalls,
    syncSingleRecord,
    syncBulkRecords,
    isSyncingContact,
    syncingContactIds,
  };
}
