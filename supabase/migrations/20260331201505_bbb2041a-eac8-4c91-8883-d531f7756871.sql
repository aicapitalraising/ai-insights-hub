
CREATE POLICY "creatives_upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'creatives');
CREATE POLICY "creatives_update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'creatives') WITH CHECK (bucket_id = 'creatives');
CREATE POLICY "creatives_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'creatives');
CREATE POLICY "creatives_delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'creatives');
