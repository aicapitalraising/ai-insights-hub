
ALTER TABLE public.creatives 
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS trigger_campaign_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_performance_score numeric DEFAULT NULL;
