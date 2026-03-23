ALTER TABLE public.client_properties 
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS elise_connected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS units_count integer;