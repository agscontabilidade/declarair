// Central portal URL for link generation in messages and templates
export const PORTAL_BASE_URL =
  import.meta.env.VITE_PORTAL_URL ||
  import.meta.env.VITE_SITE_URL ||
  'https://declarair.com.br';

// Supabase API base URL
export const API_BASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bykqurgeptipguqvxwiq.supabase.co';

// Ano-base corrente do IRPF (ano calendário em curso).
// Centralizado para evitar valores hardcoded e divergências entre telas.
export const getAnoBaseAtual = (): number => new Date().getFullYear();
export const ANO_BASE_ATUAL = getAnoBaseAtual();
