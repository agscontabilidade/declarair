-- Add version column for optimistic locking
ALTER TABLE declaracoes ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION public.increment_declaracao_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_declaracao_version
BEFORE UPDATE ON declaracoes
FOR EACH ROW
EXECUTE FUNCTION public.increment_declaracao_version();