
CREATE TABLE public.client_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  meta_ad_account_id text,
  meta_access_token text,
  daily_budget numeric DEFAULT 0,
  status text DEFAULT 'active',
  promo_url text,
  campaign_name text,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access client_properties"
  ON public.client_properties FOR ALL TO public
  USING (true) WITH CHECK (true);
