-- Create creatives table for creative approval workflow
CREATE TABLE public.creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'copy'
  file_url TEXT,
  headline TEXT,
  body_copy TEXT,
  cta_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'revisions', 'rejected'
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

-- Policies for creatives
CREATE POLICY "Public can view creatives" 
ON public.creatives 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert creatives" 
ON public.creatives 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update creatives" 
ON public.creatives 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete creatives" 
ON public.creatives 
FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_creatives_updated_at
BEFORE UPDATE ON public.creatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for creative files
INSERT INTO storage.buckets (id, name, public) VALUES ('creatives', 'creatives', true);

-- Storage policies for creatives bucket
CREATE POLICY "Anyone can view creative files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'creatives');

CREATE POLICY "Anyone can upload creative files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'creatives');

CREATE POLICY "Anyone can update creative files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'creatives');

CREATE POLICY "Anyone can delete creative files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'creatives');