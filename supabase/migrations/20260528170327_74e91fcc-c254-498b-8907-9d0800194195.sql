CREATE TABLE IF NOT EXISTS public.ocr_jobs (
  path text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('processing','ready','failed','skipped_too_large')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ocr_jobs TO service_role;

ALTER TABLE public.ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocr_jobs_service_only_select" ON public.ocr_jobs FOR SELECT USING (false);
CREATE POLICY "ocr_jobs_service_only_insert" ON public.ocr_jobs FOR INSERT WITH CHECK (false);
CREATE POLICY "ocr_jobs_service_only_update" ON public.ocr_jobs FOR UPDATE USING (false);