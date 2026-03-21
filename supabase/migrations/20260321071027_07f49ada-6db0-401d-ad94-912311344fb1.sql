
-- Quiz funnels: per-client quiz landing page configuration
CREATE TABLE public.quiz_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Quiz',
  title text NOT NULL DEFAULT 'See If You Qualify',
  subtitle text DEFAULT 'Answer a few quick questions to get started.',
  hero_heading text DEFAULT NULL,
  hero_description text DEFAULT NULL,
  hero_stats jsonb DEFAULT '[]'::jsonb, -- [{value: "22.3%", label: "Projected IRR"}]
  bottom_stats jsonb DEFAULT '[]'::jsonb, -- [{icon: "TrendingUp", value: "$20M", label: "Project Raise"}]
  badge_text text DEFAULT 'Accredited Investors',
  cta_text text DEFAULT 'See If You Qualify',
  brand_name text DEFAULT NULL,
  brand_logo_url text DEFAULT NULL,
  questions jsonb NOT NULL DEFAULT '[
    {"question": "Are you an accredited investor?", "subtext": "(This means you earn $200K+ individually, $300K+ jointly, or have $1M+ in assets, excluding your primary residence.)", "options": ["Yes", "No"]},
    {"question": "What is your ideal investment range?", "subtext": "(Minimum investment is $50,000.)", "options": ["$50,000 - $100,000", "$100,000 - $250,000", "$250,000 - $500,000", "$500,000 - $1,000,000", "$1,000,000+"]}
  ]'::jsonb,
  collect_contact boolean DEFAULT true,
  show_calendar boolean DEFAULT true,
  calendar_url text DEFAULT NULL,
  thank_you_heading text DEFAULT 'You''re All Set!',
  thank_you_message text DEFAULT 'Our team will be in touch shortly with details.',
  disclaimer_text text DEFAULT 'All investments involve risk, including the potential loss of principal.',
  is_active boolean DEFAULT true,
  slug text UNIQUE DEFAULT NULL,
  meta_pixel_id text DEFAULT NULL,
  primary_color text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, name)
);

-- Quiz submissions: track each user going through the quiz
CREATE TABLE public.quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_funnel_id uuid NOT NULL REFERENCES public.quiz_funnels(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}'::jsonb,
  first_name text DEFAULT NULL,
  last_name text DEFAULT NULL,
  email text DEFAULT NULL,
  phone text DEFAULT NULL,
  booking_date timestamptz DEFAULT NULL,
  booking_time text DEFAULT NULL,
  step_reached integer DEFAULT 0,
  completed boolean DEFAULT false,
  utm_source text DEFAULT NULL,
  utm_medium text DEFAULT NULL,
  utm_campaign text DEFAULT NULL,
  utm_content text DEFAULT NULL,
  utm_term text DEFAULT NULL,
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Quiz funnels policies
CREATE POLICY "Public can view active quiz funnels" ON public.quiz_funnels
  FOR SELECT USING (true);

CREATE POLICY "Service role full access quiz_funnels" ON public.quiz_funnels
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Quiz submissions policies (public can insert for lead capture)
CREATE POLICY "Public can insert quiz submissions" ON public.quiz_submissions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can view quiz submissions" ON public.quiz_submissions
  FOR SELECT TO public USING (true);

CREATE POLICY "Public can update quiz submissions" ON public.quiz_submissions
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_quiz_funnels_client_id ON public.quiz_funnels(client_id);
CREATE INDEX idx_quiz_funnels_slug ON public.quiz_funnels(slug);
CREATE INDEX idx_quiz_submissions_quiz_funnel_id ON public.quiz_submissions(quiz_funnel_id);
CREATE INDEX idx_quiz_submissions_client_id ON public.quiz_submissions(client_id);
CREATE INDEX idx_quiz_submissions_created_at ON public.quiz_submissions(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_funnels_updated_at
  BEFORE UPDATE ON public.quiz_funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
