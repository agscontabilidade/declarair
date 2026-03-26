
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  phone text,
  qrcode_base64 text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(escritorio_id)
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio ve sua instancia whatsapp"
  ON public.whatsapp_instances FOR SELECT
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Dono gerencia instancia whatsapp"
  ON public.whatsapp_instances FOR ALL
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono')
  WITH CHECK (escritorio_id = get_user_escritorio_id() AND get_user_papel() = 'dono');

CREATE POLICY "Service role full access whatsapp_instances"
  ON public.whatsapp_instances FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
