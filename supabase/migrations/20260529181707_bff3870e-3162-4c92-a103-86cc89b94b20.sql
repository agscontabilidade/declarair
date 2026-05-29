DO $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  UPDATE public.declaracoes
  SET status = 'transmitida', ultima_atualizacao_status = now()
  WHERE id = 'd03f7666-ecde-439d-a7ba-713f70ad70f3'
    AND status = 'declaracao_pronta'
    AND recibo_validado_em IS NOT NULL
    AND numero_recibo IS NOT NULL;
END $$;