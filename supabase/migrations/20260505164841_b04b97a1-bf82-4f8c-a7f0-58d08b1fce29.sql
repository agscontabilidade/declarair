-- Table for persisting declaration analyses
CREATE TABLE IF NOT EXISTS public.declaracao_analises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaracao_id UUID NOT NULL REFERENCES public.declaracoes(id) ON DELETE CASCADE,
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- 'analise_caixa', 'riscos', 'analise'
    resultado_texto TEXT,
    resultado_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for AI "Memory" about clients
CREATE TABLE IF NOT EXISTS public.cliente_memorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    categoria TEXT, -- 'perfil', 'recorrencia', 'alerta', 'geral'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.declaracao_analises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_memorias ENABLE ROW LEVEL SECURITY;

-- Policies for declaracao_analises
CREATE POLICY "Users can view analyses from their office" 
ON public.declaracao_analises FOR SELECT 
USING (escritorio_id IN (SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Users can insert/update analyses from their office" 
ON public.declaracao_analises FOR ALL 
USING (escritorio_id IN (SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()));

-- Policies for cliente_memorias
CREATE POLICY "Users can view memories from their office" 
ON public.cliente_memorias FOR SELECT 
USING (escritorio_id IN (SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Users can insert/update memories from their office" 
ON public.cliente_memorias FOR ALL 
USING (escritorio_id IN (SELECT escritorio_id FROM public.usuarios WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_declaracao_analises_declaracao_id ON public.declaracao_analises(declaracao_id);
CREATE INDEX IF NOT EXISTS idx_cliente_memorias_cliente_id ON public.cliente_memorias(cliente_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_declaracao_analises_updated_at
    BEFORE UPDATE ON public.declaracao_analises
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_cliente_memorias_updated_at
    BEFORE UPDATE ON public.cliente_memorias
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
