-- Function to trigger transactional emails via Edge Function
CREATE OR REPLACE FUNCTION public.trigger_transactional_email_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_template_name TEXT;
    v_recipient_email TEXT;
    v_template_data JSONB;
    v_cliente_nome TEXT;
    v_cliente_email TEXT;
    v_escritorio_nome TEXT;
BEGIN
    -- Determine the template and data based on the table and context
    IF TG_TABLE_NAME = 'declaracoes' THEN
        -- Case 1: New declaration (Welcome/New Declaration)
        IF TG_OP = 'INSERT' THEN
            SELECT nome, email INTO v_cliente_nome, v_cliente_email 
            FROM public.clientes WHERE id = NEW.cliente_id;
            
            SELECT nome INTO v_escritorio_nome 
            FROM public.escritorios WHERE id = NEW.escritorio_id;
            
            v_template_name := 'nova-declaracao';
            v_recipient_email := v_cliente_email;
            v_template_data := jsonb_build_object(
                'nomeCliente', v_cliente_nome,
                'nomeEscritorio', v_escritorio_nome,
                'anoBase', NEW.ano_base
            );
        -- Case 2: Declaration Transmitted
        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'transmitida' AND NEW.status = 'transmitida' THEN
            SELECT nome, email INTO v_cliente_nome, v_cliente_email 
            FROM public.clientes WHERE id = NEW.cliente_id;
            
            SELECT nome INTO v_escritorio_nome 
            FROM public.escritorios WHERE id = NEW.escritorio_id;
            
            v_template_name := 'declaracao-transmitida';
            v_recipient_email := v_cliente_email;
            v_template_data := jsonb_build_object(
                'nomeCliente', v_cliente_nome,
                'nomeEscritorio', v_escritorio_nome,
                'anoBase', NEW.ano_base
            );
        END IF;
    ELSIF TG_TABLE_NAME = 'mensagens_chat' THEN
        -- Case 3: New message from accountant to client
        IF NEW.remetente_tipo = 'usuario' THEN
            SELECT c.nome, c.email, e.nome as escritorio_nome
            INTO v_cliente_nome, v_cliente_email, v_escritorio_nome
            FROM public.declaracoes d
            JOIN public.clientes c ON c.id = d.cliente_id
            JOIN public.escritorios e ON e.id = d.escritorio_id
            WHERE d.id = NEW.declaracao_id;
            
            -- We only send an email notification for chat if we have an email
            IF v_cliente_email IS NOT NULL THEN
                v_template_name := 'boas-vindas'; -- Using boas-vindas as a fallback if specific chat template is missing, or we can use a generic one
                v_recipient_email := v_cliente_email;
                v_template_data := jsonb_build_object(
                    'nomeCliente', v_cliente_nome,
                    'nomeEscritorio', v_escritorio_nome,
                    'mensagem', NEW.mensagem
                );
                -- Note: In a real scenario, you'd have a 'nova-mensagem-chat' template
            END IF;
        END IF;
    END IF;

    -- Call the send-transactional-email Edge Function if we have a valid setup
    IF v_template_name IS NOT NULL AND v_recipient_email IS NOT NULL THEN
        -- Using http extension to call the edge function
        -- We use net_async to not block the transaction
        PERFORM net.http_post(
            url := 'https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/send-transactional-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
            ),
            body := jsonb_build_object(
                'templateName', v_template_name,
                'recipientEmail', v_recipient_email,
                'templateData', v_template_data
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for 'declaracoes'
CREATE TRIGGER trg_email_automation_declaracoes
AFTER INSERT OR UPDATE ON public.declaracoes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_transactional_email_notification();

-- Triggers for 'mensagens_chat'
CREATE TRIGGER trg_email_automation_chat
AFTER INSERT ON public.mensagens_chat
FOR EACH ROW
EXECUTE FUNCTION public.trigger_transactional_email_notification();
