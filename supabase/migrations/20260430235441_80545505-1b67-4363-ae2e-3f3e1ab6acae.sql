-- Add status_documentos to declaracoes
ALTER TABLE public.declaracoes 
ADD COLUMN IF NOT EXISTS status_documentos TEXT DEFAULT 'pendente';

-- Add comment for clarity
COMMENT ON COLUMN public.declaracoes.status_documentos IS 'Status do envio de documentos pelo cliente: pendente, enviado, verificado';

-- Update types would happen after migration execution
