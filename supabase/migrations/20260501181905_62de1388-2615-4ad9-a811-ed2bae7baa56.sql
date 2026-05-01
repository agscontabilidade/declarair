-- Create public-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to read from public-assets
CREATE POLICY "Public Assets Read Access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'public-assets');

-- Policy to allow authenticated users to upload to public-assets (optional, but good for management)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public-assets');
