
-- 1. Tabela mensagens_chat
CREATE TABLE public.mensagens_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracao_id uuid NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE,
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  remetente_tipo text NOT NULL DEFAULT 'contador',
  remetente_id uuid,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso chat por escritorio" ON public.mensagens_chat
  FOR ALL TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Cliente pode ver suas mensagens" ON public.mensagens_chat
  FOR SELECT TO authenticated
  USING (cliente_id = get_user_cliente_id());

CREATE POLICY "Cliente pode enviar mensagens" ON public.mensagens_chat
  FOR INSERT TO authenticated
  WITH CHECK (cliente_id = get_user_cliente_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;

-- 2. Tabela declaracao_atividades
CREATE TABLE public.declaracao_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracao_id uuid NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text NOT NULL,
  usuario_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.declaracao_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso atividades por escritorio" ON public.declaracao_atividades
  FOR ALL TO authenticated
  USING (declaracao_id IN (SELECT id FROM declaracoes WHERE escritorio_id = get_user_escritorio_id()));

CREATE POLICY "Cliente pode ver atividades" ON public.declaracao_atividades
  FOR SELECT TO authenticated
  USING (declaracao_id IN (SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id()));

-- 3. Colunas whitelabel no escritorios
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#1E3A5F',
  ADD COLUMN IF NOT EXISTS cor_fundo_portal text DEFAULT '#F8FAFC',
  ADD COLUMN IF NOT EXISTS nome_portal text,
  ADD COLUMN IF NOT EXISTS texto_boas_vindas text,
  ADD COLUMN IF NOT EXISTS whitelabel_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS favicon_url text;

-- 4. Colunas de plano no escritorios
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS declaracoes_utilizadas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_limite_mb integer DEFAULT 500,
  ADD COLUMN IF NOT EXISTS usuarios_limite integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS plano_expira_em timestamptz;

-- 5. Tabela malha_fina_consultas
CREATE TABLE public.malha_fina_consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracao_id uuid NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE,
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  ano_base integer NOT NULL,
  status_rfb text NOT NULL DEFAULT 'nao_consultado',
  ultimo_resultado text,
  ultima_consulta timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.malha_fina_consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso malha fina por escritorio" ON public.malha_fina_consultas
  FOR ALL TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE INDEX idx_malha_fina_escritorio_ano ON public.malha_fina_consultas(escritorio_id, ano_base);

-- 6. Trigger para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.registrar_atividade_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.declaracao_atividades (declaracao_id, tipo, descricao)
    VALUES (NEW.id, 'status_change', 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_declaracao_status_change
  AFTER UPDATE ON public.declaracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_atividade_status();
