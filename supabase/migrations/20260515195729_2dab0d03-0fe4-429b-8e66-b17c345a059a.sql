-- Backfill: declarações criadas em 2026 com ano_base=2025 e que não foram transmitidas
-- são realocadas para ano_base=2026. Preserva histórico real (transmitidas, com recibo
-- ou data de transmissão). Atualiza também o formulario_ir correspondente.

UPDATE public.formulario_ir f
SET ano_base = 2026
WHERE f.ano_base = 2025
  AND f.declaracao_id IN (
    SELECT d.id FROM public.declaracoes d
    WHERE d.ano_base = 2025
      AND d.status <> 'transmitida'
      AND d.data_transmissao IS NULL
      AND d.numero_recibo IS NULL
      AND d.created_at >= '2026-01-01'
  );

UPDATE public.declaracoes
SET ano_base = 2026
WHERE ano_base = 2025
  AND status <> 'transmitida'
  AND data_transmissao IS NULL
  AND numero_recibo IS NULL
  AND created_at >= '2026-01-01';