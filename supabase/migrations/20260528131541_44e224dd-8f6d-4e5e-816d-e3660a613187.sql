-- CLIENTES: restringir SELECT do colaborador aos clientes atribuídos
DROP POLICY IF EXISTS "Colaborador pode ver clientes do escritorio" ON public.clientes;

CREATE POLICY "Colaborador ve apenas clientes atribuidos"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
  AND NOT has_role(auth.uid(), 'dono'::app_role)
  AND contador_responsavel_id = auth.uid()
);

-- COBRANCAS: separar policy "Acesso cobrancas por escritorio" entre dono e colaborador
DROP POLICY IF EXISTS "Acesso cobrancas por escritorio" ON public.cobrancas;

CREATE POLICY "Dono ve cobrancas do escritorio"
ON public.cobrancas
FOR SELECT
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
  AND has_role(auth.uid(), 'dono'::app_role)
);

CREATE POLICY "Colaborador ve cobrancas de clientes atribuidos"
ON public.cobrancas
FOR SELECT
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
  AND NOT has_role(auth.uid(), 'dono'::app_role)
  AND cliente_id IN (
    SELECT c.id FROM public.clientes c
    WHERE c.escritorio_id = get_user_escritorio_id()
      AND c.contador_responsavel_id = auth.uid()
  )
);