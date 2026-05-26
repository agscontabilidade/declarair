ALTER TABLE public.convites_cliente ALTER COLUMN expira_em DROP DEFAULT;
UPDATE public.convites_cliente
   SET expira_em = NULL,
       usado = false,
       usado_em = NULL,
       usado_por_cliente_id = NULL;