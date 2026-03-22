
-- Client intake data from onboarding form
CREATE TABLE public.client_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  fund_type TEXT,
  raise_amount TEXT,
  timeline TEXT,
  min_investment TEXT,
  target_investor TEXT,
  pitch_deck_link TEXT,
  pitch_deck_path TEXT,
  budget_mode TEXT DEFAULT 'monthly',
  budget_amount TEXT,
  investor_list_path TEXT,
  brand_notes TEXT,
  additional_notes TEXT,
  kickoff_date TEXT,
  kickoff_time TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.client_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access client_intake" ON public.client_intake FOR ALL TO public USING (true) WITH CHECK (true);

-- Client assets for AI-generated content
CREATE TABLE public.client_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access client_assets" ON public.client_assets FOR ALL TO public USING (true) WITH CHECK (true);
