import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  declaracaoId: string | null;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  recebido: 'bg-emerald-100 text-emerald-800',
  dispensado: 'bg-gray-100 text-gray-700',
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  dispensado: 'Dispensado',
};

export function DocumentosDeclaracaoModal({ declaracaoId, clienteNome, open, onOpenChange }: Props) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['checklist-documentos', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [];
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, categoria, status, obrigatorio, arquivo_url, arquivo_nome, data_recebimento')
        .eq('declaracao_id', declaracaoId)
        .order('obrigatorio', { ascending: false })
        .order('nome_documento');
      if (error) throw error;
      return data || [];
    },
    enabled: !!declaracaoId && open,
  });

  async function abrirArquivo(path: string, id: string) {
    try {
      setOpeningId(id);
      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 5);
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
          <DialogTitle>Documentos da declaração</DialogTitle>
          <DialogDescription>
            {clienteNome ? `Documentos enviados por ${clienteNome}` : 'Lista de documentos do checklist'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum documento no checklist</p>
            </div>
          ) : (
            docs.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{d.nome_documento}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{d.categoria}</Badge>
                      <Badge className={`text-[10px] ${STATUS_COLORS[d.status] || ''}`}>
                        {STATUS_LABEL[d.status] || d.status}
                      </Badge>
                      {d.obrigatorio && <span className="text-[10px] text-muted-foreground">obrigatório</span>}
                      {d.data_recebimento && (
                        <span className="text-[10px] text-muted-foreground">recebido em {formatDate(d.data_recebimento)}</span>
                      )}
                    </div>
                  </div>
                </div>
                {d.arquivo_url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirArquivo(d.arquivo_url, d.id)}
                    disabled={openingId === d.id}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Abrir
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
