
-- Agents table
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '🤖',
  prompt_template text NOT NULL DEFAULT '',
  schedule_cron text DEFAULT '0 6 * * *',
  schedule_timezone text DEFAULT 'America/Los_Angeles',
  model text DEFAULT 'google/gemini-2.5-pro',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  connectors jsonb DEFAULT '["database"]'::jsonb,
  enabled boolean DEFAULT false,
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access agents" ON public.agents FOR ALL TO public USING (true) WITH CHECK (true);

-- Agent runs table
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  input_summary text,
  output_summary text,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  error text,
  tokens_used integer DEFAULT 0
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access agent_runs" ON public.agent_runs FOR ALL TO public USING (true) WITH CHECK (true);
