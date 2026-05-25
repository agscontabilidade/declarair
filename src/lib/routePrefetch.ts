/**
 * Mapa rota -> import() para prefetch de chunks lazy.
 * Chamado em onMouseEnter/onFocus nos itens da Sidebar.
 * O Vite dedupe imports, então o mesmo chunk usado em App.tsx é reaproveitado.
 */
const prefetchers: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/clientes': () => import('@/pages/Clientes'),
  '/declaracoes': () => import('@/pages/Declaracoes'),
  '/drive': () => import('@/pages/Drive'),
  '/cobrancas': () => import('@/pages/Cobrancas'),
  '/relatorios': () => import('@/pages/Relatorios'),
  '/addons': () => import('@/pages/Addons'),
  '/configuracoes': () => import('@/pages/Configuracoes'),
  '/perfil': () => import('@/pages/Perfil'),
  '/meus-planos': () => import('@/pages/Upgrade'),
  '/webhooks': () => import('@/pages/Webhooks'),
  '/api-keys': () => import('@/pages/ConfiguracoesAPI'),
};

const started = new Set<string>();

export function prefetchRoute(path: string) {
  if (started.has(path)) return;
  const fn = prefetchers[path];
  if (!fn) return;
  started.add(path);
  // requestIdleCallback se disponível para não competir com interação
  const run = () => fn().catch(() => started.delete(path));
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}
