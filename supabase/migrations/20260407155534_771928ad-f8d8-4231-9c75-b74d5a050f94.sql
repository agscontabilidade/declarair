-- Create a view that excludes observacoes_internas for client access
CREATE OR REPLACE VIEW public.declaracoes_cliente_view AS
SELECT
  id, cliente_id, escritorio_id, contador_id, ano_base, status,
  tipo_resultado, valor_resultado, numero_recibo, data_transmissao,
  forma_tributacao, ultima_atualizacao_status, created_at, version
FROM public.declaracoes;

-- Grant access to authenticated users
GRANT SELECT ON public.declaracoes_cliente_view TO authenticated;
