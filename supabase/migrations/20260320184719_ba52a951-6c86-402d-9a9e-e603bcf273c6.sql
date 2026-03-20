
-- ===========================================
-- DeclaraIR - Migração Completa (sem storage)
-- ===========================================

-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('dono', 'colaborador');

-- 1. Escritórios
CREATE TABLE public.escritorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  logo_url TEXT,
  email TEXT,
  telefone TEXT,
  cnpj TEXT,
  plano TEXT DEFAULT 'gratuito',
  limite_declaracoes INT DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Usuários
CREATE TABLE public.usuarios (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'colaborador' CHECK (papel IN ('dono', 'colaborador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  contador_responsavel_id UUID REFERENCES public.usuarios(id),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  status_onboarding TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status_onboarding IN ('nao_iniciado', 'convite_enviado', 'em_andamento', 'concluido')),
  token_convite UUID DEFAULT gen_random_uuid(),
  token_convite_expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Declarações
CREATE TABLE public.declaracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  contador_id UUID REFERENCES public.usuarios(id),
  ano_base INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_documentos' CHECK (status IN ('aguardando_documentos', 'documentacao_recebida', 'declaracao_pronta', 'transmitida')),
  tipo_resultado TEXT CHECK (tipo_resultado IN ('restituicao', 'pagamento', 'nenhum')),
  valor_resultado NUMERIC(12,2),
  numero_recibo TEXT,
  data_transmissao TIMESTAMPTZ,
  observacoes_internas TEXT,
  ultima_atualizacao_status TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Checklist de Documentos
CREATE TABLE public.checklist_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  declaracao_id UUID NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE,
  nome_documento TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outros',
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'dispensado')),
  arquivo_url TEXT,
  arquivo_nome TEXT,
  data_recebimento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Formulário IR
CREATE TABLE public.formulario_ir (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  declaracao_id UUID NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE UNIQUE,
  ano_base INT NOT NULL,
  estado_civil TEXT,
  conjuge_nome TEXT,
  conjuge_cpf TEXT,
  dependentes JSONB NOT NULL DEFAULT '[]'::jsonb,
  rendimentos_emprego JSONB NOT NULL DEFAULT '[]'::jsonb,
  rendimentos_autonomo JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendimentos_aluguel JSONB NOT NULL DEFAULT '[]'::jsonb,
  outros_rendimentos JSONB NOT NULL DEFAULT '{}'::jsonb,
  bens_direitos JSONB NOT NULL DEFAULT '[]'::jsonb,
  dividas_onus JSONB NOT NULL DEFAULT '[]'::jsonb,
  despesas_medicas JSONB NOT NULL DEFAULT '[]'::jsonb,
  despesas_educacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  previdencia_privada JSONB NOT NULL DEFAULT '{}'::jsonb,
  informacoes_adicionais TEXT,
  status_preenchimento TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status_preenchimento IN ('nao_iniciado', 'em_andamento', 'concluido')),
  ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Cobranças
CREATE TABLE public.cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  declaracao_id UUID REFERENCES public.declaracoes(id),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Templates de Mensagem
CREATE TABLE public.templates_mensagem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'whatsapp' CHECK (canal IN ('email', 'whatsapp')),
  assunto TEXT,
  corpo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Mensagens Enviadas
CREATE TABLE public.mensagens_enviadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates_mensagem(id),
  canal TEXT NOT NULL,
  conteudo_final TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado',
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- FUNÇÕES SECURITY DEFINER
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_user_escritorio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.buscar_cliente_por_token(_token UUID)
RETURNS TABLE(id UUID, nome TEXT, email TEXT, escritorio_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome, c.email, c.escritorio_id
  FROM public.clientes c
  WHERE c.token_convite = _token
    AND c.token_convite_expira_em > now()
    AND c.status_onboarding != 'concluido'
$$;

CREATE OR REPLACE FUNCTION public.limpar_token_convite(_cliente_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.clientes
  SET token_convite = NULL,
      token_convite_expira_em = NULL,
      status_onboarding = 'concluido'
  WHERE id = _cliente_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_papel()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT papel FROM public.usuarios WHERE id = auth.uid()
$$;

-- ===========================================
-- RLS
-- ===========================================

ALTER TABLE public.escritorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declaracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulario_ir ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_enviadas ENABLE ROW LEVEL SECURITY;

-- ESCRITORIOS
CREATE POLICY "Usuarios podem ver seu escritorio"
  ON public.escritorios FOR SELECT TO authenticated
  USING (id = public.get_user_escritorio_id());

CREATE POLICY "Donos podem atualizar seu escritorio"
  ON public.escritorios FOR UPDATE TO authenticated
  USING (id = public.get_user_escritorio_id() AND public.get_user_papel() = 'dono');

CREATE POLICY "Permitir insert ao criar conta"
  ON public.escritorios FOR INSERT TO authenticated
  WITH CHECK (true);

-- USUARIOS
CREATE POLICY "Usuarios podem ver colegas do escritorio"
  ON public.usuarios FOR SELECT TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Usuario pode inserir proprio registro"
  ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Donos podem atualizar usuarios"
  ON public.usuarios FOR UPDATE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'));

-- USER_ROLES
CREATE POLICY "Usuarios podem ver suas roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem inserir propria role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- CLIENTES
CREATE POLICY "Acesso clientes por escritorio"
  ON public.clientes FOR SELECT TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Inserir clientes no escritorio"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Atualizar clientes do escritorio"
  ON public.clientes FOR UPDATE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Deletar clientes do escritorio"
  ON public.clientes FOR DELETE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Cliente pode ver seus dados"
  ON public.clientes FOR SELECT TO authenticated
  USING (id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

-- DECLARACOES
CREATE POLICY "Acesso declaracoes por escritorio"
  ON public.declaracoes FOR SELECT TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Inserir declaracoes no escritorio"
  ON public.declaracoes FOR INSERT TO authenticated
  WITH CHECK (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Atualizar declaracoes do escritorio"
  ON public.declaracoes FOR UPDATE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Deletar declaracoes do escritorio"
  ON public.declaracoes FOR DELETE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Cliente pode ver suas declaracoes"
  ON public.declaracoes FOR SELECT TO authenticated
  USING (cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

-- CHECKLIST_DOCUMENTOS
CREATE POLICY "Acesso checklist por escritorio"
  ON public.checklist_documentos FOR SELECT TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Inserir checklist no escritorio"
  ON public.checklist_documentos FOR INSERT TO authenticated
  WITH CHECK (declaracao_id IN (SELECT id FROM public.declaracoes WHERE escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Atualizar checklist do escritorio"
  ON public.checklist_documentos FOR UPDATE TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Deletar checklist do escritorio"
  ON public.checklist_documentos FOR DELETE TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Cliente pode ver seu checklist"
  ON public.checklist_documentos FOR SELECT TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text)));

CREATE POLICY "Cliente pode atualizar seu checklist"
  ON public.checklist_documentos FOR UPDATE TO authenticated
  USING (declaracao_id IN (SELECT id FROM public.declaracoes WHERE cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text)));

-- FORMULARIO_IR
CREATE POLICY "Contador pode ver formularios do escritorio"
  ON public.formulario_ir FOR SELECT TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Cliente pode ver seu formulario"
  ON public.formulario_ir FOR SELECT TO authenticated
  USING (cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

CREATE POLICY "Cliente pode inserir seu formulario"
  ON public.formulario_ir FOR INSERT TO authenticated
  WITH CHECK (cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

CREATE POLICY "Cliente pode atualizar seu formulario"
  ON public.formulario_ir FOR UPDATE TO authenticated
  USING (cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

-- COBRANCAS
CREATE POLICY "Acesso cobrancas por escritorio"
  ON public.cobrancas FOR SELECT TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Inserir cobrancas no escritorio"
  ON public.cobrancas FOR INSERT TO authenticated
  WITH CHECK (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Atualizar cobrancas do escritorio"
  ON public.cobrancas FOR UPDATE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Deletar cobrancas do escritorio"
  ON public.cobrancas FOR DELETE TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Cliente pode ver suas cobrancas"
  ON public.cobrancas FOR SELECT TO authenticated
  USING (cliente_id::text = ((auth.jwt()->'user_metadata'->>'cliente_id')::text));

-- TEMPLATES_MENSAGEM
CREATE POLICY "Acesso templates por escritorio"
  ON public.templates_mensagem FOR ALL TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

-- MENSAGENS_ENVIADAS
CREATE POLICY "Acesso mensagens por escritorio"
  ON public.mensagens_enviadas FOR ALL TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id());

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_usuarios_escritorio ON public.usuarios(escritorio_id);
CREATE INDEX idx_clientes_escritorio ON public.clientes(escritorio_id);
CREATE INDEX idx_clientes_token ON public.clientes(token_convite);
CREATE INDEX idx_declaracoes_escritorio ON public.declaracoes(escritorio_id);
CREATE INDEX idx_declaracoes_cliente ON public.declaracoes(cliente_id);
CREATE INDEX idx_declaracoes_status ON public.declaracoes(status);
CREATE INDEX idx_checklist_declaracao ON public.checklist_documentos(declaracao_id);
CREATE INDEX idx_formulario_declaracao ON public.formulario_ir(declaracao_id);
CREATE INDEX idx_cobrancas_escritorio ON public.cobrancas(escritorio_id);
CREATE INDEX idx_cobrancas_cliente ON public.cobrancas(cliente_id);
CREATE INDEX idx_templates_escritorio ON public.templates_mensagem(escritorio_id);
CREATE INDEX idx_mensagens_escritorio ON public.mensagens_enviadas(escritorio_id);
