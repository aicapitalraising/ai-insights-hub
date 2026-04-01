ALTER TABLE public.agency_settings 
ADD COLUMN IF NOT EXISTS slack_dm_user_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS agent_notification_slack_dm boolean DEFAULT true;