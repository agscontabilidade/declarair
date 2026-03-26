-- Fix: Allow any authenticated user from the same escritorio to insert notifications
-- (needed for KanbanBoard automation which runs as colaborador too)
CREATE POLICY "Usuarios inserem notificacoes no escritorio"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (escritorio_id = get_user_escritorio_id());

-- Drop the old restrictive dono-only policy
DROP POLICY IF EXISTS "Dono insere notificacoes no proprio escritorio" ON public.notificacoes;