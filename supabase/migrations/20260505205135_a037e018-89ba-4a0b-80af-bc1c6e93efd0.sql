-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    office_id UUID REFERENCES public.escritorios(id),
    ip_address TEXT,
    user_agent TEXT
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs
CREATE POLICY "Admins podem visualizar todos os logs de auditoria"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Inserir alguns logs iniciais baseados em system_logs para popular a tela
INSERT INTO public.audit_logs (action, details, created_at)
SELECT tipo, jsonb_build_object('mensagem', mensagem), created_at
FROM public.system_logs
LIMIT 20;

-- Função genérica para trigger de auditoria (opcional, mas boa prática)
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
BEGIN
    -- Tentar pegar o email do usuário do contexto da sessão se disponível
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
        VALUES (v_user_id, v_user_email, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
        VALUES (v_user_id, v_user_email, 'UPDATE', TG_TABLE_NAME, NEW.id::text, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
        VALUES (v_user_id, v_user_email, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
