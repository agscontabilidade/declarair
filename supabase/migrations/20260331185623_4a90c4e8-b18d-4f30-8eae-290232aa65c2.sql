
CREATE POLICY "Contador pode inserir formulario para clientes do escritorio"
ON public.formulario_ir
FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id IN (
    SELECT id FROM public.clientes WHERE escritorio_id = public.get_user_escritorio_id()
  )
);
