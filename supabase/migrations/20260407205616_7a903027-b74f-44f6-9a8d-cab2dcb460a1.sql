
-- 1. Fix logos-escritorios storage: restrict uploads/updates/deletes to own escritorio path
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;

-- Public read for logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-escritorios');

-- Upload restricted to own escritorio folder
CREATE POLICY "Users can upload logos to own escritorio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
);

-- Update restricted to own escritorio folder
CREATE POLICY "Users can update logos in own escritorio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
);

-- Delete restricted to own escritorio folder
CREATE POLICY "Users can delete logos in own escritorio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
);

-- 2. Fix bug-screenshots storage: scope uploads per user
DROP POLICY IF EXISTS "Authenticated users can upload bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view bug screenshots" ON storage.objects;

CREATE POLICY "Anyone can view bug screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-screenshots');

CREATE POLICY "Users can upload bug screenshots to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bug-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Explicit INSERT deny on user_roles for non-admin/non-service_role
-- RLS is already enabled. Add explicit restrictive INSERT policy.
DROP POLICY IF EXISTS "Only service_role can insert roles" ON public.user_roles;
CREATE POLICY "Only service_role can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- 4. Ensure email_send_log has no authenticated read
-- RLS should already be enabled; add explicit deny SELECT for authenticated
DROP POLICY IF EXISTS "No authenticated read on email_send_log" ON public.email_send_log;
CREATE POLICY "No authenticated read on email_send_log"
ON public.email_send_log FOR SELECT
USING (false);

-- 5. Ensure suppressed_emails has no authenticated read
DROP POLICY IF EXISTS "No authenticated read on suppressed_emails" ON public.suppressed_emails;
CREATE POLICY "No authenticated read on suppressed_emails"
ON public.suppressed_emails FOR SELECT
USING (false);
