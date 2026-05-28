import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, ExternalLink, X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getFileType, getFileExtension, getMimeFromName } from '@/lib/file-types';
import { ImageViewer } from './viewers/ImageViewer';
import { TextViewer } from './viewers/TextViewer';
import { OfficeViewer } from './viewers/OfficeViewer';
import { UnsupportedViewer } from './viewers/UnsupportedViewer';
import { getSignedUrlCached, getBlobUrlCached, prefetchSignedUrl, getSearchablePdfUrl, invalidateSearchablePdfCache } from '@/lib/document-viewer-cache';
import { supabase } from '@/integrations/supabase/client';

// PDF viewer carregado sob demanda — evita arrastar ~180KB de react-pdf/pdfjs
// para páginas que apenas listam documentos.
const PdfViewer = lazy(() => import('./viewers/PdfViewer').then(m => ({ default: m.PdfViewer })));

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
  onDelete?: (id: string) => Promise<void> | void;
  deletingId?: string | null;
}

function iconForType(type: ReturnType<typeof getFileType>) {
  if (type === 'pdf') return FileText;
  if (type === 'image') return ImageIcon;
  if (type === 'office') return FileSpreadsheet;
  return FileIcon;
}

export function FileViewerModal({ files, currentId, onClose, onChange, onToggleLancado, togglingLancadoId, onDelete, deletingId }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [inlineUrl, setInlineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Blobs criados nesta sessão do modal — revogados ao fechar/desmontar
  // para não vazar memória. O signed URL é compartilhado (cache global).
  const ownedBlobsRef = useRef<Set<string>>(new Set());

  const currentIndex = files.findIndex(f => f.id === currentId);
  const current = currentIndex >= 0 ? files[currentIndex] : null;
  const fileType = getFileType(current?.arquivo_nome);
  const ext = getFileExtension(current?.arquivo_nome).toUpperCase();
  const Icon = iconForType(fileType);
  const isLancado = !!current?.lancado;
  const isToggling = !!current && togglingLancadoId === current.id;

  // Efeito principal: ao trocar de arquivo, exibe assim que o signed URL chega.
  useEffect(() => {
    if (!current) { setSignedUrl(null); setInlineUrl(null); return; }
    let cancelled = false;
    const controller = new AbortController();
    const type = getFileType(current.arquivo_nome);

    setLoading(true);
    setInlineUrl(null);

    (async () => {
      // PDF: prefere sidecar pesquisável (`<path>.ocr.pdf`) quando existir.
      let effectiveStoragePath = current.arquivo_url;
      if (type === 'pdf') {
        const sidecar = await getSearchablePdfUrl(current.arquivo_url);
        if (cancelled) return;
        if (sidecar) {
          setSignedUrl(sidecar);
          setInlineUrl(sidecar);
          setLoading(false);
          return;
        }
      }

      const url = await getSignedUrlCached(effectiveStoragePath);
      if (cancelled) return;
      if (!url) {
        toast.error('Erro ao carregar arquivo');
        setLoading(false);
        return;
      }
      setSignedUrl(url);

      if (type === 'pdf' || type === 'image' || type === 'office' || type === 'unsupported') {
        // PDFs streamam via Range; <img>/Office usam HTTP cache do browser.
        setInlineUrl(url);
        setLoading(false);
      } else {
        // text → precisa do conteúdo, mas o TextViewer também aceita signedUrl
        const blob = await getBlobUrlCached(
          current.arquivo_url,
          getMimeFromName(current.arquivo_nome),
          controller.signal,
        );
        if (cancelled) return;
        if (blob) {
          ownedBlobsRef.current.add(blob);
          setInlineUrl(blob);
        } else {
          setInlineUrl(url);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [current?.id, current?.arquivo_url]);

  // Prefetch leve apenas dos signed URLs dos vizinhos — não baixa o arquivo
  // inteiro para não competir com o arquivo atual em conexões lentas.
  useEffect(() => {
    if (!current) return;
    const prev = files[currentIndex - 1];
    const next = files[currentIndex + 1];
    if (prev) prefetchSignedUrl(prev.arquivo_url);
    if (next) prefetchSignedUrl(next.arquivo_url);

    // Imagens vizinhas: aquece o cache HTTP do browser após um pequeno
    // delay para o arquivo atual ter prioridade.
    const handle = window.setTimeout(() => {
      [prev, next].forEach(async (f) => {
        if (!f) return;
        if (getFileType(f.arquivo_nome) !== 'image') return;
        const u = await getSignedUrlCached(f.arquivo_url);
        if (!u) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = u;
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [current, currentIndex, files]);

  // Revoga blobs próprios ao fechar o modal.
  useEffect(() => {
    if (currentId) return;
    ownedBlobsRef.current.forEach(URL.revokeObjectURL);
    ownedBlobsRef.current.clear();
  }, [currentId]);

  // Revoga blobs próprios no unmount.
  useEffect(() => {
    const owned = ownedBlobsRef.current;
    return () => {
      owned.forEach(URL.revokeObjectURL);
      owned.clear();
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

  // PDF fallback: se o streaming falhar (sem Range), troca para blob.
  const handlePdfStreamError = useCallback(async () => {
    if (!current) return;
    const blob = await getBlobUrlCached(
      current.arquivo_url,
      getMimeFromName(current.arquivo_nome),
    );
    if (blob) {
      ownedBlobsRef.current.add(blob);
      setInlineUrl(blob);
    }
  }, [current]);

  // Trigger OCR sob demanda quando o PDF aberto não tem texto extraível
  // (escaneado). Substitui o inlineUrl pelo sidecar pesquisável ao concluir.
  const ocrTriggeredRef = useRef<Set<string>>(new Set());
  const handleScannedPdfDetected = useCallback(async () => {
    if (!current) return;
    const path = current.arquivo_url;
    if (path.toLowerCase().endsWith('.ocr.pdf')) return;
    if (ocrTriggeredRef.current.has(path)) return;
    ocrTriggeredRef.current.add(path);

    const toastId = toast.loading('Tornando PDF pesquisável…');
    try {
      const { data, error } = await supabase.functions.invoke('ocr-pdf-searchable', {
        body: { path },
      });
      if (error) throw error;
      const status = (data as { status?: string } | null)?.status;
      if (status === 'ready') {
        invalidateSearchablePdfCache(path);
        const sidecar = await getSearchablePdfUrl(path);
        if (sidecar) {
          setSignedUrl(sidecar);
          setInlineUrl(sidecar);
          toast.success('PDF pesquisável pronto', { id: toastId });
          return;
        }
      }
      if (status === 'skipped_too_large') {
        toast.dismiss(toastId);
        return;
      }
      toast.dismiss(toastId);
    } catch {
      toast.dismiss(toastId);
    }
  }, [current]);


  return (
    <Dialog open={!!currentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 flex flex-col gap-0 rounded-none border-0 sm:rounded-none">
        <DialogTitle className="sr-only">{current?.arquivo_nome ?? 'Visualizador'}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-b bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
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
            <Button variant="ghost" size="icon" onClick={() => signedUrl && window.open(signedUrl, '_blank')} disabled={!signedUrl} title="Abrir em nova aba">
              <ExternalLink className="h-4 w-4" />
            </Button>
            {onDelete && current && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deletingId === current.id}
                  title="Excluir"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingId === current.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} title="Fechar (Esc)">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-2 bg-background select-text">
          {loading && !inlineUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : current ? (
            <>
              {fileType === 'pdf' && inlineUrl && (
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div>}>
                  <PdfViewer url={inlineUrl} nome={current.arquivo_nome} onStreamError={handlePdfStreamError} onScannedDetected={handleScannedPdfDetected} />
                </Suspense>
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
