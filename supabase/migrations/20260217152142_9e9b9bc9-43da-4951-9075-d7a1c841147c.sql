
INSERT INTO storage.buckets (id, name, public) VALUES ('audiobook-covers', 'audiobook-covers', true);

CREATE POLICY "Public read audiobook covers" ON storage.objects FOR SELECT USING (bucket_id = 'audiobook-covers');
CREATE POLICY "Authenticated upload audiobook covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audiobook-covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update audiobook covers" ON storage.objects FOR UPDATE USING (bucket_id = 'audiobook-covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete audiobook covers" ON storage.objects FOR DELETE USING (bucket_id = 'audiobook-covers' AND auth.uid() IS NOT NULL);
