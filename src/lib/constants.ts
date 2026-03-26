// Central portal URL for link generation in messages and templates
export const PORTAL_BASE_URL =
  import.meta.env.VITE_PORTAL_URL ||
  import.meta.env.VITE_SITE_URL ||
  'https://declarair.lovable.app';

// Supabase API base URL
export const API_BASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bykqurgeptipguqvxwiq.supabase.co';
