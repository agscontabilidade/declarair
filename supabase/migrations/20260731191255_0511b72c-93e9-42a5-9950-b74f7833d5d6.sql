ALTER TABLE public.declaracoes DISABLE TRIGGER USER;

UPDATE public.declaracoes
SET data_transmissao = date_trunc('day', data_transmissao AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' + interval '15 hours'
WHERE data_transmissao IS NOT NULL
  AND (data_transmissao AT TIME ZONE 'UTC')::time = '00:00:00';

ALTER TABLE public.declaracoes ENABLE TRIGGER USER;