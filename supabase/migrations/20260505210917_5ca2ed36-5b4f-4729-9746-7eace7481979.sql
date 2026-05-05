-- Tabela de configurações globais
CREATE TABLE public.system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de histórico (versionamento)
CREATE TABLE public.system_config_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.system_configs(id) ON DELETE CASCADE,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT
);

-- Habilitar RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para Super Admin (usando o papel na tabela usuarios)
-- Nota: Como o auth.uid() é usado para validar, e precisamos checar o papel na tabela usuarios
CREATE POLICY "Admins can view system configs" 
ON public.system_configs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admins can manage system configs" 
ON public.system_configs 
FOR ALL
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admins can view system config logs" 
ON public.system_config_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND papel = 'admin'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_system_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_configs_at
BEFORE UPDATE ON public.system_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_system_configs_timestamp();

-- Inserir algumas configurações iniciais de exemplo
INSERT INTO public.system_configs (key, value, description, category) VALUES
('maintenance_mode', 'false', 'Ativa o modo de manutenção global', 'system'),
('global_alert', '""', 'Aviso exibido para todos os usuários no topo do sistema', 'system'),
('plan_limits_free', '{"max_declaracoes": 1, "max_clientes": 5}', 'Limites para o plano Gratuito', 'plans'),
('plan_limits_pro', '{"max_declaracoes": 100, "max_clientes": 500}', 'Limites para o plano Pro', 'plans');
