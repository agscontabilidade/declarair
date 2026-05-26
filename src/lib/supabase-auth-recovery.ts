// Cliente Supabase dedicado ao fluxo de recuperação de senha.
// Usa flow `implicit` para que o link de recuperação funcione cross-device
// (sem dependência do code_verifier do PKCE armazenado no navegador de origem).
//
// Storage isolado para não interferir na sessão principal de outros usuários
// logados no mesmo navegador.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseRecovery = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      storageKey: 'sb-declarair-recovery',
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: true,
    },
  }
);
