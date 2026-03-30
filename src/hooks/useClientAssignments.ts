import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as cloudSupabase } from '@/integrations/supabase/client';

export interface ClientAssignment {
  client_id: string;
  media_buyer: string | null;
  account_manager: string | null;
}

/**
 * Reads media_buyer & account_manager from client_assignments table
 * in Lovable Cloud DB (production DB doesn't have these columns).
 */
export function useClientAssignments() {
  return useQuery({
    queryKey: ['client-assignments'],
    queryFn: async () => {
      const { data, error } = await cloudSupabase
        .from('client_assignments' as any)
        .select('client_id, media_buyer, account_manager');
      if (error) throw error;
      const map: Record<string, ClientAssignment> = {};
      for (const row of (data || []) as any[]) {
        map[row.client_id] = row as ClientAssignment;
      }
      return map;
    },
    staleTime: 30000,
  });
}

export function useUpdateClientAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, media_buyer, account_manager }: { id: string; media_buyer?: string | null; account_manager?: string | null }) => {
      const updates: Record<string, any> = { client_id: id };
      if (media_buyer !== undefined) updates.media_buyer = media_buyer;
      if (account_manager !== undefined) updates.account_manager = account_manager;

      const { error } = await cloudSupabase
        .from('client_assignments' as any)
        .upsert(updates, { onConflict: 'client_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-assignments'] });
    },
  });
}
