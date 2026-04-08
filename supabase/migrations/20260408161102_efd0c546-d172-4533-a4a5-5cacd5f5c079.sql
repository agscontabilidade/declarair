-- ============================================
-- 1. Tabela separada para notas internas
-- ============================================
CREATE TABLE IF NOT EXISTS public.declaracao_notas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracao_id UUID NOT NULL UNIQUE REFERENCES public.declaracoes(id) ON DELETE CASCADE,
  escritorio_id UUID NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.declaracao_notas_internas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio pode ver notas internas"
ON public.declaracao_notas_internas FOR SELECT TO authenticated
USING (escritorio_id = public.get_user_escritorio_id() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Escritorio pode inserir notas internas"
ON public.declaracao_notas_internas FOR INSERT TO authenticated
WITH CHECK (escritorio_id = public.get_user_escritorio_id() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Escritorio pode atualizar notas internas"
ON public.declaracao_notas_internas FOR UPDATE TO authenticated
USING (escritorio_id = public.get_user_escritorio_id() OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (escritorio_id = public.get_user_escritorio_id() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Escritorio pode deletar notas internas"
ON public.declaracao_notas_internas FOR DELETE TO authenticated
USING (escritorio_id = public.get_user_escritorio_id() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_declaracao_nota_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS declaracao_notas_internas_set_updated_at ON public.declaracao_notas_internas;
CREATE TRIGGER declaracao_notas_internas_set_updated_at
BEFORE UPDATE ON public.declaracao_notas_internas
FOR EACH ROW EXECUTE FUNCTION public.set_declaracao_nota_updated_at();

-- Trigger to redirect observacoes_internas writes to the new table
CREATE OR REPLACE FUNCTION public.redirect_observacoes_internas()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.observacoes_internas IS NOT NULL AND btrim(NEW.observacoes_internas) <> '' THEN
    INSERT INTO public.declaracao_notas_internas (declaracao_id, escritorio_id, conteudo)
    VALUES (NEW.id, NEW.escritorio_id, NEW.observacoes_internas)
    ON CONFLICT (declaracao_id) DO UPDATE SET conteudo = EXCLUDED.conteudo, escritorio_id = EXCLUDED.escritorio_id, updated_at = now();
  END IF;
  NEW.observacoes_internas = NULL;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS declaracoes_redirect_observacoes_internas ON public.declaracoes;
CREATE TRIGGER declaracoes_redirect_observacoes_internas
BEFORE INSERT OR UPDATE OF observacoes_internas ON public.declaracoes
FOR EACH ROW EXECUTE FUNCTION public.redirect_observacoes_internas();

-- Migrate existing data
INSERT INTO public.declaracao_notas_internas (declaracao_id, escritorio_id, conteudo)
SELECT d.id, d.escritorio_id, d.observacoes_internas
FROM public.declaracoes d
WHERE d.observacoes_internas IS NOT NULL AND btrim(d.observacoes_internas) <> ''
ON CONFLICT (declaracao_id) DO UPDATE SET conteudo = EXCLUDED.conteudo, escritorio_id = EXCLUDED.escritorio_id, updated_at = now();

-- ============================================
-- 2. Fix declaracoes client policy: restrict to authenticated
-- ============================================
DROP POLICY IF EXISTS "Cliente pode ver suas declaracoes" ON public.declaracoes;
CREATE POLICY "Cliente pode ver suas declaracoes"
ON public.declaracoes FOR SELECT TO authenticated
USING (cliente_id = public.get_user_cliente_id());

-- Recreate client view (already exists but ensure correct definition)
CREATE OR REPLACE VIEW public.declaracoes_cliente_view AS
SELECT d.id, d.cliente_id, d.escritorio_id, d.contador_id, d.ano_base,
  d.status, d.tipo_resultado, d.valor_resultado, d.numero_recibo,
  d.data_transmissao, d.forma_tributacao, d.ultima_atualizacao_status,
  d.created_at, d.version
FROM public.declaracoes d
WHERE d.cliente_id = public.get_user_cliente_id();

GRANT SELECT ON public.declaracoes_cliente_view TO authenticated;

-- ============================================
-- 3. Fix clientes policies: all to authenticated, create safe view
-- ============================================
DROP POLICY IF EXISTS "Dono pode ver todos clientes do escritorio" ON public.clientes;
DROP POLICY IF EXISTS "Colaborador pode ver clientes do escritorio" ON public.clientes;

CREATE POLICY "Dono pode ver todos clientes do escritorio"
ON public.clientes FOR SELECT TO authenticated
USING (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::public.app_role));

CREATE POLICY "Colaborador pode ver clientes do escritorio"
ON public.clientes FOR SELECT TO authenticated
USING (escritorio_id = public.get_user_escritorio_id() AND NOT public.has_role(auth.uid(), 'dono'::public.app_role));

-- Safe view without token columns for app queries
CREATE OR REPLACE VIEW public.clientes_safe AS
SELECT c.id, c.escritorio_id, c.contador_responsavel_id, c.nome, c.cpf,
  c.email, c.telefone, c.data_nascimento, c.status_onboarding,
  c.created_at, c.conta_azul_id, c.auth_user_id
FROM public.clientes c
WHERE c.escritorio_id = public.get_user_escritorio_id();

GRANT SELECT ON public.clientes_safe TO authenticated;

-- ============================================
-- 4. Fix declaracao_atividades: all policies to authenticated
-- ============================================
DROP POLICY IF EXISTS "Escritorio pode ver atividades" ON public.declaracao_atividades;
DROP POLICY IF EXISTS "Escritorio pode inserir atividades" ON public.declaracao_atividades;
DROP POLICY IF EXISTS "Escritorio pode atualizar atividades" ON public.declaracao_atividades;
DROP POLICY IF EXISTS "Apenas dono pode deletar atividades" ON public.declaracao_atividades;

CREATE POLICY "Escritorio pode ver atividades"
ON public.declaracao_atividades FOR SELECT TO authenticated
USING (declaracao_id IN (SELECT d.id FROM public.declaracoes d WHERE d.escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Escritorio pode inserir atividades"
ON public.declaracao_atividades FOR INSERT TO authenticated
WITH CHECK (declaracao_id IN (SELECT d.id FROM public.declaracoes d WHERE d.escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Escritorio pode atualizar atividades"
ON public.declaracao_atividades FOR UPDATE TO authenticated
USING (declaracao_id IN (SELECT d.id FROM public.declaracoes d WHERE d.escritorio_id = public.get_user_escritorio_id()))
WITH CHECK (declaracao_id IN (SELECT d.id FROM public.declaracoes d WHERE d.escritorio_id = public.get_user_escritorio_id()));

CREATE POLICY "Apenas dono pode deletar atividades"
ON public.declaracao_atividades FOR DELETE TO authenticated
USING (
  declaracao_id IN (SELECT d.id FROM public.declaracoes d WHERE d.escritorio_id = public.get_user_escritorio_id())
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);

-- ============================================
-- 5. Colaborador convites: secure RPC for invite validation
-- ============================================
CREATE OR REPLACE FUNCTION public.get_colaborador_invite_public(_token TEXT)
RETURNS TABLE (
  id UUID, email TEXT, nome TEXT, papel TEXT,
  escritorio_id UUID, expira_em TIMESTAMPTZ, escritorio_nome TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cc.id, cc.email, cc.nome, cc.papel, cc.escritorio_id, cc.expira_em, e.nome AS escritorio_nome
  FROM public.colaborador_convites cc
  JOIN public.escritorios e ON e.id = cc.escritorio_id
  WHERE cc.token = _token AND cc.usado = false AND cc.expira_em > now()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_colaborador_invite_public(TEXT) TO anon, authenticated;

-- ============================================
-- 6. Storage: logos-escritorios - fix to authenticated
-- ============================================
DROP POLICY IF EXISTS "Dono pode fazer upload de logo do escritorio" ON storage.objects;
DROP POLICY IF EXISTS "Dono pode atualizar logo do escritorio" ON storage.objects;
DROP POLICY IF EXISTS "Dono pode deletar logo do escritorio" ON storage.objects;

CREATE POLICY "Dono pode fazer upload de logo do escritorio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
  AND public.get_user_papel() = 'dono'
);

CREATE POLICY "Dono pode atualizar logo do escritorio"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
  AND public.get_user_papel() = 'dono'
)
WITH CHECK (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
  AND public.get_user_papel() = 'dono'
);

CREATE POLICY "Dono pode deletar logo do escritorio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
  AND public.get_user_papel() = 'dono'
);

-- ============================================
-- 7. Storage: bug-screenshots - fix to authenticated
-- ============================================
DROP POLICY IF EXISTS "Users can upload bug screenshots to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all bug screenshots" ON storage.objects;

CREATE POLICY "Users can upload bug screenshots to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bug-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own bug screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bug-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all bug screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bug-screenshots' AND public.has_role(auth.uid(), 'admin'::public.app_role));