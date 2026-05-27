
-- cliente_memorias: restringir colaboradores a clientes atribuídos
DROP POLICY IF EXISTS "Users can manage memories from their office" ON public.cliente_memorias;
DROP POLICY IF EXISTS "Users can view memories from their office" ON public.cliente_memorias;

CREATE POLICY "Dono/admin manage cliente_memorias"
ON public.cliente_memorias FOR ALL TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND (public.has_role(auth.uid(), 'dono'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND (public.has_role(auth.uid(), 'dono'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Colaborador manage assigned cliente_memorias"
ON public.cliente_memorias FOR ALL TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND cliente_id IN (
    SELECT c.id FROM public.clientes c
    WHERE c.escritorio_id = public.get_user_escritorio_id()
      AND c.contador_responsavel_id = auth.uid()
  )
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND cliente_id IN (
    SELECT c.id FROM public.clientes c
    WHERE c.escritorio_id = public.get_user_escritorio_id()
      AND c.contador_responsavel_id = auth.uid()
  )
);

-- declaracao_analises: mesma lógica via declaracao_id -> cliente
DROP POLICY IF EXISTS "Users can manage analyses from their office" ON public.declaracao_analises;
DROP POLICY IF EXISTS "Users can view analyses from their office" ON public.declaracao_analises;

CREATE POLICY "Dono/admin manage declaracao_analises"
ON public.declaracao_analises FOR ALL TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND (public.has_role(auth.uid(), 'dono'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND (public.has_role(auth.uid(), 'dono'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Colaborador manage assigned declaracao_analises"
ON public.declaracao_analises FOR ALL TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND declaracao_id IN (
    SELECT d.id FROM public.declaracoes d
    JOIN public.clientes c ON c.id = d.cliente_id
    WHERE d.escritorio_id = public.get_user_escritorio_id()
      AND c.contador_responsavel_id = auth.uid()
  )
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND declaracao_id IN (
    SELECT d.id FROM public.declaracoes d
    JOIN public.clientes c ON c.id = d.cliente_id
    WHERE d.escritorio_id = public.get_user_escritorio_id()
      AND c.contador_responsavel_id = auth.uid()
  )
);
