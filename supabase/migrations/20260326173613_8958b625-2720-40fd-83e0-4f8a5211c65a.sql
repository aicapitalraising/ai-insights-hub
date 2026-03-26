
-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'static_batch',
  description TEXT,
  offer_description TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Script',
  framework TEXT,
  duration_seconds INTEGER,
  content TEXT NOT NULL DEFAULT '',
  hook TEXT,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_id TEXT,
  type TEXT NOT NULL DEFAULT 'image',
  public_url TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (matching the rest of the app's pattern)
CREATE POLICY "Public full access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access scripts" ON public.scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
