
-- Table for escritorio integration settings (key-value pairs)
CREATE TABLE public.configuracoes_escritorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  chave text NOT NULL,
  valor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escritorio_id, chave)
);

ALTER TABLE public.configuracoes_escritorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso configuracoes por escritorio" ON public.configuracoes_escritorio
  FOR SELECT TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Inserir configuracoes no escritorio" ON public.configuracoes_escritorio
  FOR INSERT TO authenticated
  WITH CHECK (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono');

CREATE POLICY "Atualizar configuracoes do escritorio" ON public.configuracoes_escritorio
  FOR UPDATE TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono');

CREATE POLICY "Deletar configuracoes do escritorio" ON public.configuracoes_escritorio
  FOR DELETE TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono');

-- Add banking columns to cobrancas
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS pix_qrcode text,
  ADD COLUMN IF NOT EXISTS pix_qrcode_url text,
  ADD COLUMN IF NOT EXISTS boleto_codigo_barras text,
  ADD COLUMN IF NOT EXISTS boleto_linha_digitavel text,
  ADD COLUMN IF NOT EXISTS boleto_pdf_url text,
  ADD COLUMN IF NOT EXISTS cobranca_externa_id text,
  ADD COLUMN IF NOT EXISTS cobranca_externa_status text;
