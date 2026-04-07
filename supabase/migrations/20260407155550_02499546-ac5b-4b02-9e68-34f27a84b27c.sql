-- Fix: Set view to SECURITY INVOKER so RLS is enforced per-user
ALTER VIEW public.declaracoes_cliente_view SET (security_invoker = on);
