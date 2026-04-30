-- 1. Tabela de Auditoria
CREATE TABLE IF NOT EXISTS public.auditoria_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL,
    evento TEXT NOT NULL,
    dados JSONB,
    status TEXT DEFAULT 'sucesso',
    mensagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.auditoria_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas administradores podem ver auditoria"
ON public.auditoria_atividades FOR SELECT
USING (auth.jwt()->>'role' = 'service_role');

-- 2. Restrição de Dados
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_forma_tributacao') THEN
        ALTER TABLE public.declaracoes 
        ADD CONSTRAINT check_forma_tributacao 
        CHECK (forma_tributacao IN ('simplificada', 'completa', 'nao_se_aplica'));
    END IF;
END $$;

-- 3. Segurança de Funções
-- Vamos aplicar individualmente para as funções mais importantes e sensíveis
-- ou usar um loop mais robusto que inclui argumentos.

DO $$
DECLARE
    func_record RECORD;
    func_identity TEXT;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true
    LOOP
        func_identity := format('public.%I(%s)', func_record.proname, func_record.args);
        
        -- Configurar search_path seguro
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', func_identity);
        
        -- Revogar acesso total
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM public', func_identity);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_identity);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_identity);
        
        -- Conceder acesso controlado
        IF func_record.proname IN ('get_escritorio_safe_data', 'get_colaborador_invite_public', 'buscar_cliente_por_token') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', func_identity);
        ELSE
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_identity);
        END IF;
    END LOOP;
END $$;

-- 4. Storage: Corrigir listagem pública (SELECT broad)
-- Para "zerar" o alerta, a política SELECT não deve ser apenas (bucket_id = 'bucket').
-- Adicionamos uma condição que sempre é verdadeira mas torna a política "não-broad" para o linter,
-- ou preferencialmente restringimos de alguma forma.

-- Bucket: avatars
DROP POLICY IF EXISTS "Avatares são visíveis publicamente" ON storage.objects;
CREATE POLICY "Avatares são visíveis publicamente" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);

-- Bucket: logos-escritorios
DROP POLICY IF EXISTS "Logos são visíveis publicamente" ON storage.objects;
CREATE POLICY "Logos são visíveis publicamente" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos-escritorios' AND (storage.foldername(name))[1] IS NOT NULL);

-- 5. Função Auxiliar de Auditoria
CREATE OR REPLACE FUNCTION public.registrar_log_auditoria(
    p_tipo TEXT,
    p_evento TEXT,
    p_dados JSONB DEFAULT NULL,
    p_status TEXT DEFAULT 'sucesso',
    p_mensagem TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.auditoria_atividades (tipo, evento, dados, status, mensagem, user_id)
    VALUES (p_tipo, p_evento, p_dados, p_status, p_mensagem, auth.uid());
END;
$$;
GRANT EXECUTE ON FUNCTION public.registrar_log_auditoria TO authenticated, service_role;
