-- Índice único parcial para garantir 1 linha por (declaracao, categoria 'contador', nome_documento)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_checklist_contador_doc
  ON public.checklist_documentos (declaracao_id, nome_documento)
  WHERE categoria = 'contador';

-- Backfill: criar entradas em checklist_documentos para arquivos já anexados pelo contador
INSERT INTO public.checklist_documentos (
  declaracao_id, nome_documento, categoria, obrigatorio, status, arquivo_url, arquivo_nome, data_recebimento
)
SELECT
  d.id,
  'Declaração IRPF (PDF)',
  'contador',
  false,
  'recebido',
  d.arquivo_declaracao_url,
  COALESCE(d.arquivo_declaracao_nome, 'declaracao.pdf'),
  COALESCE(d.arquivo_declaracao_uploaded_at, d.declaracao_validada_em, now())
FROM public.declaracoes d
WHERE d.arquivo_declaracao_url IS NOT NULL
ON CONFLICT (declaracao_id, nome_documento) WHERE categoria = 'contador' DO NOTHING;

INSERT INTO public.checklist_documentos (
  declaracao_id, nome_documento, categoria, obrigatorio, status, arquivo_url, arquivo_nome, data_recebimento
)
SELECT
  d.id,
  'Recibo da Receita (PDF)',
  'contador',
  false,
  'recebido',
  d.arquivo_recibo_url,
  COALESCE(d.arquivo_recibo_nome, 'recibo.pdf'),
  COALESCE(d.arquivo_recibo_uploaded_at, d.recibo_validado_em, now())
FROM public.declaracoes d
WHERE d.arquivo_recibo_url IS NOT NULL
ON CONFLICT (declaracao_id, nome_documento) WHERE categoria = 'contador' DO NOTHING;