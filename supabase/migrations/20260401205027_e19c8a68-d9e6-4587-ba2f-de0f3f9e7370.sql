
INSERT INTO storage.buckets (id, name, public) VALUES ('logos-escritorios', 'logos-escritorios', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-escritorios');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos-escritorios');

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos-escritorios');

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos-escritorios');
