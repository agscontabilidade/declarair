ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS tema_preferido text NOT NULL DEFAULT 'system';

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tema_preferido text NOT NULL DEFAULT 'system';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_tema_preferido_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_tema_preferido_check
      CHECK (tema_preferido IN ('light','dark','system'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_tema_preferido_check'
  ) THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_tema_preferido_check
      CHECK (tema_preferido IN ('light','dark','system'));
  END IF;
END $$;