-- Add lida column
ALTER TABLE public.mensagens_chat ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;

-- Partial index for unread messages
CREATE INDEX IF NOT EXISTS idx_mensagens_nao_lidas 
ON public.mensagens_chat(declaracao_id, remetente_tipo) 
WHERE lida = false;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.marcar_mensagens_lidas(p_declaracao_id UUID, p_remetente_tipo TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mensagens_chat
  SET lida = true
  WHERE declaracao_id = p_declaracao_id
    AND remetente_tipo = p_remetente_tipo
    AND lida = false;
END;
$$;

-- Trigger: notify escritorio when client sends a message
CREATE OR REPLACE FUNCTION public.notificar_nova_mensagem_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escritorio_id UUID;
  v_cliente_nome TEXT;
BEGIN
  IF NEW.remetente_tipo = 'cliente' THEN
    SELECT d.escritorio_id, c.nome
    INTO v_escritorio_id, v_cliente_nome
    FROM declaracoes d
    JOIN clientes c ON c.id = d.cliente_id
    WHERE d.id = NEW.declaracao_id;

    IF v_escritorio_id IS NOT NULL THEN
      INSERT INTO notificacoes (escritorio_id, titulo, mensagem, link_destino)
      VALUES (
        v_escritorio_id,
        '💬 Nova mensagem de cliente',
        format('%s enviou uma mensagem', v_cliente_nome),
        format('/declaracoes/%s', NEW.declaracao_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificar_nova_mensagem ON public.mensagens_chat;
CREATE TRIGGER trigger_notificar_nova_mensagem
AFTER INSERT ON public.mensagens_chat
FOR EACH ROW
EXECUTE FUNCTION public.notificar_nova_mensagem_cliente();