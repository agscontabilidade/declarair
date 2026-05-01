import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
}

interface Props {
  files: ViewerFile[];
  currentId: string | null;
  onClose: () => void;
  onChange: (id: string) => void;
}

function iconForType(type: ReturnType<typeof getFileType>) {
  if (type === 'pdf') return FileText;
  if (type === 'image') return ImageIcon;
  if (type === 'office') return FileSpreadsheet;
  return FileIcon;
}

export function FileViewerModal({ files, currentId, onClose, onChange }: Props) {
  // signedUrl: original URL (used by Office Online viewer + download/open buttons)
  // inlineUrl: blob: URL with forced MIME — used by PDF/image/text viewers so the
  // browser ALWAYS renders inline (storage may serve some files as octet-stream
  // or with attachment disposition, which would otherwise force a download).
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [inlineUrl, setInlineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentIndex = files.findIndex(f => f.id === currentId);
  const current = currentIndex >= 0 ? files[currentIndex] : null;
  const fileType = getFileType(current?.arquivo_nome);
  const ext = getFileExtension(current?.arquivo_nome).toUpperCase();
  const Icon = iconForType(fileType);

  useEffect(() => {
    if (!current) { setSignedUrl(null); setInlineUrl(null); return; }
    let cancelled = false;
    let createdBlobUrl: string | null = null;
    setLoading(true);
    setSignedUrl(null);
    setInlineUrl(null);

    (async () => {
      try {
        const { data, error } = await supabase.storage
          .from('documentos-clientes')
          .createSignedUrl(current.arquivo_url, 3600);
        if (error || !data?.signedUrl) throw error ?? new Error('no signed url');
        if (cancelled) return;
        setSignedUrl(data.signedUrl);

        // Office viewer needs a public URL — skip blob conversion.
        // Unsupported types don't need to be fetched at all.
        if (fileType === 'office' || fileType === 'unsupported') {
          if (!cancelled) setLoading(false);
          return;
        }

        const res = await fetch(data.signedUrl);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const mime = getMimeFromName(current.arquivo_nome);
        const blob = new Blob([buf], { type: mime });
        createdBlobUrl = URL.createObjectURL(blob);
        setInlineUrl(createdBlobUrl);
      } catch {
        if (!cancelled) toast.error('Erro ao carregar arquivo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [current, fileType]);

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

  return (
    <Dialog open={!!currentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
        <DialogTitle className="sr-only">{current?.arquivo_nome ?? 'Visualizador'}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 border-b bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground truncate">{current?.arquivo_nome}</span>
            {ext && <Badge variant="secondary" className="text-[10px] uppercase">{ext}</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
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
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : current ? (
            <>
              {fileType === 'pdf' && inlineUrl && <PdfViewer url={inlineUrl} nome={current.arquivo_nome} />}
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
