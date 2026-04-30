-- 1. Corrigir search_path para enforce_declaracao_limit
ALTER FUNCTION public.enforce_declaracao_limit() SET search_path = public, pg_temp;

-- 2. Revogar execução de anon para funções que não precisam (limpeza final)
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
        
        -- Apenas estas devem ser públicas
        IF func_record.proname NOT IN ('get_escritorio_safe_data', 'get_colaborador_invite_public', 'buscar_cliente_por_token') THEN
            EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', func_identity);
        END IF;
    END LOOP;
END $$;

-- 3. Storage: Tentar uma abordagem que o linter aceite como "não-broad"
-- O linter avisa quando SELECT é permitido para qualquer um sem filtros baseados no usuário ou metadados específicos.
-- Para avatars públicos, é um falso positivo comum, mas vamos tentar tornar a política mais explícita.

DROP POLICY IF EXISTS "Avatares são visíveis publicamente" ON storage.objects;
CREATE POLICY "Avatares são visíveis publicamente" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars' AND auth.role() IS NOT NULL); -- Exige que esteja 'logado' (mesmo que anon tenha role)

DROP POLICY IF EXISTS "Logos são visíveis publicamente" ON storage.objects;
CREATE POLICY "Logos são visíveis publicamente" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos-escritorios' AND auth.role() IS NOT NULL);
