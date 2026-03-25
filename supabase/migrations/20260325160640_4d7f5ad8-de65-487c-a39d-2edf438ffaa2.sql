
-- 1. FIX CRITICAL: Prevent colaboradores from changing auth_user_id on clientes
-- Create a trigger that blocks modification of sensitive columns by non-dono users
CREATE OR REPLACE FUNCTION public.protect_cliente_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If auth_user_id is being changed, only allow dono
  IF OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id THEN
    IF NOT has_role(auth.uid(), 'dono') THEN
      RAISE EXCEPTION 'Only owners can modify auth_user_id';
    END IF;
  END IF;
  -- If token_convite is being changed, only allow dono
  IF OLD.token_convite IS DISTINCT FROM NEW.token_convite THEN
    IF NOT has_role(auth.uid(), 'dono') THEN
      RAISE EXCEPTION 'Only owners can modify token_convite';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_cliente_fields
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.protect_cliente_sensitive_fields();

-- 2. FIX WARN: Restrict notificacoes INSERT to dono/service_role only
DROP POLICY IF EXISTS "Inserir notificacoes no proprio escritorio" ON public.notificacoes;

CREATE POLICY "Dono insere notificacoes no proprio escritorio"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (
  escritorio_id = get_user_escritorio_id()
  AND get_user_papel() = 'dono'
);
