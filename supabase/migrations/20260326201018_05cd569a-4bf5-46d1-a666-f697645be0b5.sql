CREATE OR REPLACE FUNCTION public.increment_declaracao_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;