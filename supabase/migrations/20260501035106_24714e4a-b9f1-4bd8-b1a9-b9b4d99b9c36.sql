ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS procuracao_ecac boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS procuracao_ecac_validade date;