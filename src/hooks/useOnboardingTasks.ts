import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';

export interface OnboardingTask {
  id: string;
  client_id: string;
  category: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useOnboardingTasks(clientId: string | undefined) {
  return useQuery({
    queryKey: ['onboarding-tasks', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_onboarding_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as OnboardingTask[];
    },
    enabled: !!clientId,
  });
}

export function useToggleOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('client_onboarding_tasks')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
    },
  });
}

export async function insertOnboardingTasks(
  clientId: string,
  tasks: { category: string; title: string; sort_order: number }[]
) {
  if (tasks.length === 0) return;
  const rows = tasks.map(t => ({ client_id: clientId, ...t }));
  const { error } = await supabase.from('client_onboarding_tasks').insert(rows);
  if (error) throw error;
}
