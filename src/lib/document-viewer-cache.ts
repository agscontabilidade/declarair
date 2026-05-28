/**
 * Cache compartilhado de signed URLs e blob URLs para o visualizador de
 * documentos. Vive durante a sessão da aba (módulo singleton). Não toca em
 * RLS/storage policies — apenas reaproveita o que o usuário já tem permissão
 * para acessar.
 */
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'documentos-clientes';
const SIGNED_TTL_SECONDS = 3600;
// Reaproveita um signed URL apenas se ele ainda tiver folga de >5min para expirar.
const REUSE_MARGIN_MS = (SIGNED_TTL_SECONDS - 5 * 60) * 1000;

interface Entry {
  signedUrl: string;
  signedAt: number;
  signedPromise?: Promise<string | null>;
  blobUrl?: string;
  blobPromise?: Promise<string | null>;
}

const cache = new Map<string, Entry>();

function isFresh(entry: Entry | undefined): entry is Entry {
  return !!entry?.signedUrl && Date.now() - entry.signedAt < REUSE_MARGIN_MS;
}

export async function getSignedUrlCached(path: string): Promise<string | null> {
  const current = cache.get(path);
  if (current && isFresh(current)) return current.signedUrl;
  if (current?.signedPromise) return current.signedPromise;

  const promise = (async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      const e = cache.get(path);
      if (e) e.signedPromise = undefined;
      return null;
    }
    const entry: Entry = {
      ...(cache.get(path) ?? { signedUrl: '', signedAt: 0 }),
      signedUrl: data.signedUrl,
      signedAt: Date.now(),
      signedPromise: undefined,
    };
    cache.set(path, entry);
    return data.signedUrl;
  })();

  const seed: Entry = current ?? { signedUrl: '', signedAt: 0 };
  seed.signedPromise = promise;
  cache.set(path, seed);
  return promise;
}

export async function getBlobUrlCached(
  path: string,
  mime: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const existing = cache.get(path);
  if (existing?.blobUrl) return existing.blobUrl;
  if (existing?.blobPromise) return existing.blobPromise;

  const promise = (async () => {
    const url = await getSignedUrlCached(path);
    if (!url) return null;
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const entry = cache.get(path) ?? { signedUrl: url, signedAt: Date.now() };
      entry.blobUrl = blobUrl;
      entry.blobPromise = undefined;
      cache.set(path, entry);
      return blobUrl;
    } catch {
      const e = cache.get(path);
      if (e) e.blobPromise = undefined;
      return null;
    }
  })();

  const seed: Entry = existing ?? { signedUrl: '', signedAt: 0 };
  seed.blobPromise = promise;
  cache.set(path, seed);
  return promise;
}

/** Faz prefetch leve apenas do signed URL (sem baixar o arquivo). */
export function prefetchSignedUrl(path: string): void {
  const current = cache.get(path);
  if ((current && isFresh(current)) || current?.signedPromise) return;
  void getSignedUrlCached(path);
}

// ------------------------------------------------------------------
// Sidecar OCR — busca versão pesquisável `<path>.ocr.pdf` se existir.
// Permite que PDFs escaneados fiquem com texto selecionável.
// ------------------------------------------------------------------

function sidecarPathOf(path: string): string {
  if (path.toLowerCase().endsWith('.pdf')) return path.slice(0, -4) + '.ocr.pdf';
  return path + '.ocr.pdf';
}

const sidecarResolved = new Map<string, string | null>();
const sidecarInflight = new Map<string, Promise<string | null>>();

/**
 * Retorna o signed URL do sidecar OCR (`<path>.ocr.pdf`) se existir no bucket,
 * ou null caso contrário. Resultado cacheado em memória por sessão.
 */
export async function getSearchablePdfUrl(path: string): Promise<string | null> {
  if (!path.toLowerCase().endsWith('.pdf') || path.toLowerCase().endsWith('.ocr.pdf')) {
    return null;
  }
  if (sidecarResolved.has(path)) {
    return sidecarResolved.get(path)!;
  }
  const inflight = sidecarInflight.get(path);
  if (inflight) return inflight;

  const promise = (async () => {
    const out = sidecarPathOf(path);
    const dir = out.includes('/') ? out.substring(0, out.lastIndexOf('/')) : '';
    const name = out.substring(out.lastIndexOf('/') + 1);
    try {
      const { data } = await supabase.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
      if (!data?.some((e) => e.name === name)) {
        sidecarResolved.set(path, null);
        return null;
      }
      const url = await getSignedUrlCached(out);
      sidecarResolved.set(path, url);
      return url;
    } catch {
      sidecarResolved.set(path, null);
      return null;
    } finally {
      sidecarInflight.delete(path);
    }
  })();

  sidecarInflight.set(path, promise);
  return promise;
}

/** Invalida cache do sidecar para forçar nova verificação. */
export function invalidateSearchablePdfCache(path: string): void {
  sidecarResolved.delete(path);
  sidecarInflight.delete(path);
}

