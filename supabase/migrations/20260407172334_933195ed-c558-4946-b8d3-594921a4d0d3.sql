
-- Fix colaborador_convites: remove broad SELECT, dono-only policies already exist
DROP POLICY IF EXISTS "Usuarios podem ver convites do escritorio" ON public.colaborador_convites;
