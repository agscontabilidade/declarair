
-- Clear convites_cliente reference
UPDATE public.convites_cliente SET usado_por_cliente_id = NULL WHERE usado_por_cliente_id = '87955f9c-efcc-408a-b9d1-cd6befab099a';

-- Delete cliente record
DELETE FROM public.clientes WHERE id = '87955f9c-efcc-408a-b9d1-cd6befab099a';

-- Delete auth user
DELETE FROM auth.users WHERE id = '6ff6a0e9-b012-40fe-a546-bbcbee9be17a';
