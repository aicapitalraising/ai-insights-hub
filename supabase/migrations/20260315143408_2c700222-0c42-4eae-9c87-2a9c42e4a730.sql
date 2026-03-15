CREATE TABLE public.ad_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  brief_id uuid REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  script_type text NOT NULL DEFAULT 'video',
  title text NOT NULL,
  hook text,
  body text,
  cta text,
  duration_seconds integer,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view ad_scripts" ON public.ad_scripts FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert ad_scripts" ON public.ad_scripts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update ad_scripts" ON public.ad_scripts FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete ad_scripts" ON public.ad_scripts FOR DELETE TO public USING (true);

COMMENT ON TABLE public.ad_scripts IS 'AI-generated ad scripts for video and static ads';
COMMENT ON COLUMN public.ad_scripts.script_type IS 'video or static';
COMMENT ON COLUMN public.ad_scripts.status IS 'draft, approved, deployed';