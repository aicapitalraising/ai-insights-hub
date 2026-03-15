-- Funnel Builder Tables
-- Migrated from aicapitalraising

-- Funnels table (one per client)
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'archived')),
  custom_domain TEXT,
  meta_pixel_id TEXT,
  ghl_webhook_url TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel pages (each step in the funnel)
CREATE TABLE IF NOT EXISTS public.funnel_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('landing', 'quiz', 'booking', 'deck', 'invest', 'onboarding', 'fulfillment', 'kickoff')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'disabled')),
  sort_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('yes_no', 'multiple_choice', 'range_slider', 'dropdown', 'text')),
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  disqualify_if JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz responses
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  session_id TEXT,
  responses JSONB DEFAULT '{}',
  qualified BOOLEAN DEFAULT true,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel bookings
CREATE TABLE IF NOT EXISTS public.funnel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  booked_at TIMESTAMPTZ,
  timezone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'showed', 'no_show')),
  ghl_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel analytics (daily rollup)
CREATE TABLE IF NOT EXISTS public.funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_type TEXT,
  visitors INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funnel_id, date, page_type)
);

-- Onboarding submissions
CREATE TABLE IF NOT EXISTS public.funnel_onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  client_name TEXT,
  company_name TEXT,
  fund_type TEXT,
  raise_goal TEXT,
  timeline TEXT,
  min_investment TEXT,
  website TEXT,
  notes TEXT,
  assets_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Permissive policies (adjust as needed for your auth setup)
CREATE POLICY "Allow all" ON public.funnels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.funnel_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.quiz_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.funnel_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.funnel_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.funnel_onboarding_submissions FOR ALL USING (true) WITH CHECK (true);
