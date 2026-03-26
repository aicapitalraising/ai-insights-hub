
-- Create client_offers table
CREATE TABLE public.client_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  file_type text,
  file_size_bytes bigint,
  offer_type text NOT NULL DEFAULT 'file',
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_offers ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Public full access client_offers" ON public.client_offers FOR ALL TO public USING (true) WITH CHECK (true);

-- Add offer_id to client_assets
ALTER TABLE public.client_assets ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.client_offers(id) ON DELETE SET NULL;
