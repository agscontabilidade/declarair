import { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, ExternalLink, X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getFileType, getFileExtension, getMimeFromName } from '@/lib/file-types';
import { PdfViewer } from './viewers/PdfViewer';
import { ImageViewer } from './viewers/ImageViewer';
import { TextViewer } from './viewers/TextViewer';
import { OfficeViewer } from './viewers/OfficeViewer';
import { UnsupportedViewer } from './viewers/UnsupportedViewer';

export interface ViewerFile {
  id: string;
  arquivo_url: string;
  arquivo_nome: string;
  lancado?: boolean;
}

interface Props {
  files: ViewerFile[];
  currentId: string | null;
  onClose: () => void;
  onChange: (id: string) => void;
  onToggleLancado?: (id: string, novoValor: boolean) => void;
  togglingLancadoId?: string | null;
}

interface CacheEntry {
  signedUrl: string;
  blobUrl?: string;
  blobPromise?: Promise<string | null>;
}

function iconForType(type: ReturnType<typeof getFileType>) {
  if (type === 'pdf') return FileText;
  if (type === 'image') return ImageIcon;
  if (type === 'office') return FileSpreadsheet;
  return FileIcon;
}

const BUCKET = 'documentos-clientes';
const SIGNED_TTL = 3600;

export function FileViewerModal({ files, currentId, onClose, onChange, onToggleLancado, togglingLancadoId }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [inlineUrl, setInlineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Session cache: lives while the modal is open. Revoked on close.
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const currentIndex = files.findIndex(f => f.id === currentId);
  const current = currentIndex >= 0 ? files[currentIndex] : null;
  const fileType = getFileType(current?.arquivo_nome);
  const ext = getFileExtension(current?.arquivo_nome).toUpperCase();
  const Icon = iconForType(fileType);
  const isLancado = !!current?.lancado;
  const isToggling = !!current && togglingLancadoId === current.id;

  // Get (or create) a signed URL for a given file id, cached.
  const getSignedUrl = useCallback(async (file: ViewerFile): Promise<string | null> => {
    const cached = cacheRef.current.get(file.id);
    if (cached?.signedUrl) return cached.signedUrl;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.arquivo_url, SIGNED_TTL);
    if (error || !data?.signedUrl) return null;
    const entry: CacheEntry = { ...(cached ?? { signedUrl: '' }), signedUrl: data.signedUrl };
    cacheRef.current.set(file.id, entry);
    return data.signedUrl;
  }, []);

  // Build a blob URL (for text viewer / PDF fallback) — cached + dedup'd.
  const getBlobUrl = useCallback(async (file: ViewerFile, signal?: AbortSignal): Promise<string | null> => {
    const cached = cacheRef.current.get(file.id);
    if (cached?.blobUrl) return cached.blobUrl;
    if (cached?.blobPromise) return cached.blobPromise;

    const promise = (async () => {
      const url = await getSignedUrl(file);
      if (!url) return null;
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const buf = await res.arrayBuffer();
        const mime = getMimeFromName(file.arquivo_nome);
        const blob = new Blob([buf], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const entry = cacheRef.current.get(file.id) ?? { signedUrl: url };
        entry.blobUrl = blobUrl;
        entry.blobPromise = undefined;
        cacheRef.current.set(file.id, entry);
        return blobUrl;
      } catch {
        const entry = cacheRef.current.get(file.id);
        if (entry) entry.blobPromise = undefined;
        return null;
      }
    })();

    const entry = cacheRef.current.get(file.id) ?? { signedUrl: '' };
    entry.blobPromise = promise;
    cacheRef.current.set(file.id, entry);
    return promise;
  }, [getSignedUrl]);

  // Main effect: switch current file — uses cache, streams PDFs/images via signed URL.
  useEffect(() => {
    if (!current) { setSignedUrl(null); setInlineUrl(null); return; }
    let cancelled = false;
    const controller = new AbortController();

    const type = getFileType(current.arquivo_nome);
    const cached = cacheRef.current.get(current.id);

    // Optimistic show from cache for instant transitions.
    if (cached?.signedUrl) {
      setSignedUrl(cached.signedUrl);
      // PDFs and images render directly off the signed URL — no need to wait
      // for blob conversion. Text viewer needs a fetched body.
      if (type === 'pdf' || type === 'image' || type === 'office' || type === 'unsupported') {
        setInlineUrl(cached.signedUrl);
        setLoading(false);
      } else if (cached.blobUrl) {
        setInlineUrl(cached.blobUrl);
        setLoading(false);
      } else {
        setInlineUrl(null);
        setLoading(true);
      }
    } else {
      setSignedUrl(null);
      setInlineUrl(null);
      setLoading(true);
    }

    (async () => {
      try {
        const url = await getSignedUrl(current);
        if (cancelled) return;
        if (!url) throw new Error('signed url failed');
        setSignedUrl(url);

        if (type === 'pdf' || type === 'image') {
          // Stream directly — pdf.js does range requests; <img> uses HTTP cache.
          setInlineUrl(url);
          setLoading(false);
        } else if (type === 'office' || type === 'unsupported') {
          setInlineUrl(url);
          setLoading(false);
        } else {
          // text / other → needs full body as blob for the TextViewer
          const blobUrl = await getBlobUrl(current, controller.signal);
          if (cancelled) return;
          if (blobUrl) setInlineUrl(blobUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          toast.error('Erro ao carregar arquivo');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [current, getSignedUrl, getBlobUrl]);

  // Prefetch neighbors (signed URL + warm browser HTTP cache for PDFs/images).
  useEffect(() => {
    if (!current) return;
    const neighbors = [files[currentIndex - 1], files[currentIndex + 1]].filter(Boolean) as ViewerFile[];
    const controller = new AbortController();

    neighbors.forEach(async (f) => {
      if (cacheRef.current.get(f.id)?.signedUrl) return;
      const url = await getSignedUrl(f);
      if (!url) return;
      const type = getFileType(f.arquivo_nome);
      if (type === 'pdf' || type === 'image') {
        // Warm HTTP cache silently. AbortController stops it on close/change.
        fetch(url, { signal: controller.signal, mode: 'cors' }).catch(() => {});
      }
    });

    return () => controller.abort();
  }, [current, currentIndex, files, getSignedUrl]);

  // Revoke all blob URLs when modal closes.
  useEffect(() => {
    if (currentId) return;
    const cache = cacheRef.current;
    cache.forEach((entry) => {
      if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    });
    cache.clear();
  }, [currentId]);

  // Also revoke on unmount.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.forEach((entry) => {
        if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
      });
      cache.clear();
    };
  }, []);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(files[currentIndex - 1].id);
  }, [currentIndex, files, onChange]);

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) onChange(files[currentIndex + 1].id);
  }, [currentIndex, files, onChange]);

  useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, goPrev, goNext]);

  const handleDownload = useCallback(() => {
    if (signedUrl) window.open(signedUrl, '_blank');
  }, [signedUrl]);

  // PDF fallback: if streaming render fails (e.g. no Range support), swap to blob URL.
  const handlePdfStreamError = useCallback(async () => {
    if (!current) return;
    const blobUrl = await getBlobUrl(current);
    if (blobUrl) setInlineUrl(blobUrl);
  }, [current, getBlobUrl]);

  return (
    <Dialog open={!!currentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 flex flex-col gap-0 rounded-none border-0 sm:rounded-none">
        <DialogTitle className="sr-only">{current?.arquivo_nome ?? 'Visualizador'}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 border-b bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground truncate">{current?.arquivo_nome}</span>
            {ext && <Badge variant="secondary" className="text-[10px] uppercase">{ext}</Badge>}
            {isLancado && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-success/15 text-success border border-success/30 hover:bg-success/20 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Lançado
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Documento já lançado no sistema</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleLancado && current && (
              <Button
                size="sm"
                variant={isLancado ? 'outline' : 'default'}
                className={cn(
                  'mr-1',
                  isLancado
                    ? 'border-success/40 text-success hover:bg-success/10'
                    : 'bg-success text-success-foreground hover:bg-success/90'
                )}
                onClick={() => onToggleLancado(current.id, !isLancado)}
                disabled={isToggling}
                title={isLancado ? 'Desmarcar como lançado' : 'Marcar como lançado'}
              >
                {isToggling ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                {isLancado ? 'Lançado' : 'Marcar como lançado'}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={goPrev} disabled={currentIndex <= 0} title="Anterior (←)">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2 tabular-nums">
              {currentIndex + 1} / {files.length}
            </span>
            <Button variant="ghost" size="icon" onClick={goNext} disabled={currentIndex >= files.length - 1} title="Próximo (→)">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!signedUrl} title="Baixar">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signedUrl && window.open(signedUrl, '_blank')} disabled={!signedUrl} title="Abrir em nova aba">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Fechar (Esc)">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-3 bg-background">
          {loading && !inlineUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : current ? (
            <>
              {fileType === 'pdf' && inlineUrl && (
                <PdfViewer url={inlineUrl} nome={current.arquivo_nome} onStreamError={handlePdfStreamError} />
              )}
              {fileType === 'image' && inlineUrl && <ImageViewer url={inlineUrl} nome={current.arquivo_nome} />}
              {fileType === 'text' && inlineUrl && <TextViewer url={inlineUrl} />}
              {fileType === 'office' && signedUrl && <OfficeViewer url={signedUrl} nome={current.arquivo_nome} />}
              {fileType === 'unsupported' && <UnsupportedViewer nome={current.arquivo_nome} onDownload={handleDownload} />}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
