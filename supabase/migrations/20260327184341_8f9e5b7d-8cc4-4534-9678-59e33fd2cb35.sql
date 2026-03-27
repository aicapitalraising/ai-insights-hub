-- Enable client-side uploads to the public creatives bucket used by the bulk uploader
CREATE POLICY "Public upload access for creatives"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'creatives');

CREATE POLICY "Public update access for creatives"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'creatives')
WITH CHECK (bucket_id = 'creatives');