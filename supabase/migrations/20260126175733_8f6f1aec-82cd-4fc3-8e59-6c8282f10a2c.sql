-- Create email_parsed_investors table for storing parsed email data
CREATE TABLE public.email_parsed_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email_subject TEXT,
  email_body TEXT,
  email_from TEXT,
  email_received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  parsed_name TEXT,
  parsed_email TEXT,
  parsed_phone TEXT,
  parsed_amount NUMERIC DEFAULT 0,
  parsed_offering TEXT,
  parsed_class TEXT,
  parsed_accredited BOOLEAN,
  raw_parsed_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  funded_investor_id UUID REFERENCES public.funded_investors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_parsed_investors ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_parsed_investors
CREATE POLICY "Public can view email_parsed_investors"
ON public.email_parsed_investors FOR SELECT
USING (true);

CREATE POLICY "Public can insert email_parsed_investors"
ON public.email_parsed_investors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update email_parsed_investors"
ON public.email_parsed_investors FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete email_parsed_investors"
ON public.email_parsed_investors FOR DELETE
USING (true);

-- Add source and approval_status columns to funded_investors
ALTER TABLE public.funded_investors 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'webhook',
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'auto';

-- Add email_parsing_enabled to client_settings
ALTER TABLE public.client_settings
ADD COLUMN IF NOT EXISTS email_parsing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_trusted_domains TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_auto_approve_threshold NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_default_offering TEXT;