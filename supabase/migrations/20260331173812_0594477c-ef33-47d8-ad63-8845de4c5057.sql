
-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL,
  pagina_url text,
  screenshots jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'aberto',
  prioridade text NOT NULL DEFAULT 'media',
  resposta_admin text,
  reportado_por uuid NOT NULL,
  reportado_por_nome text,
  reportado_por_email text,
  escritorio_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Contadores can create bug reports
CREATE POLICY "Contador pode criar bug report"
ON public.bug_reports FOR INSERT TO authenticated
WITH CHECK (reportado_por = auth.uid());

-- Contadores can view their own reports
CREATE POLICY "Contador pode ver seus bug reports"
ON public.bug_reports FOR SELECT TO authenticated
USING (reportado_por = auth.uid());

-- Admin can view all reports
CREATE POLICY "Admin pode ver todos bug reports"
ON public.bug_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update all reports
CREATE POLICY "Admin pode atualizar bug reports"
ON public.bug_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role full access bug_reports"
ON public.bug_reports FOR ALL TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', true);

-- Allow authenticated users to upload screenshots
CREATE POLICY "Usuarios podem fazer upload de screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bug-screenshots');

-- Anyone can view screenshots (public bucket)
CREATE POLICY "Screenshots publicos para leitura"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bug-screenshots');
