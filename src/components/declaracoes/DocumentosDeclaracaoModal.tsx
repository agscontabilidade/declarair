import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Eye, User, Briefcase } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';

interface Props {
  declaracaoId: string | null;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocItem {
  id: string;
  nome_documento: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_recebimento: string | null;
  categoria: string;
}

export function DocumentosDeclaracaoModal({ declaracaoId, clienteNome, open, onOpenChange }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewerCurrentId, setViewerCurrentId] = useState<string | null>(null);

  const { data: docs = [] as DocItem[], isLoading } = useQuery({
    queryKey: ['documentos-declaracao', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [] as DocItem[];
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, arquivo_url, arquivo_nome, data_recebimento, categoria')
        .eq('declaracao_id', declaracaoId)
        .not('arquivo_url', 'is', null)
        .order('data_recebimento', { ascending: false });
      if (error) throw error;
      return (data || []) as DocItem[];
    },
    enabled: !!declaracaoId && open,
  });

  const grupos = useMemo(() => {
    const contador = docs.filter(d => d.categoria === 'contador');
    const cliente = docs.filter(d => d.categoria !== 'contador');
    return { contador, cliente };
  }, [docs]);

  const viewerFiles = useMemo<ViewerFile[]>(
    () =>
      docs
        .filter(d => d.arquivo_url)
        .map(d => ({
          id: d.id,
          arquivo_url: d.arquivo_url!,
          arquivo_nome: d.arquivo_nome || d.nome_documento,
        })),
    [docs]
  );

  async function baixarArquivo(path: string, id: string) {
    try {
      setDownloadingId(id);
      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 5, { download: true });
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch {
      toast.error('Não foi possível baixar o arquivo');
    } finally {
      setDownloadingId(null);
    }
  }

  function renderDoc(d: DocItem) {
    return (
      <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors">
        <button
          type="button"
          onClick={() => d.arquivo_url && setViewerCurrentId(d.id)}
          className="flex items-start gap-3 min-w-0 flex-1 text-left group"
        >
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {d.arquivo_nome || d.nome_documento}
            </p>
            {d.data_recebimento && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Enviado em {formatDate(d.data_recebimento)}
              </p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => d.arquivo_url && setViewerCurrentId(d.id)}
            disabled={!d.arquivo_url}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Visualizar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => d.arquivo_url && baixarArquivo(d.arquivo_url, d.id)}
            disabled={downloadingId === d.id || !d.arquivo_url}
            title="Baixar"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos da declaração</DialogTitle>
            <DialogDescription>
              {clienteNome
                ? `Arquivos enviados pelo cliente ${clienteNome} e pelo contador`
                : 'Arquivos enviados pelo cliente e pelo contador'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum documento enviado ainda
                </p>
              </div>
            ) : (
              <>
                {grupos.cliente.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Enviados pelo cliente ({grupos.cliente.length})
                      </h3>
                    </div>
                    <div className="space-y-2">{grupos.cliente.map(renderDoc)}</div>
                  </section>
                )}
                {grupos.contador.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Anexados pelo contador ({grupos.contador.length})
                      </h3>
                    </div>
                    <div className="space-y-2">{grupos.contador.map(renderDoc)}</div>
                  </section>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FileViewerModal
        files={viewerFiles}
        currentId={viewerCurrentId}
        onClose={() => setViewerCurrentId(null)}
        onChange={setViewerCurrentId}
      />
    </>
  );
}
