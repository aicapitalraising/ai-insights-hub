CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  report_date date NOT NULL,
  report_type text NOT NULL DEFAULT 'sod',
  top_priorities jsonb DEFAULT '[]'::jsonb,
  tasks_snapshot jsonb DEFAULT '[]'::jsonb,
  touchpoint_count integer,
  touchpoint_notes text,
  client_experience_done boolean,
  wins_shared text,
  self_assessment integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access daily_reports" ON public.daily_reports FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_daily_reports_member_date ON public.daily_reports (member_id, report_date);