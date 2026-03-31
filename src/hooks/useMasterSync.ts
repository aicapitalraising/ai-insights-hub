import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const invalidateAllQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['calls'] });
    queryClient.invalidateQueries({ queryKey: ['funded-investors'] });
    queryClient.invalidateQueries({ queryKey: ['sync-health', clientId] });
    queryClient.invalidateQueries({ queryKey: ['gap-leads'] });
    queryClient.invalidateQueries({ queryKey: ['data-discrepancies'] });
    queryClient.invalidateQueries({ queryKey: ['pipeline-opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['client-pipelines'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient, clientId]);

  // Cleanup Realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const startRealtimeListener = useCallback(() => {
    if (!clientId) return;
    
    // Remove any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
          
          if (newStatus && newStatus !== 'syncing') {
            // Sync complete — clean up
            setProgress({ isLoading: false, phase: null, message: null });
            invalidateAllQueries();
            
            if (newStatus === 'healthy' || newStatus === 'completed') {
              toast.success('Master sync complete! All data synchronized.');
            } else if (newStatus === 'partial') {
              toast.warning('Master sync completed with some warnings. Check sync status for details.');
            } else if (newStatus === 'error') {
              const error = payload.new?.ghl_sync_error || 'Unknown error';
              toast.error(`Master sync encountered errors: ${error}`);
            }

            // Unsubscribe after completion
            supabase.removeChannel(channel);
            channelRef.current = null;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      if (channelRef.current === channel) {
        supabase.removeChannel(channel);
        channelRef.current = null;
        setProgress({ isLoading: false, phase: null, message: null });
        invalidateAllQueries();
        toast.info('Background sync may still be running. Refresh to check status.');
      }
    }, 600000);
  }, [clientId, invalidateAllQueries]);

  const runMasterSync = useCallback(async (): Promise<MasterSyncResult> => {
    if (!clientId) return { success: false, error: 'No client ID' };

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
        message: 'Sync running in background. Listening for completion...' 
      });
      
      // Use Realtime instead of polling
      startRealtimeListener();
      
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
      return { success: false, error: errorMessage };
    }
  }, [clientId, invalidateAllQueries, startRealtimeListener]);

  return {
    progress,
    configWarnings,
    runMasterSync,
  };
}
