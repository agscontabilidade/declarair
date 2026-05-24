
-- 1. cliente_memorias & declaracao_analises: restrict to authenticated
DROP POLICY IF EXISTS "Users can view memories from their office" ON public.cliente_memorias;
DROP POLICY IF EXISTS "Users can insert/update memories from their office" ON public.cliente_memorias;

CREATE POLICY "Users can view memories from their office"
ON public.cliente_memorias FOR SELECT TO authenticated
USING (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()));

CREATE POLICY "Users can manage memories from their office"
ON public.cliente_memorias FOR ALL TO authenticated
USING (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()))
WITH CHECK (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()));

DROP POLICY IF EXISTS "Users can view analyses from their office" ON public.declaracao_analises;
DROP POLICY IF EXISTS "Users can insert/update analyses from their office" ON public.declaracao_analises;

CREATE POLICY "Users can view analyses from their office"
ON public.declaracao_analises FOR SELECT TO authenticated
USING (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()));

CREATE POLICY "Users can manage analyses from their office"
ON public.declaracao_analises FOR ALL TO authenticated
USING (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()))
WITH CHECK (escritorio_id IN (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid()));

-- 2. auditoria_atividades: explicit service-role-only write/delete
CREATE POLICY "Service role inserts auditoria"
ON public.auditoria_atividades FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role deletes auditoria"
ON public.auditoria_atividades FOR DELETE TO public
USING (auth.role() = 'service_role');

-- 3. system_configs & system_config_logs: use has_role() instead of usuarios.papel
DROP POLICY IF EXISTS "Admins can view system configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can manage system configs" ON public.system_configs;

CREATE POLICY "Admins can view system configs"
ON public.system_configs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage system configs"
ON public.system_configs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view system config logs" ON public.system_config_logs;

CREATE POLICY "Admins can view system config logs"
ON public.system_config_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
