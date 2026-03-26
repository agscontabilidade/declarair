
-- Add-ons catalog table
CREATE TABLE public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  preco numeric NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'mensal', -- mensal | uso
  icone text DEFAULT 'Zap',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read addons catalog
CREATE POLICY "Todos podem ver addons" ON public.addons
  FOR SELECT TO authenticated USING (true);

-- Only service_role can manage catalog
CREATE POLICY "Service role manages addons" ON public.addons
  FOR ALL TO public USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Escritorio add-ons (per-tenant)
CREATE TABLE public.escritorio_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL,
  addon_id uuid NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativo', -- ativo | inativo
  ativado_em timestamp with time zone NOT NULL DEFAULT now(),
  desativado_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(escritorio_id, addon_id)
);

ALTER TABLE public.escritorio_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio ve seus addons" ON public.escritorio_addons
  FOR SELECT TO authenticated USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Dono gerencia addons" ON public.escritorio_addons
  FOR ALL TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono'::text)
  WITH CHECK (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono'::text);

CREATE POLICY "Service role full access escritorio_addons" ON public.escritorio_addons
  FOR ALL TO public USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
