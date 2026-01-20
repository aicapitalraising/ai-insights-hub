-- Add platform column to creatives table
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS platform text DEFAULT 'meta';

-- Add business_manager_url to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS business_manager_url text;