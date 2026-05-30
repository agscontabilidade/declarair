DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tc.table_schema, tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
     AND kcu.table_schema   = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema   = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name   = 'clientes'
      AND ccu.column_name  = 'id'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                   r.table_schema, r.table_name, r.constraint_name);
    IF r.table_name = 'convites_cliente' THEN
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.clientes(id) ON DELETE SET NULL',
        r.table_schema, r.table_name, r.constraint_name, r.column_name);
    ELSE
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.clientes(id) ON DELETE CASCADE',
        r.table_schema, r.table_name, r.constraint_name, r.column_name);
    END IF;
  END LOOP;
END $$;