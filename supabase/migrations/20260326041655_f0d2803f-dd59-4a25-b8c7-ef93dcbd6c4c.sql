CREATE TABLE IF NOT EXISTS public.ad_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prompt_template TEXT NOT NULL DEFAULT '',
  example_image_url TEXT,
  reference_images TEXT[] DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ad_styles" ON public.ad_styles FOR ALL USING (true) WITH CHECK (true);