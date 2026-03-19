import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';

export interface ApiTestResult {
  contacts: 'success' | 'error' | 'pending' | 'not_configured';
  calendars: 'success' | 'error' | 'pending' | 'not_configured';
  opportunities: 'success' | 'error' | 'pending' | 'not_configured';
  lastTested: string | null;
  errors: {
    contacts?: string;
    calendars?: string;
    opportunities?: string;
  };
}

export interface ClientApiStatus {
  [clientId: string]: ApiTestResult;
}

export function useApiConnectionTest() {
  const [testResults, setTestResults] = useState<ClientApiStatus>({});
  const [isTesting, setIsTesting] = useState(false);

  const testClientConnection = useCallback(async (clientId: string): Promise<ApiTestResult> => {
    // Set pending state
    const pendingResult: ApiTestResult = {
      contacts: 'pending',
      calendars: 'pending',
      opportunities: 'pending',
      lastTested: null,
      errors: {},
    };
    
    setTestResults(prev => ({ ...prev, [clientId]: pendingResult }));

    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { 
          client_id: clientId, 
          mode: 'test_connection'
        }
      });

      if (error) {
        const errorResult: ApiTestResult = {
          contacts: 'error',
          calendars: 'error',
          opportunities: 'error',
          lastTested: new Date().toISOString(),
          errors: {
            contacts: error.message,
            calendars: error.message,
            opportunities: error.message,
          },
        };
        setTestResults(prev => ({ ...prev, [clientId]: errorResult }));
        return errorResult;
      }

      const result: ApiTestResult = {
        contacts: data?.contacts?.success ? 'success' : (data?.contacts?.error ? 'error' : 'not_configured'),
        calendars: data?.calendars?.success ? 'success' : (data?.calendars?.error ? 'error' : 'not_configured'),
        opportunities: data?.opportunities?.success ? 'success' : (data?.opportunities?.error ? 'error' : 'not_configured'),
        lastTested: new Date().toISOString(),
        errors: {
          contacts: data?.contacts?.error,
          calendars: data?.calendars?.error,
          opportunities: data?.opportunities?.error,
        },
      };

      setTestResults(prev => ({ ...prev, [clientId]: result }));
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const errorResult: ApiTestResult = {
        contacts: 'error',
        calendars: 'error',
        opportunities: 'error',
        lastTested: new Date().toISOString(),
        errors: {
          contacts: errorMsg,
          calendars: errorMsg,
          opportunities: errorMsg,
        },
      };
      setTestResults(prev => ({ ...prev, [clientId]: errorResult }));
      return errorResult;
    }
  }, []);

  const testAllClients = useCallback(async (clientIds: string[]) => {
    setIsTesting(true);
    
    // Test all clients in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < clientIds.length; i += batchSize) {
      const batch = clientIds.slice(i, i + batchSize);
      await Promise.all(batch.map(id => testClientConnection(id)));
    }
    
    setIsTesting(false);
  }, [testClientConnection]);

  const getClientStatus = useCallback((clientId: string): ApiTestResult | undefined => {
    return testResults[clientId];
  }, [testResults]);

  return {
    testResults,
    isTesting,
    testClientConnection,
    testAllClients,
    getClientStatus,
  };
}
