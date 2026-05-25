import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// pdf.js worker — bundled by Vite via ?url
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props { url: string; nome: string }

export function PdfViewer({ url, nome }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [error, setError] = useState<string | null>(null);

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setError(null);
  }, []);

  const onLoadError = useCallback((err: Error) => {
    console.error('[PdfViewer] load error', err);
    setError('Não foi possível renderizar este PDF. Use "Abrir em nova aba" no topo do modal.');
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-muted rounded-md overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto flex justify-center p-4">
        {error ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            {error}
          </div>
        ) : (
          <Document
            file={url}
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
        <div className="flex items-center justify-center gap-2 p-2 border-t bg-card">
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
            onClick={() => setScale(1.2)}
            title="Redefinir zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
