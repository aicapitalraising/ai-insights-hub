
-- Create sync_accuracy_log table for tracking daily accuracy checks
CREATE TABLE public.sync_accuracy_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  check_date date NOT NULL,
  metric_type text NOT NULL,
  expected_count integer NOT NULL DEFAULT 0,
  actual_count integer NOT NULL DEFAULT 0,
  discrepancy integer NOT NULL DEFAULT 0,
  auto_fixed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_sync_accuracy_log_client_date ON public.sync_accuracy_log(client_id, check_date);
CREATE INDEX idx_sync_accuracy_log_created ON public.sync_accuracy_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.sync_accuracy_log ENABLE ROW LEVEL SECURITY;

-- Public read access (agency dashboard needs to read this)
CREATE POLICY "Public can view sync_accuracy_log"
  ON public.sync_accuracy_log FOR SELECT
  USING (true);

-- Service role full access for edge functions
CREATE POLICY "Service role full access to sync_accuracy_log"
  ON public.sync_accuracy_log FOR ALL
  USING (true)
  WITH CHECK (true);
