-- Insert new permissions if they don't exist
INSERT INTO public.permissoes (nome, descricao, categoria)
VALUES 
  ('usuarios.manage', 'Gerenciar usuários do escritório', 'configuracoes'),
  ('templates.manage', 'Gerenciar templates de documentos', 'configuracoes'),
  ('escritorio.edit', 'Alterar dados do escritório', 'configuracoes')
ON CONFLICT (nome) DO NOTHING;

-- Add permissoes column to colaborador_convites if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaborador_convites' AND column_name = 'permissoes') THEN
    ALTER TABLE public.colaborador_convites ADD COLUMN permissoes JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Enable RLS on usuario_permissoes if not already enabled
ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing permissions
CREATE POLICY "Users can view permissions of their office"
ON public.usuario_permissoes
FOR SELECT
USING (
  escritorio_id IN (
    SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()
  )
);

-- Policy for managing permissions (only for office owners or those with usuarios.manage)
CREATE POLICY "Accountants can manage permissions of their office"
ON public.usuario_permissoes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (papel = 'dono' OR id IN (
      SELECT user_id FROM public.usuario_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE p.nome = 'usuarios.manage'
    ))
  )
);
