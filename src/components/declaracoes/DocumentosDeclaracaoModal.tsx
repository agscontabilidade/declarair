import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Eye, User, Briefcase, Upload, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';
import { getErrorMessage } from '@/lib/errors';
import { useDeleteDocumento } from '@/hooks/useDeleteDocumento';

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
  lancado: boolean;
}

interface DeclaracaoCtx {
  escritorio_id: string;
  cliente_id: string;
  ano_base: number;
}

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 20 * 1024 * 1024;

export function DocumentosDeclaracaoModal({ declaracaoId, clienteNome, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerCurrentId = searchParams.get('doc');
  const setViewerCurrentId = useCallback((id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('doc', id);
    else next.delete('doc');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: ctx } = useQuery({
    queryKey: ['declaracao-ctx', declaracaoId],
    queryFn: async (): Promise<DeclaracaoCtx | null> => {
      if (!declaracaoId) return null;
      const { data, error } = await supabase
        .from('declaracoes')
        .select('escritorio_id, cliente_id, ano_base')
        .eq('id', declaracaoId)
        .single();
      if (error) throw error;
      return data as DeclaracaoCtx;
    },
    enabled: !!declaracaoId && open,
  });

  const { data: docs = [] as DocItem[], isLoading } = useQuery({
    queryKey: ['documentos-declaracao', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [] as DocItem[];
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, arquivo_url, arquivo_nome, data_recebimento, categoria, lancado')
        .eq('declaracao_id', declaracaoId)
        .not('arquivo_url', 'is', null)
        .order('data_recebimento', { ascending: false });
      if (error) throw error;
      return ((data || []) as DocItem[]).filter(d => !d.arquivo_url?.includes('/_analise_caixa/'));
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
          lancado: d.lancado,
        })),
    [docs]
  );

  const { deleteDoc, deletingId } = useDeleteDocumento({
    getFiles: () => viewerFiles,
    onAfterDelete: (_remaining, nextId) => setViewerCurrentId(nextId),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      if (!ctx || !declaracaoId) throw new Error('Declaração não carregada');
      for (const file of files) {
        if (!ALLOWED.includes(file.type)) throw new Error(`Tipo não permitido: ${file.name}`);
        if (file.size > MAX_SIZE) throw new Error(`Arquivo > 20MB: ${file.name}`);
      }
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.-]/g, '_');
        const path = `${ctx.escritorio_id}/${ctx.cliente_id}/contador-${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('documentos-clientes')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from('checklist_documentos').insert({
          declaracao_id: declaracaoId,
          nome_documento: file.name,
          categoria: 'contador',
          obrigatorio: false,
          status: 'recebido',
          arquivo_url: path,
          arquivo_nome: file.name,
          data_recebimento: new Date().toISOString(),
        });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      toast.success('Arquivo(s) enviado(s) e sincronizado(s) com o Drive');
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
      // Trigger no banco move status p/ documentacao_recebida; sincroniza Kanban/lista
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao enviar arquivo')),
  });

  const remover = useMutation({
    mutationFn: async (doc: DocItem) => {
      if (doc.arquivo_url) {
        await supabase.storage.from('documentos-clientes').remove([doc.arquivo_url]);
      }
      const { error } = await supabase.from('checklist_documentos').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Arquivo removido');
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao remover')),
  });

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
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao atualizar status')),
  });

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

  function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) upload.mutate(files);
    e.target.value = '';
  }

  function renderDoc(d: DocItem, removable = false) {
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
          onClick={() => d.arquivo_url && setViewerCurrentId(d.id)}
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
          {removable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm('Remover este arquivo? Essa ação também o remove do Drive.')) {
                  remover.mutate(d);
                }
              }}
              title="Remover"
              className="text-destructive hover-action-neg"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
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

          <div className="flex items-center justify-between gap-2 pb-2 border-b">
            <p className="text-xs text-muted-foreground">
              Os arquivos enviados aqui aparecem automaticamente no Drive do cliente.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onSelectFiles}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending || !ctx}
            >
              {upload.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" /> Enviar arquivo</>
              )}
            </Button>
          </div>

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
                    <div className="space-y-2">{grupos.cliente.map(d => renderDoc(d, false))}</div>
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
                    <div className="space-y-2">{grupos.contador.map(d => renderDoc(d, true))}</div>
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
        onToggleLancado={(id, novoValor) => toggleLancado.mutate({ id, novoValor })}
        togglingLancadoId={toggleLancado.isPending ? toggleLancado.variables?.id ?? null : null}
        onDelete={async (id) => { await deleteDoc.mutateAsync(id); }}
        deletingId={deletingId}
      />
    </>
  );
}
