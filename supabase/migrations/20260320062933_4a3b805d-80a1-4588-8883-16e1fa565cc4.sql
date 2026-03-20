
-- Table to map multiple Slack channels to a single client
CREATE TABLE public.slack_channel_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  channel_type TEXT DEFAULT 'general', -- general, tasks, creative, reporting, etc.
  monitor_messages BOOLEAN DEFAULT true,
  auto_create_tasks BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, channel_id)
);

ALTER TABLE public.slack_channel_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access slack_channel_mappings"
  ON public.slack_channel_mappings FOR ALL
  USING (true) WITH CHECK (true);

-- Activity log for all Slack messages
CREATE TABLE public.slack_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  channel_id TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  thread_ts TEXT,
  user_id TEXT,
  user_name TEXT,
  message_text TEXT,
  message_type TEXT DEFAULT 'message', -- message, file_share, task_action, bot_response
  ai_analysis JSONB DEFAULT '{}',
  linked_task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, message_ts)
);

ALTER TABLE public.slack_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access slack_activity_log"
  ON public.slack_activity_log FOR ALL
  USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_slack_activity_client ON public.slack_activity_log(client_id, created_at DESC);
CREATE INDEX idx_slack_channel_mappings_channel ON public.slack_channel_mappings(channel_id);

-- Enable realtime for activity log
ALTER PUBLICATION supabase_realtime ADD TABLE public.slack_activity_log;
