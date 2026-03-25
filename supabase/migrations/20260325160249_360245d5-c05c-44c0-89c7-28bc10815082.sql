
-- 1. FIX CRITICAL: Prevent self-role-escalation on usuarios table
-- Drop the current policy that allows users to update ANY field on their own row
DROP POLICY IF EXISTS "Usuario pode atualizar proprio registro" ON public.usuarios;

-- Recreate with restriction: user can update own row but NOT change papel or escritorio_id
CREATE POLICY "Usuario pode atualizar proprio registro"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND papel = (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid())
  AND escritorio_id = (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid())
);

-- 2. FIX WARN: Add UPDATE policy for contadores on formulario_ir
CREATE POLICY "Contador pode atualizar formularios do escritorio"
ON public.formulario_ir
FOR UPDATE
TO authenticated
USING (
  cliente_id IN (
    SELECT clientes.id FROM clientes WHERE clientes.escritorio_id = get_user_escritorio_id()
  )
);
