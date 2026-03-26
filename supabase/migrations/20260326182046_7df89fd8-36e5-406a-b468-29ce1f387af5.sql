
-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  mensagem text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_tipo ON public.system_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access system_logs"
ON public.system_logs FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Função que marca cobranças vencidas como atrasadas
CREATE OR REPLACE FUNCTION public.atualizar_cobrancas_vencidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE cobrancas
  SET status = 'atrasado'
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO system_logs (tipo, mensagem)
  VALUES ('cron_cobrancas_vencidas', format('%s cobranças marcadas como atrasadas', v_count));
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (tipo, mensagem, metadata)
  VALUES ('cron_cobrancas_vencidas_erro', SQLERRM, jsonb_build_object('sqlstate', SQLSTATE));
END;
$$;
