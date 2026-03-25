
-- 1. FIX CRITICAL: Remove permissive INSERT on user_roles (prevent self-granting dono role)
DROP POLICY IF EXISTS "Usuarios podem inserir propria role" ON public.user_roles;

-- Only service_role can manage roles (via handle_new_accountant_signup function)
CREATE POLICY "Service role manages roles"
ON public.user_roles
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 2. FIX CRITICAL: Restrict INSERT on usuarios to prevent joining arbitrary escritorios
DROP POLICY IF EXISTS "Usuario pode inserir proprio registro" ON public.usuarios;

-- Only allow insert via service_role (handle_new_accountant_signup is SECURITY DEFINER)
CREATE POLICY "Service role inserts usuarios"
ON public.usuarios
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- Also allow user to update their own non-privileged fields
CREATE POLICY "Usuario pode atualizar proprio registro"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. FIX MEDIUM: Restrict notificacoes INSERT to user's own escritorio
DROP POLICY IF EXISTS "Qualquer autenticado pode inserir notificacao" ON public.notificacoes;

CREATE POLICY "Inserir notificacoes no proprio escritorio"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (escritorio_id = get_user_escritorio_id());

-- Also allow service_role to insert (for webhooks/background jobs)
CREATE POLICY "Service role insere notificacoes"
ON public.notificacoes
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. FIX search_path on email queue functions
CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;
