-- Add assigned_user column to leads table for sales rep tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_user TEXT;

-- Add reconnect call columns to daily_metrics
ALTER TABLE public.daily_metrics 
ADD COLUMN IF NOT EXISTS reconnect_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reconnect_showed INTEGER DEFAULT 0;

-- Add reconnect column to calls table
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS is_reconnect BOOLEAN DEFAULT false;