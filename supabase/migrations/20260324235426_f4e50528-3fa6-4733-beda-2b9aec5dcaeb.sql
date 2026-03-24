
-- Add asaas_customer_id to escritorios
ALTER TABLE public.escritorios ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- Subscriptions table
CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  asaas_subscription_id text,
  plano text NOT NULL DEFAULT 'gratuito',
  status text NOT NULL DEFAULT 'active',
  valor numeric NOT NULL DEFAULT 0,
  ciclo text NOT NULL DEFAULT 'MONTHLY',
  proxima_cobranca date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelado_em timestamptz,
  UNIQUE(escritorio_id)
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio pode ver sua assinatura" ON public.assinaturas
  FOR SELECT TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Service role full access assinaturas" ON public.assinaturas
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Payments table
CREATE TABLE public.pagamentos_assinatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id uuid NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE SET NULL,
  asaas_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  valor numeric NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  forma_pagamento text,
  pix_qrcode text,
  pix_qrcode_url text,
  boleto_url text,
  boleto_linha_digitavel text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos_assinatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio pode ver seus pagamentos" ON public.pagamentos_assinatura
  FOR SELECT TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Service role full access pagamentos" ON public.pagamentos_assinatura
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
