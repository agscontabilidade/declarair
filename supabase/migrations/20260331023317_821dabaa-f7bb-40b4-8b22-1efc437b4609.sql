-- Add Stripe columns to escritorios
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add Stripe columns to assinaturas
ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

-- Add Stripe columns to pagamentos_assinatura
ALTER TABLE public.pagamentos_assinatura
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

-- Add Stripe columns to escritorio_addons
ALTER TABLE public.escritorio_addons
  ADD COLUMN IF NOT EXISTS stripe_subscription_item_id text;