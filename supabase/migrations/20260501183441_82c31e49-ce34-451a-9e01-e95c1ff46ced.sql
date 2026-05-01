-- Drop triggers first to recreate them safely
DROP TRIGGER IF EXISTS trg_email_automation_declaracoes ON public.declaracoes;
DROP TRIGGER IF EXISTS trg_email_automation_chat ON public.mensagens_chat;

-- Redefine the trigger function with fixed search_path and proper URL handling
CREATE OR REPLACE FUNCTION public.trigger_transactional_email_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_template_name TEXT;
    v_recipient_email TEXT;
    v_template_data JSONB;
    v_cliente_nome TEXT;
    v_cliente_email TEXT;
    v_escritorio_nome TEXT;
    v_project_url TEXT;
    v_service_key TEXT;
BEGIN
    -- Get project environment variables
    v_project_url := 'https://bykqurgeptipguqvxwiq.supabase.co'; -- Built-in project URL
    
    -- Determine the template and data based on the table and context
    IF TG_TABLE_NAME = 'declaracoes' THEN
        -- Case 1: New declaration
        IF TG_OP = 'INSERT' THEN
            SELECT nome, email INTO v_cliente_nome, v_cliente_email 
            FROM public.clientes WHERE id = NEW.cliente_id;
            
            SELECT nome INTO v_escritorio_nome 
            FROM public.escritorios WHERE id = NEW.escritorio_id;
            
            v_template_name := 'nova-declaracao';
            v_recipient_email := v_cliente_email;
            v_template_data := jsonb_build_object(
                'nomeCliente', COALESCE(v_cliente_nome, 'Cliente'),
                'nomeEscritorio', COALESCE(v_escritorio_nome, 'Seu Escritório'),
                'anoBase', NEW.ano_base
            );
        -- Case 2: Declaration Transmitted
        ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') != 'transmitida' AND NEW.status = 'transmitida' THEN
            SELECT nome, email INTO v_cliente_nome, v_cliente_email 
            FROM public.clientes WHERE id = NEW.cliente_id;
            
            SELECT nome INTO v_escritorio_nome 
            FROM public.escritorios WHERE id = NEW.escritorio_id;
            
            v_template_name := 'declaracao-transmitida';
            v_recipient_email := v_cliente_email;
            v_template_data := jsonb_build_object(
                'nomeCliente', COALESCE(v_cliente_nome, 'Cliente'),
                'nomeEscritorio', COALESCE(v_escritorio_nome, 'Seu Escritório'),
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
            
            IF v_cliente_email IS NOT NULL THEN
                v_template_name := 'boas-vindas'; -- Simplified chat notification fallback
                v_recipient_email := v_cliente_email;
                v_template_data := jsonb_build_object(
                    'nomeCliente', COALESCE(v_cliente_nome, 'Cliente'),
                    'nomeEscritorio', COALESCE(v_escritorio_nome, 'Seu Escritório'),
                    'mensagem', NEW.mensagem
                );
            END IF;
        END IF;
    END IF;

    -- Call the Edge Function if we have a valid setup
    -- Using pg_net extension (net.http_post) is the safest way for async trigger calls
    IF v_template_name IS NOT NULL AND v_recipient_email IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_project_url || '/functions/v1/send-transactional-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                -- Note: The service key should be provided via vault or env if possible, 
                -- but in many edge environments, the trigger uses a preset token or internal call.
                -- For security, ensure the Edge Function is gated properly.
                'Authorization', 'Bearer ' || current_setting('request.headers', true)::json->>'apikey'
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create triggers
CREATE TRIGGER trg_email_automation_declaracoes
AFTER INSERT OR UPDATE ON public.declaracoes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_transactional_email_notification();

CREATE TRIGGER trg_email_automation_chat
AFTER INSERT ON public.mensagens_chat
FOR EACH ROW
EXECUTE FUNCTION public.trigger_transactional_email_notification();
