ALTER TABLE public.client_settings
  ADD COLUMN IF NOT EXISTS mrr numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ad_spend_fee_threshold numeric DEFAULT 30000,
  ADD COLUMN IF NOT EXISTS ad_spend_fee_percent numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS monthly_ad_spend_target numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_ad_spend_target numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_raise_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_lead_pipeline_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_link_password text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metric_labels jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS committed_stage_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_stage_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slack_review_channel_id text DEFAULT NULL;