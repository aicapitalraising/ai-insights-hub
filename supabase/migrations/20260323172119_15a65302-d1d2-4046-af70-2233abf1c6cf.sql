
-- Create avatars table
CREATE TABLE public.avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  gender TEXT,
  age_range TEXT,
  ethnicity TEXT,
  style TEXT DEFAULT 'ugc',
  image_url TEXT NOT NULL,
  is_stock BOOLEAN NOT NULL DEFAULT false,
  elevenlabs_voice_id TEXT,
  looks_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create avatar_looks table
CREATE TABLE public.avatar_looks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  angle TEXT,
  background TEXT,
  outfit TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS for now (no auth in this app)
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_looks ENABLE ROW LEVEL SECURITY;

-- Allow all access (no auth)
CREATE POLICY "Allow all access to avatars" ON public.avatars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to avatar_looks" ON public.avatar_looks FOR ALL USING (true) WITH CHECK (true);

-- Add storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Allow public access to avatars bucket" ON storage.objects FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
