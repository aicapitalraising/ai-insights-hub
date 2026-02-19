
-- Add Stripe billing fields to client_settings
ALTER TABLE public.client_settings
ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_email text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_settings.stripe_customer_id IS 'Stripe Customer ID (cus_xxx) for direct linking';
COMMENT ON COLUMN public.client_settings.stripe_email IS 'Email used to lookup Stripe customer for billing';
