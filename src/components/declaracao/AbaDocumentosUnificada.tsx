import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Download, Eye, User, Briefcase, Plus, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';
import { getErrorMessage } from '@/lib/errors';

interface ChecklistItem {
  id: string;
  nome_documento: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_recebimento: string | null;
  categoria: string;
  status: string;
  obrigatorio: boolean;
  lancado: boolean;
}

interface Props {
  declaracaoId: string;
  clienteNome?: string;
  onAddItem?: () => void;
}

/**
 * Aba unificada de documentos da declaração.
 * Mostra a MESMA listagem que o Drive (FileViewerModal inline),
 * agrupada em "Enviados pelo cliente" / "Anexados pelo contador".
 * Mantém o checklist de pendências em accordion separado.
 *
 * Ignora qualquer arquivo cujo path contenha `/_analise_caixa/`
 * (arquivos exclusivos da aba "Análise de Caixa", não vão para o Drive).
 */
export function AbaDocumentosUnificada({ declaracaoId, clienteNome, onAddItem }: Props) {
  const queryClient = useQueryClient();
  const [viewerCurrentId, setViewerCurrentId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: items = [] as ChecklistItem[], isLoading } = useQuery({
    queryKey: ['declaracao-aba-docs', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, arquivo_url, arquivo_nome, data_recebimento, categoria, status, obrigatorio, lancado')
        .eq('declaracao_id', declaracaoId)
        .order('data_recebimento', { ascending: false });
      if (error) throw error;
      return (data || []) as ChecklistItem[];
    },
    enabled: !!declaracaoId,
  });

  const docs = useMemo(
    () => items.filter(i => i.arquivo_url && !i.arquivo_url.includes('/_analise_caixa/')),
    [items]
  );

  const grupos = useMemo(() => ({
    contador: docs.filter(d => d.categoria === 'contador'),
    cliente: docs.filter(d => d.categoria !== 'contador'),
  }), [docs]);

  const viewerFiles = useMemo<ViewerFile[]>(
    () => docs.map(d => ({
      id: d.id,
      arquivo_url: d.arquivo_url!,
      arquivo_nome: d.arquivo_nome || d.nome_documento,
      lancado: d.lancado,
    })),
    [docs]
  );

  const toggleLancado = useMutation({
    mutationFn: async ({ id, novoValor }: { id: string; novoValor: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('checklist_documentos')
        .update({
          lancado: novoValor,
          lancado_em: novoValor ? new Date().toISOString() : null,
          lancado_por: novoValor ? userData.user?.id ?? null : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.novoValor ? 'Documento marcado como lançado' : 'Marcação removida');
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao atualizar status')),
  });

  async function baixar(path: string, id: string) {
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

  function renderDoc(d: ChecklistItem) {
    const lancado = d.lancado;
    return (
      <div
        key={d.id}
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors',
          lancado
            ? 'border-success/40 bg-success/5 hover:border-success/60'
            : 'hover:border-primary/40'
        )}
      >
        <button
          type="button"
          onClick={() => setViewerCurrentId(d.id)}
          className="flex items-start gap-3 min-w-0 flex-1 text-left group"
        >
          <div
            className={cn(
              'h-9 w-9 rounded-md flex items-center justify-center shrink-0 transition-colors',
              lancado ? 'bg-success/15 group-hover:bg-success/25' : 'bg-primary/10 group-hover:bg-primary/20'
            )}
          >
            {lancado ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <FileText className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p
                className={cn(
                  'font-medium text-sm truncate transition-colors',
                  lancado ? 'group-hover:text-success' : 'group-hover:text-primary'
                )}
              >
                {d.arquivo_nome || d.nome_documento}
              </p>
              {lancado && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Documento lançado</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {d.data_recebimento && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Enviado em {formatDate(d.data_recebimento)}
              </p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setViewerCurrentId(d.id)}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Visualizar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => baixar(d.arquivo_url!, d.id)}
            disabled={downloadingId === d.id}
            title="Baixar"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documentos da declaração</CardTitle>
          {onAddItem && (
            <Button size="sm" variant="outline" onClick={onAddItem}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar item
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento enviado ainda{clienteNome ? ` por ${clienteNome}` : ''}
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
        </CardContent>
      </Card>

      <FileViewerModal
        files={viewerFiles}
        currentId={viewerCurrentId}
        onClose={() => setViewerCurrentId(null)}
        onChange={setViewerCurrentId}
        onToggleLancado={(id, novoValor) => toggleLancado.mutate({ id, novoValor })}
        togglingLancadoId={toggleLancado.isPending ? toggleLancado.variables?.id ?? null : null}
      />
    </div>
  );
}
