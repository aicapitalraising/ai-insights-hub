-- Recreating remaining schema from old migrations (chunk 0)
-- client_settings, webhook_logs, creatives, csv_import_logs, tasks, etc.

CREATE TABLE public.client_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  cpl_threshold_yellow NUMERIC DEFAULT 50,
  cpl_threshold_red NUMERIC DEFAULT 100,
  cost_per_call_threshold_yellow NUMERIC DEFAULT 100,
  cost_per_call_threshold_red NUMERIC DEFAULT 200,
  cost_per_show_threshold_yellow NUMERIC DEFAULT 150,
  cost_per_show_threshold_red NUMERIC DEFAULT 300,
  cost_per_investor_threshold_yellow NUMERIC DEFAULT 500,
  cost_per_investor_threshold_red NUMERIC DEFAULT 1000,
  cost_of_capital_threshold_yellow NUMERIC DEFAULT 5,
  cost_of_capital_threshold_red NUMERIC DEFAULT 10,
  funded_investor_label TEXT DEFAULT 'Funded Investors',
  webhook_mappings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to client_settings" ON public.client_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public can view client_settings" ON public.client_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can insert client_settings" ON public.client_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update client_settings" ON public.client_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE TRIGGER update_client_settings_updated_at BEFORE UPDATE ON public.client_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  webhook_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_logs_client ON public.webhook_logs(client_id);
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for webhook endpoints" ON public.webhook_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for authenticated users" ON public.webhook_logs FOR SELECT TO authenticated USING (true);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex');
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipeline_value numeric DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.funded_investors ADD COLUMN IF NOT EXISTS commitment_amount numeric DEFAULT 0;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_user TEXT;
ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS reconnect_calls INTEGER DEFAULT 0;
ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS reconnect_showed INTEGER DEFAULT 0;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS is_reconnect BOOLEAN DEFAULT false;

DROP POLICY IF EXISTS "Public can view calls" ON public.calls;
CREATE POLICY "Public can view calls" ON public.calls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can insert daily_metrics" ON public.daily_metrics;
CREATE POLICY "Public can insert daily_metrics" ON public.daily_metrics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update daily_metrics" ON public.daily_metrics;
CREATE POLICY "Public can update daily_metrics" ON public.daily_metrics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete daily_metrics" ON public.daily_metrics FOR DELETE USING (true);
CREATE POLICY "Public can delete leads" ON public.leads FOR DELETE USING (true);
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete calls" ON public.calls FOR DELETE USING (true);
CREATE POLICY "Public can insert calls" ON public.calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete funded_investors" ON public.funded_investors FOR DELETE USING (true);
CREATE POLICY "Public can insert funded_investors" ON public.funded_investors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update leads" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can update calls" ON public.calls FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can update funded_investors" ON public.funded_investors FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  file_url TEXT,
  headline TEXT,
  body_copy TEXT,
  cta_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view creatives" ON public.creatives FOR SELECT USING (true);
CREATE POLICY "Public can insert creatives" ON public.creatives FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update creatives" ON public.creatives FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete creatives" ON public.creatives FOR DELETE USING (true);
CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON public.creatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO storage.buckets (id, name, public) VALUES ('creatives', 'creatives', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT DO NOTHING;

CREATE TABLE public.csv_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.csv_import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view csv_import_logs" ON public.csv_import_logs FOR SELECT USING (true);
CREATE POLICY "Public can insert csv_import_logs" ON public.csv_import_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update csv_import_logs" ON public.csv_import_logs FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update tasks" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete tasks" ON public.tasks FOR DELETE USING (true);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS business_manager_url TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS brand_colors TEXT[];
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS brand_fonts TEXT[];

CREATE TABLE public.client_custom_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'link',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.client_custom_tabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view client_custom_tabs" ON public.client_custom_tabs FOR SELECT USING (true);
CREATE POLICY "Public can insert client_custom_tabs" ON public.client_custom_tabs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete client_custom_tabs" ON public.client_custom_tabs FOR DELETE USING (true);

CREATE TABLE public.client_voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.client_voice_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view voice_notes" ON public.client_voice_notes FOR SELECT USING (true);
CREATE POLICY "Public can insert voice_notes" ON public.client_voice_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete voice_notes" ON public.client_voice_notes FOR DELETE USING (true);