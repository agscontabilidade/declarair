
-- Adicionar auth_user_id à tabela clientes para link seguro
ALTER TABLE public.clientes ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX idx_clientes_auth_user ON public.clientes(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Função security definer para obter cliente_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()
$$;

-- Função para verificar se é cliente
CREATE OR REPLACE FUNCTION public.is_cliente()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.clientes WHERE auth_user_id = auth.uid())
$$;

-- Dropar políticas inseguras que usam user_metadata
DROP POLICY IF EXISTS "Cliente pode ver seus dados" ON public.clientes;
DROP POLICY IF EXISTS "Cliente pode ver suas declaracoes" ON public.declaracoes;
DROP POLICY IF EXISTS "Cliente pode ver seu checklist" ON public.checklist_documentos;
DROP POLICY IF EXISTS "Cliente pode atualizar seu checklist" ON public.checklist_documentos;
DROP POLICY IF EXISTS "Cliente pode ver seu formulario" ON public.formulario_ir;
DROP POLICY IF EXISTS "Cliente pode inserir seu formulario" ON public.formulario_ir;
DROP POLICY IF EXISTS "Cliente pode atualizar seu formulario" ON public.formulario_ir;
DROP POLICY IF EXISTS "Cliente pode ver suas cobrancas" ON public.cobrancas;

-- Recriar com security definer functions
CREATE POLICY "Cliente pode ver seus dados"
  ON public.clientes FOR SELECT TO authenticated
  USING (id = public.get_user_cliente_id());

CREATE POLICY "Cliente pode ver suas declaracoes"
  ON public.declaracoes FOR SELECT TO authenticated
  USING (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Cliente pode ver seu checklist"
  ON public.checklist_documentos FOR SELECT TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE cliente_id = public.get_user_cliente_id()));

CREATE POLICY "Cliente pode atualizar seu checklist"
  ON public.checklist_documentos FOR UPDATE TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE cliente_id = public.get_user_cliente_id()));

CREATE POLICY "Cliente pode ver seu formulario"
  ON public.formulario_ir FOR SELECT TO authenticated
  USING (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Cliente pode inserir seu formulario"
  ON public.formulario_ir FOR INSERT TO authenticated
  WITH CHECK (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Cliente pode atualizar seu formulario"
  ON public.formulario_ir FOR UPDATE TO authenticated
  USING (cliente_id = public.get_user_cliente_id());

CREATE POLICY "Cliente pode ver suas cobrancas"
  ON public.cobrancas FOR SELECT TO authenticated
  USING (cliente_id = public.get_user_cliente_id());

-- Corrigir política permissiva de escritorios INSERT
DROP POLICY IF EXISTS "Permitir insert ao criar conta" ON public.escritorios;
-- Novo usuário pode criar escritório somente se não tiver um ainda
CREATE POLICY "Permitir insert ao criar conta"
  ON public.escritorios FOR INSERT TO authenticated
  WITH CHECK (public.get_user_escritorio_id() IS NULL);

-- Atualizar limpar_token_convite para setar auth_user_id
CREATE OR REPLACE FUNCTION public.limpar_token_convite(_cliente_id UUID, _auth_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.clientes
  SET token_convite = NULL,
      token_convite_expira_em = NULL,
      status_onboarding = 'concluido',
      auth_user_id = _auth_user_id
  WHERE id = _cliente_id
$$;
