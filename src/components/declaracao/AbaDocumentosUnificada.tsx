import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Download, Eye, User, Briefcase, Plus, ListChecks } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';

interface ChecklistItem {
  id: string;
  nome_documento: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_recebimento: string | null;
  categoria: string;
  status: string;
  obrigatorio: boolean;
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
  const [viewerCurrentId, setViewerCurrentId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: items = [] as ChecklistItem[], isLoading } = useQuery({
    queryKey: ['declaracao-aba-docs', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, arquivo_url, arquivo_nome, data_recebimento, categoria, status, obrigatorio')
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
  const pendentes = useMemo(() => items.filter(i => i.status === 'pendente' && !i.arquivo_url), [items]);
  const obrigatorios = useMemo(() => items.filter(i => i.obrigatorio), [items]);
  const recebidos = obrigatorios.filter(i => i.status === 'recebido').length;
  const progressPct = obrigatorios.length > 0 ? (recebidos / obrigatorios.length) * 100 : 0;

  const grupos = useMemo(() => ({
    contador: docs.filter(d => d.categoria === 'contador'),
    cliente: docs.filter(d => d.categoria !== 'contador'),
  }), [docs]);

  const viewerFiles = useMemo<ViewerFile[]>(
    () => docs.map(d => ({
      id: d.id,
      arquivo_url: d.arquivo_url!,
      arquivo_nome: d.arquivo_nome || d.nome_documento,
    })),
    [docs]
  );

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
    return (
      <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors">
        <button
          type="button"
          onClick={() => setViewerCurrentId(d.id)}
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
      {obrigatorios.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Documentos obrigatórios recebidos</span>
              <span className="text-sm text-muted-foreground">{recebidos}/{obrigatorios.length}</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardContent>
        </Card>
      )}

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

      {pendentes.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="pendentes" className="border-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <ListChecks className="h-4 w-4 text-amber-600" />
                    <span className="font-medium">Itens pendentes do checklist</span>
                    <Badge variant="outline" className="text-[10px]">{pendentes.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5 mt-2">
                    {pendentes.map(p => (
                      <li key={p.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {p.nome_documento}
                        {p.obrigatorio && <Badge variant="outline" className="text-[9px] py-0 px-1">obrigatório</Badge>}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      <FileViewerModal
        files={viewerFiles}
        currentId={viewerCurrentId}
        onClose={() => setViewerCurrentId(null)}
        onChange={setViewerCurrentId}
      />
    </div>
  );
}
