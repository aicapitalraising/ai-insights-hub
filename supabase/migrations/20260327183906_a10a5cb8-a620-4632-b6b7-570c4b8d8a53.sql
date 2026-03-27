-- Create task-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('task-files', 'task-files', true, 10737418240)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for task files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-files');

-- Allow authenticated uploads
CREATE POLICY "Authenticated upload for task files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-files');

-- Allow authenticated updates
CREATE POLICY "Authenticated update for task files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task-files');

-- Allow authenticated deletes
CREATE POLICY "Authenticated delete for task files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-files');

-- Also allow anon uploads (for public client portal)
CREATE POLICY "Anon upload for task files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Anon update for task files"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'task-files');