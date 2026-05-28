import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ClipboardCopy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// pdf.js worker — bundled by Vite via ?url
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props {
  url: string;
  nome: string;
  /** Called when streaming render fails — parent can switch to a blob URL fallback. */
  onStreamError?: () => void;
  /** Storage path used to call OCR for scanned PDFs (optional). */
  storagePath?: string;
}

export function PdfViewer({ url, nome, onStreamError, storagePath }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.8);
  const [error, setError] = useState<string | null>(null);
  const [extractingText, setExtractingText] = useState(false);
  const [hasNativeText, setHasNativeText] = useState<boolean | null>(null);
  const pdfDocRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const fallbackTriedRef = useRef(false);

  // Reset fallback flag when the URL changes (new file).
  useEffect(() => {
    fallbackTriedRef.current = false;
    setError(null);
    setHasNativeText(null);
  }, [url]);

  // Stable options object — recreating it forces pdf.js to reload the document.
  const documentOptions = useMemo(
    () => ({
      // pdf.js will use Range requests when the server supports them, giving
      // first-page render before the full file is downloaded.
      disableStream: false,
      disableAutoFetch: false,
    }),
    [],
  );

  // Memoize the file source so <Document> doesn't reload on unrelated re-renders.
  const fileSource = useMemo(() => ({ url }), [url]);

  const onLoadSuccess = useCallback(async (pdf: import('pdfjs-dist').PDFDocumentProxy) => {
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setError(null);
    // Detecta uma única vez se o PDF tem texto nativo (≥ 50 chars na 1ª pág)
    try {
      const firstPage = await pdf.getPage(1);
      const tc = await firstPage.getTextContent();
      const txt = tc.items.map((it) => ('str' in it ? it.str : '')).join('').trim();
      setHasNativeText(txt.length >= 50);
    } catch {
      setHasNativeText(false);
    }
  }, []);


  const onLoadError = useCallback((err: Error) => {
    console.error('[PdfViewer] load error', err);
    // Try the blob fallback once (handles servers without Range support).
    if (!fallbackTriedRef.current && onStreamError) {
      fallbackTriedRef.current = true;
      onStreamError();
      return;
    }
    setError('Não foi possível renderizar este PDF. Use "Abrir em nova aba" no topo do modal.');
  }, [onStreamError]);

  const handleCopyText = useCallback(async () => {
    const pdf = pdfDocRef.current;
    if (!pdf || extractingText) return;
    setExtractingText(true);
    const toastId = toast.loading('Extraindo texto…');
    try {
      // 1) tenta texto nativo via pdf.js
      let nativeText = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        nativeText += tc.items.map((it) => ('str' in it ? it.str : '')).join(' ');
        nativeText += '\n\n';
      }
      const trimmed = nativeText.trim();
      if (trimmed.length >= 50) {
        await navigator.clipboard.writeText(trimmed);
        toast.success('Texto copiado para a área de transferência', { id: toastId });
        return;
      }
      // 2) escaneado → OCR sob demanda
      if (!storagePath) {
        toast.error('Este PDF é escaneado e não contém texto', { id: toastId });
        return;
      }
      toast.loading('Reconhecendo texto via OCR (pode levar alguns segundos)…', { id: toastId });
      const { data, error } = await supabase.functions.invoke('ocr-pdf-searchable', {
        body: { path: storagePath, mode: 'text' },
      });
      if (error) throw error;
      const result = data as { status?: string; text?: string; error?: string };
      if (result?.status === 'skipped_too_large') {
        toast.error('PDF muito grande para OCR (máx. 3MB)', { id: toastId });
        return;
      }
      if (result?.status !== 'ready' || !result.text) {
        throw new Error(result?.error || 'falha no OCR');
      }
      await navigator.clipboard.writeText(result.text);
      toast.success('Texto copiado para a área de transferência', { id: toastId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao extrair texto';
      toast.error(msg, { id: toastId });
    } finally {
      setExtractingText(false);
    }
  }, [extractingText, storagePath]);


  return (
    <div className="w-full h-full flex flex-col bg-muted rounded-md overflow-hidden select-text">
      <div className="flex-1 min-h-0 overflow-auto flex justify-center p-4">
        {error ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            {error}
          </div>
        ) : (
          <Document
            file={fileSource}
            options={documentOptions}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={<Skeleton className="w-[600px] h-[800px]" />}
            error={<div className="text-sm text-muted-foreground">Erro ao carregar PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              loading={<Skeleton className="w-[600px] h-[800px]" />}
              className="select-text"
            />
          </Document>
        )}
      </div>

      {!error && numPages > 0 && (
        <div className="flex items-center justify-center gap-1 py-1 px-2 border-t bg-card">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            title="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-2" />

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            disabled={scale <= 0.5}
            title="Diminuir zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            disabled={scale >= 3}
            title="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setScale(1.8)}
            title="Redefinir zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-2" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs"
            onClick={handleCopyText}
            disabled={extractingText}
            title="Copiar texto do PDF"
          >
            {extractingText ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
            Copiar texto
          </Button>
        </div>
      )}
    </div>
  );
}
