-- 1.1: Create sync_runs table for structured sync tracking
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  sync_type text NOT NULL,
  mode text,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_errored integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sync_runs"
  ON public.sync_runs FOR SELECT TO public
  USING (true);

CREATE POLICY "Service role full access sync_runs"
  ON public.sync_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_sync_runs_client_status ON public.sync_runs (client_id, status);
CREATE INDEX idx_sync_runs_started_at ON public.sync_runs (started_at DESC);

-- Enable realtime on clients table for sync status subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

-- Add FK from pending_meeting_tasks to agency_meetings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pending_meeting_tasks_meeting_id_fkey'
  ) THEN
    ALTER TABLE public.pending_meeting_tasks
      ADD CONSTRAINT pending_meeting_tasks_meeting_id_fkey
      FOREIGN KEY (meeting_id) REFERENCES public.agency_meetings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RPC: get_client_source_metrics
CREATE OR REPLACE FUNCTION public.get_client_source_metrics(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  client_id uuid,
  total_leads bigint,
  spam_leads bigint,
  total_calls bigint,
  showed_calls bigint,
  reconnect_calls bigint,
  reconnect_showed bigint,
  funded_count bigint,
  funded_dollars numeric,
  commitment_dollars numeric,
  avg_time_to_fund numeric,
  avg_calls_to_fund numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS client_id,
    COALESCE((
      SELECT COUNT(*) FROM public.leads l
      WHERE l.client_id = c.id
        AND (p_start_date IS NULL OR l.created_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR l.created_at < (p_end_date + 1)::timestamptz)
        AND (l.is_spam IS NULL OR l.is_spam = false)
    ), 0)::bigint AS total_leads,
    COALESCE((
      SELECT COUNT(*) FROM public.leads l
      WHERE l.client_id = c.id
        AND (p_start_date IS NULL OR l.created_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR l.created_at < (p_end_date + 1)::timestamptz)
        AND l.is_spam = true
    ), 0)::bigint AS spam_leads,
    COALESCE((
      SELECT COUNT(*) FROM public.calls ca
      WHERE ca.client_id = c.id
        AND (ca.is_reconnect IS NULL OR ca.is_reconnect = false)
        AND (p_start_date IS NULL OR COALESCE(ca.booked_at, ca.created_at) >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR COALESCE(ca.booked_at, ca.created_at) < (p_end_date + 1)::timestamptz)
    ), 0)::bigint AS total_calls,
    COALESCE((
      SELECT COUNT(*) FROM public.calls ca
      WHERE ca.client_id = c.id
        AND ca.showed = true
        AND (ca.is_reconnect IS NULL OR ca.is_reconnect = false)
        AND (p_start_date IS NULL OR COALESCE(ca.scheduled_at, ca.booked_at, ca.created_at) >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR COALESCE(ca.scheduled_at, ca.booked_at, ca.created_at) < (p_end_date + 1)::timestamptz)
    ), 0)::bigint AS showed_calls,
    COALESCE((
      SELECT COUNT(*) FROM public.calls ca
      WHERE ca.client_id = c.id
        AND ca.is_reconnect = true
        AND (p_start_date IS NULL OR COALESCE(ca.booked_at, ca.created_at) >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR COALESCE(ca.booked_at, ca.created_at) < (p_end_date + 1)::timestamptz)
    ), 0)::bigint AS reconnect_calls,
    COALESCE((
      SELECT COUNT(*) FROM public.calls ca
      WHERE ca.client_id = c.id
        AND ca.is_reconnect = true
        AND ca.showed = true
        AND (p_start_date IS NULL OR COALESCE(ca.scheduled_at, ca.booked_at, ca.created_at) >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR COALESCE(ca.scheduled_at, ca.booked_at, ca.created_at) < (p_end_date + 1)::timestamptz)
    ), 0)::bigint AS reconnect_showed,
    COALESCE((
      SELECT COUNT(*) FROM public.funded_investors fi
      WHERE fi.client_id = c.id
        AND (p_start_date IS NULL OR fi.funded_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR fi.funded_at < (p_end_date + 1)::timestamptz)
    ), 0)::bigint AS funded_count,
    COALESCE((
      SELECT SUM(fi.funded_amount) FROM public.funded_investors fi
      WHERE fi.client_id = c.id
        AND (p_start_date IS NULL OR fi.funded_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR fi.funded_at < (p_end_date + 1)::timestamptz)
    ), 0)::numeric AS funded_dollars,
    COALESCE((
      SELECT SUM(dm.commitment_dollars) FROM public.daily_metrics dm
      WHERE dm.client_id = c.id
        AND (p_start_date IS NULL OR dm.date >= p_start_date)
        AND (p_end_date IS NULL OR dm.date <= p_end_date)
    ), 0)::numeric AS commitment_dollars,
    COALESCE((
      SELECT AVG(fi.time_to_fund_days)::numeric FROM public.funded_investors fi
      WHERE fi.client_id = c.id
        AND fi.time_to_fund_days IS NOT NULL
        AND (p_start_date IS NULL OR fi.funded_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR fi.funded_at < (p_end_date + 1)::timestamptz)
    ), 0)::numeric AS avg_time_to_fund,
    COALESCE((
      SELECT AVG(fi.calls_to_fund)::numeric FROM public.funded_investors fi
      WHERE fi.client_id = c.id
        AND fi.calls_to_fund IS NOT NULL
        AND (p_start_date IS NULL OR fi.funded_at >= p_start_date::timestamptz)
        AND (p_end_date IS NULL OR fi.funded_at < (p_end_date + 1)::timestamptz)
    ), 0)::numeric AS avg_calls_to_fund
  FROM public.clients c
  WHERE c.status IN ('active', 'onboarding');
END;
$$;