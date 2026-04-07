
-- Make bug-screenshots bucket private to prevent unauthenticated access
UPDATE storage.buckets SET public = false WHERE id = 'bug-screenshots';

-- Drop old public SELECT policy
DROP POLICY IF EXISTS "Anyone can view bug screenshots" ON storage.objects;

-- Add scoped SELECT: reporters can view their own screenshots, admins can view all
CREATE POLICY "Users can view own bug screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all bug screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug-screenshots'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
