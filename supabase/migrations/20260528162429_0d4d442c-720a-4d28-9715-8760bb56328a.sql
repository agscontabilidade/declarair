-- Defense-in-depth: revoke column-level SELECT on sensitive credential columns
-- These remain writable; only server-side functions (SECURITY DEFINER) can read.

REVOKE SELECT (key_hash) ON public.api_keys FROM authenticated, anon;

REVOKE SELECT (access_token_encrypted, refresh_token_encrypted, client_secret_encrypted)
  ON public.integracoes_contaazul FROM authenticated, anon;

REVOKE SELECT (secret) ON public.webhooks FROM authenticated, anon;