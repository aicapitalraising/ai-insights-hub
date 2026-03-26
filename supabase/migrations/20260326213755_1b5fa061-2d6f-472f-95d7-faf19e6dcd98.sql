CREATE TABLE public.pagespeed_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id text NOT NULL,
  strategy text NOT NULL DEFAULT 'mobile',
  url text NOT NULL,
  performance_score numeric,
  metrics jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(step_id, strategy)
);