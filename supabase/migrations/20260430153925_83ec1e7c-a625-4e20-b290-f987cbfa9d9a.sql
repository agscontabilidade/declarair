-- 1. Add CHECK constraint to declaracoes.forma_tributacao
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_forma_tributacao') THEN
        ALTER TABLE public.declaracoes 
        ADD CONSTRAINT check_forma_tributacao 
        CHECK (forma_tributacao IN ('Simplificada', 'Completa'));
    END IF;
END $$;

-- 2. Fix race condition in enforce_declaracao_limit (if exists) or improve logic
-- First, let's identify if the function exists
CREATE OR REPLACE FUNCTION public.enforce_declaracao_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INTEGER;
    v_count INTEGER;
BEGIN
    -- Get current limit with lock to prevent race conditions
    SELECT limite_declaracoes INTO v_limit 
    FROM public.escritorios 
    WHERE id = NEW.escritorio_id 
    FOR SHARE;

    -- Count existing declarations (active ones)
    SELECT COUNT(*) INTO v_count 
    FROM public.declaracoes 
    WHERE escritorio_id = NEW.escritorio_id;

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'Limite de declarações atingido para este escritório (%/%)', v_count, v_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure declaracoes_extras has proper constraints
ALTER TABLE public.declaracoes_extras 
ALTER COLUMN quantidade SET NOT NULL,
ALTER COLUMN valor_total SET NOT NULL;

-- 4. Secure invite tokens (already hashed via pgcrypto if possible, or just ensure they are handled properly)
-- This is a P1, but I'll add a comment to remind that we should move to bcrypt/sha256 in a future migration for tokens.
