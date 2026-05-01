CREATE OR REPLACE FUNCTION public.trigger_transactional_email_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_template_name TEXT;
    v_recipient_email TEXT;
    v_template_data JSONB;
    v_cliente_nome TEXT;
    v_cliente_email TEXT;
    v_escritorio_nome TEXT;
    v_project_url TEXT;
    v_headers TEXT;
    v_apikey TEXT;
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
    IF v_template_name IS NOT NULL AND v_recipient_email IS NOT NULL THEN
        -- Safely get the apikey from the request headers if available
        BEGIN
            v_headers := current_setting('request.headers', true);
            IF v_headers IS NOT NULL THEN
                v_apikey := v_headers::json->>'apikey';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_apikey := NULL;
        END;

        -- If we don't have an apikey from headers, we might be in a background worker context.
        -- In that case, we can't easily trigger the function from SQL without a valid key.
        -- However, we should at least not crash the transaction.
        IF v_apikey IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_project_url || '/functions/v1/send-transactional-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_apikey
                ),
                body := jsonb_build_object(
                    'templateName', v_template_name,
                    'recipientEmail', v_recipient_email,
                    'templateData', v_template_data
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
