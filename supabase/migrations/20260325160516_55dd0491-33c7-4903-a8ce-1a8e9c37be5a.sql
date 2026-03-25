
-- 1. FIX CRITICAL: Restrict client chat message insertion to own declarations
DROP POLICY IF EXISTS "Cliente pode enviar mensagens" ON public.mensagens_chat;

CREATE POLICY "Cliente pode enviar mensagens"
ON public.mensagens_chat
FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id = get_user_cliente_id()
  AND declaracao_id IN (SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id())
  AND escritorio_id IN (SELECT escritorio_id FROM clientes WHERE id = get_user_cliente_id())
);

-- 2. FIX WARN: Restrict formulario_ir INSERT/UPDATE to own declarations
DROP POLICY IF EXISTS "Cliente pode inserir seu formulario" ON public.formulario_ir;
CREATE POLICY "Cliente pode inserir seu formulario"
ON public.formulario_ir
FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id = get_user_cliente_id()
  AND declaracao_id IN (SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id())
);

DROP POLICY IF EXISTS "Cliente pode atualizar seu formulario" ON public.formulario_ir;
CREATE POLICY "Cliente pode atualizar seu formulario"
ON public.formulario_ir
FOR UPDATE
TO authenticated
USING (cliente_id = get_user_cliente_id())
WITH CHECK (
  cliente_id = get_user_cliente_id()
  AND declaracao_id IN (SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id())
);
