-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Dono pode ver convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Dono pode criar convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Dono pode atualizar convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Dono pode remover convites do escritorio" ON public.convites_cliente;

-- Create more inclusive policies for all office members
CREATE POLICY "Colaboradores podem ver convites do escritorio" 
ON public.convites_cliente 
FOR SELECT 
USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem criar convites do escritorio" 
ON public.convites_cliente 
FOR INSERT 
WITH CHECK (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem atualizar convites do escritorio" 
ON public.convites_cliente 
FOR UPDATE 
USING (escritorio_id = get_user_escritorio_id())
WITH CHECK (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem remover convites do escritorio" 
ON public.convites_cliente 
FOR DELETE 
USING (escritorio_id = get_user_escritorio_id());
