import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { supabase as cloudClient } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Task } from './useTasks';

export interface TaskSnapshot {
  task_id: string;
  title: string;
  client_id: string | null;
  client_name?: string;
  status: 'completed' | 'in_progress' | 'blocked';
  blocker_reason?: string;
  blocker_next_step?: string;
}

export interface DailyReport {
  id: string;
  member_id: string;
  report_date: string;
  report_type: 'sod' | 'eod';
  top_priorities: string[];
  tasks_snapshot: TaskSnapshot[];
  touchpoint_count: number | null;
  touchpoint_notes: string | null;
  client_experience_done: boolean | null;
  wins_shared: string | null;
  self_assessment: number | null;
  created_at: string;
}

// Fetch tasks assigned to a specific member (today + overdue + not completed)
export function useMemberTasks(memberId?: string) {
  return useQuery({
    queryKey: ['member-daily-tasks', memberId],
    queryFn: async () => {
      if (!memberId) return [];

      // Get task IDs assigned to this member
      const { data: assignments, error: assignErr } = await supabase
        .from('task_assignees')
        .select('task_id')
        .eq('member_id', memberId);

      if (assignErr) throw assignErr;
      if (!assignments || assignments.length === 0) return [];

      const taskIds = assignments.map((a: any) => a.task_id);

      // Fetch those tasks that are not completed
      const { data: tasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (taskErr) throw taskErr;
      return (tasks || []) as Task[];
    },
    enabled: !!memberId,
  });
}

// Fetch today's report for a member
export function useTodayReport(memberId?: string, reportType?: 'sod' | 'eod') {
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['daily-report-today', memberId, reportType, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('member_id', memberId!)
        .eq('report_date', today)
        .eq('report_type', reportType!)
        .maybeSingle();

      if (error) throw error;
      return data as DailyReport | null;
    },
    enabled: !!memberId && !!reportType,
  });
}

// Fetch report history for a member
export function useReportHistory(memberId?: string) {
  return useQuery({
    queryKey: ['daily-report-history', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('member_id', memberId!)
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as DailyReport[];
    },
    enabled: !!memberId,
  });
}

// Submit a daily report (upsert by member_id + report_date + report_type)
export function useSubmitDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Omit<DailyReport, 'id' | 'created_at'>) => {
      // Check if report already exists for this date/type
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('member_id', report.member_id)
        .eq('report_date', report.report_date)
        .eq('report_type', report.report_type)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('daily_reports')
          .update(report)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert(report)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-today'] });
      queryClient.invalidateQueries({ queryKey: ['daily-report-history'] });
      toast.success('Report submitted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit report: ' + error.message);
    },
  });
}

// Fetch client names for a list of client IDs
export function useClientNames(clientIds: string[]) {
  return useQuery({
    queryKey: ['client-names', clientIds],
    queryFn: async () => {
      if (clientIds.length === 0) return {};
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((c: any) => { map[c.id] = c.name; });
      return map;
    },
    enabled: clientIds.length > 0,
  });
}
