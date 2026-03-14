
-- Expand integration_status check constraint to include sendblue and elevenlabs
ALTER TABLE public.integration_status DROP CONSTRAINT integration_status_integration_name_check;
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_integration_name_check 
  CHECK (integration_name = ANY (ARRAY['meta_ads'::text, 'ghl'::text, 'hubspot'::text, 'meetgeek'::text, 'stripe'::text, 'sendblue'::text, 'elevenlabs'::text]));
