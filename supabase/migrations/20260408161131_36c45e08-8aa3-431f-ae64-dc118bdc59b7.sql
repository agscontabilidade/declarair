-- Fix SECURITY DEFINER views by adding security_invoker = on
CREATE OR REPLACE VIEW public.declaracoes_cliente_view
WITH (security_invoker = on) AS
SELECT d.id, d.cliente_id, d.escritorio_id, d.contador_id, d.ano_base,
  d.status, d.tipo_resultado, d.valor_resultado, d.numero_recibo,
  d.data_transmissao, d.forma_tributacao, d.ultima_atualizacao_status,
  d.created_at, d.version
FROM public.declaracoes d
WHERE d.cliente_id = public.get_user_cliente_id();

CREATE OR REPLACE VIEW public.clientes_safe
WITH (security_invoker = on) AS
SELECT c.id, c.escritorio_id, c.contador_responsavel_id, c.nome, c.cpf,
  c.email, c.telefone, c.data_nascimento, c.status_onboarding,
  c.created_at, c.conta_azul_id, c.auth_user_id
FROM public.clientes c
WHERE c.escritorio_id = public.get_user_escritorio_id();