import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invalidateAfterSync } from '@/lib/invalidateAfterSync';

export interface MasterSyncProgress {
  isLoading: boolean;
  phase: string | null;
  message: string | null;
}

export interface MasterSyncSummary {
  contacts_created: number;
  contacts_updated: number;
  calls_created: number;
  calls_updated: number;
  reconnect_calls: number;
  funded_investors_created: number;
  opportunities_synced: number;
  orphaned_calls_linked: number;
  discrepancies_cleared: number;
  errors: string[];
}

export interface SettingsSummary {
  tracked_calendars: number;
  reconnect_calendars: number;
  funded_pipeline_configured: boolean;
  funded_stages: number;
  committed_stages: number;
}

export interface MasterSyncResult {
  success: boolean;
  message?: string;
  started_at?: string;
  summary?: MasterSyncSummary;
  config_warnings?: string[];
  settings_summary?: SettingsSummary;
  error?: string;
}

export function useMasterSync(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<MasterSyncProgress>({
    isLoading: false,
    phase: null,
    message: null,
  });
  const [configWarnings, setConfigWarnings] = useState<string[]>([]);
  const syncLockRef = useRef(false); // 11.5: Prevent duplicate sync triggers

  // 1.3: Replace polling with Realtime subscription on clients table
  useEffect(() => {
    if (!clientId || !progress.isLoading) return;

    const channel = supabase
      .channel(`sync-status-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${clientId}`,
        },
        (payload) => {
          const newStatus = payload.new?.ghl_sync_status;
          const oldStatus = payload.old?.ghl_sync_status;

          // Only react when status changes FROM 'syncing' to something else
          if (oldStatus === 'syncing' && newStatus !== 'syncing') {
            setProgress({ isLoading: false, phase: null, message: null });
            syncLockRef.current = false;
            invalidateAfterSync(queryClient, clientId);

            if (newStatus === 'healthy') {
              toast.success('Master sync complete! All data synchronized.');
            } else if (newStatus === 'partial') {
              toast.warning('Master sync completed with some warnings. Check sync status for details.');
            } else if (newStatus === 'error') {
              const syncError = payload.new?.ghl_sync_error;
              toast.error(`Master sync encountered errors: ${syncError || 'Unknown error'}`);
            }
          }
        }
      )
      .subscribe();

    // Auto-timeout after 10 minutes (safety net)
    const timeout = setTimeout(() => {
      setProgress({ isLoading: false, phase: null, message: null });
      syncLockRef.current = false;
      invalidateAfterSync(queryClient, clientId);
      toast.info('Background sync may still be running. Refresh to check status.');
    }, 600000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [clientId, progress.isLoading, queryClient]);

  const runMasterSync = useCallback(async (): Promise<MasterSyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };

    // 11.5: Prevent duplicate concurrent syncs
    if (syncLockRef.current) {
      toast.info('A sync is already in progress.');
      return { success: false, error: 'Sync already in progress' };
    }
    syncLockRef.current = true;

    setProgress({ 
      isLoading: true, 
      phase: 'Starting', 
      message: 'Initializing comprehensive GHL sync (runs in background)...' 
    });
    setConfigWarnings([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { 
          client_id: clientId,
          mode: 'master_sync'
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Master sync failed');

      // Check for configuration warnings
      const warnings = data.config_warnings || [];
      setConfigWarnings(warnings);
      
      if (warnings.length > 0) {
        for (const warning of warnings) {
          toast.warning(warning, { duration: 8000 });
        }
        toast.info('Master sync started, but some data types may not sync due to missing configuration.');
      } else {
        toast.success('Master sync started! Processing contacts, calls, and opportunities in background...');
      }
      
      setProgress({ 
        isLoading: true, 
        phase: 'Processing', 
        message: 'Sync running in background. This may take several minutes...' 
      });
      
      // Realtime subscription in the useEffect above will handle completion
      
      return { 
        success: true, 
        message: data.message,
        config_warnings: warnings,
        settings_summary: data.settings_summary,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Master sync failed: ${errorMessage}`);
      setProgress({ isLoading: false, phase: null, message: null });
      syncLockRef.current = false;
      return { success: false, error: errorMessage };
    }
  }, [clientId]);

  return {
    progress,
    configWarnings,
    runMasterSync,
  };
}
