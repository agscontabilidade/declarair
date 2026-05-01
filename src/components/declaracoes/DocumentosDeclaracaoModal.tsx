import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  declaracaoId: string | null;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentosDeclaracaoModal({ declaracaoId, clienteNome, open, onOpenChange }: Props) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documentos-enviados-cliente', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [];
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, arquivo_url, arquivo_nome, data_recebimento')
        .eq('declaracao_id', declaracaoId)
        .not('arquivo_url', 'is', null)
        .order('data_recebimento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!declaracaoId && open,
  });

  async function abrirArquivo(path: string, id: string, download = false) {
    try {
      setOpeningId(id);
      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 5, download ? { download: true } : undefined);
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch {
      toast.error('Não foi possível abrir o arquivo');
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documentos enviados pelo cliente</DialogTitle>
          <DialogDescription>
            {clienteNome ? `Arquivos que ${clienteNome} enviou no portal` : 'Arquivos enviados pelo cliente no portal'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                O cliente ainda não enviou documentos
              </p>
            </div>
          ) : (
            docs.map((d: { id: string; arquivo_nome?: string | null; nome_documento?: string; data_recebimento?: string | null; arquivo_url?: string | null }) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{d.arquivo_nome || d.nome_documento}</p>
                    {d.data_recebimento && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Enviado em {formatDate(d.data_recebimento)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirArquivo(d.arquivo_url, d.id, false)}
                    disabled={openingId === d.id}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirArquivo(d.arquivo_url, d.id, true)}
                    disabled={openingId === d.id}
                    title="Baixar"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
