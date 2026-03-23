
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  link_destino text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso notificacoes por escritorio" ON public.notificacoes
  FOR SELECT TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Update notificacoes por escritorio" ON public.notificacoes
  FOR UPDATE TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Qualquer autenticado pode inserir notificacao" ON public.notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
