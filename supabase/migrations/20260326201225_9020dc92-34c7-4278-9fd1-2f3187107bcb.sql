
-- Tabela de permissões disponíveis
CREATE TABLE public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  categoria TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver permissões
CREATE POLICY "Todos podem ver permissoes" ON public.permissoes
  FOR SELECT TO authenticated USING (true);

-- Apenas service_role gerencia
CREATE POLICY "Service role manages permissoes" ON public.permissoes
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Permissões base
INSERT INTO public.permissoes (nome, descricao, categoria) VALUES
  ('clientes.view', 'Visualizar clientes', 'clientes'),
  ('clientes.create', 'Criar clientes', 'clientes'),
  ('clientes.edit', 'Editar clientes', 'clientes'),
  ('clientes.delete', 'Deletar clientes', 'clientes'),
  ('declaracoes.view', 'Visualizar declarações', 'declaracoes'),
  ('declaracoes.create', 'Criar declarações', 'declaracoes'),
  ('declaracoes.edit', 'Editar declarações', 'declaracoes'),
  ('declaracoes.delete', 'Deletar declarações', 'declaracoes'),
  ('cobrancas.view', 'Visualizar cobranças', 'cobrancas'),
  ('cobrancas.create', 'Criar cobranças', 'cobrancas'),
  ('cobrancas.edit', 'Editar cobranças', 'cobrancas'),
  ('cobrancas.delete', 'Deletar cobranças', 'cobrancas'),
  ('configuracoes.view', 'Ver configurações', 'configuracoes'),
  ('configuracoes.edit', 'Editar configurações', 'configuracoes');

-- Tabela de permissões por usuário
CREATE TABLE public.usuario_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permissao_id, escritorio_id)
);

CREATE INDEX idx_usuario_permissoes_user ON public.usuario_permissoes(user_id);
CREATE INDEX idx_usuario_permissoes_escritorio ON public.usuario_permissoes(escritorio_id);

ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Donos podem gerenciar permissões do escritório
CREATE POLICY "Dono gerencia permissoes" ON public.usuario_permissoes
  FOR ALL TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role))
  WITH CHECK (escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role));

-- Usuários podem ver suas próprias permissões
CREATE POLICY "Usuario ve suas permissoes" ON public.usuario_permissoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role manages usuario_permissoes" ON public.usuario_permissoes
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Função helper para verificar permissão
CREATE OR REPLACE FUNCTION public.user_tem_permissao(permissao_nome TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escritorio_id UUID;
BEGIN
  v_escritorio_id := get_user_escritorio_id();
  
  IF v_escritorio_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Dono tem todas as permissões
  IF has_role(auth.uid(), 'dono'::app_role) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar permissão específica
  RETURN EXISTS(
    SELECT 1 
    FROM usuario_permissoes up
    JOIN permissoes p ON p.id = up.permissao_id
    WHERE up.user_id = auth.uid()
    AND up.escritorio_id = v_escritorio_id
    AND p.nome = permissao_nome
  );
END;
$$;
