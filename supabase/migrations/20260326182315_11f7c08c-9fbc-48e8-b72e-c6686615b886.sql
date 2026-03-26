
-- Adicionar flag de notificação na tabela cobrancas
ALTER TABLE public.cobrancas 
ADD COLUMN IF NOT EXISTS notificacao_vencimento_enviada boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento_notif 
ON public.cobrancas(status, data_vencimento, notificacao_vencimento_enviada)
WHERE status = 'pendente' AND notificacao_vencimento_enviada = false;

-- Função de notificação de cobranças próximas do vencimento
CREATE OR REPLACE FUNCTION public.notificar_cobrancas_vencendo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec record;
  v_count integer := 0;
BEGIN
  FOR v_rec IN
    SELECT c.id, c.valor, c.data_vencimento, c.escritorio_id, cl.nome AS cliente_nome
    FROM cobrancas c
    JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.status = 'pendente'
      AND c.data_vencimento = CURRENT_DATE + 3
      AND c.notificacao_vencimento_enviada = false
  LOOP
    INSERT INTO notificacoes (escritorio_id, titulo, mensagem, link_destino)
    VALUES (
      v_rec.escritorio_id,
      '⏰ Cobrança vence em 3 dias',
      format('A cobrança de R$ %s do cliente %s vence em %s.',
             to_char(v_rec.valor, 'FM999G999D00'),
             v_rec.cliente_nome,
             to_char(v_rec.data_vencimento, 'DD/MM/YYYY')),
      '/cobrancas'
    );

    UPDATE cobrancas SET notificacao_vencimento_enviada = true WHERE id = v_rec.id;
    v_count := v_count + 1;
  END LOOP;

  INSERT INTO system_logs (tipo, mensagem)
  VALUES ('cron_notif_vencimento', format('%s notificações de vencimento enviadas', v_count));
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (tipo, mensagem, metadata)
  VALUES ('cron_notif_vencimento_erro', SQLERRM, jsonb_build_object('sqlstate', SQLSTATE));
END;
$$;
