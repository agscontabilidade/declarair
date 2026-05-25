import { useState, useRef } from 'react';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, CheckCircle2, Clock, XCircle, Briefcase, Heart,
  GraduationCap, Home, AlertCircle, User, PiggyBank,
  Landmark, FileWarning, Send, FileStack, Trash2, Loader2,
  AlertTriangle, HelpCircle, FileText
} from 'lucide-react';
import { RelacaoDocumentosModal } from '@/components/cliente-portal/RelacaoDocumentosModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useClientePortal } from '@/hooks/useClientePortal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CategoriaRF } from '@/lib/checklistPorPerfil';
import { CATEGORIAS_RF } from '@/lib/checklistPorPerfil';

const CATEGORIA_META: Record<CategoriaRF, { label: string; icon: React.ElementType; color: string }> = {
  documentos_pessoais: { label: 'Documentos Pessoais', icon: User, color: 'text-primary' },
  rendimentos_tributaveis: { label: 'Rendimentos Tributáveis', icon: Briefcase, color: 'text-accent' },
  rendimentos_isentos: { label: 'Rendimentos Isentos', icon: Landmark, color: 'text-blue-500' },
  deducoes_saude: { label: 'Deduções – Saúde', icon: Heart, color: 'text-rose-500' },
  deducoes_educacao: { label: 'Deduções – Educação', icon: GraduationCap, color: 'text-violet-500' },
  deducoes_previdencia: { label: 'Deduções – Previdência', icon: PiggyBank, color: 'text-emerald-500' },
  bens_direitos: { label: 'Bens e Direitos', icon: Home, color: 'text-warning' },
  dividas_onus: { label: 'Dívidas e Ônus', icon: FileWarning, color: 'text-orange-500' },
};

const LEGACY_MAP: Record<string, CategoriaRF> = {
  rendimentos: 'rendimentos_tributaveis',
  deducoes: 'deducoes_saude',
  outros: 'documentos_pessoais',
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'bg-warning/15 text-warning' },
  recebido: { label: 'Enviado', icon: CheckCircle2, color: 'bg-success/15 text-success' },
  dispensado: { label: 'Dispensado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

export default function ClienteDocumentos() {
  const { declaracao, checklist, isLoading } = useClientePortal();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [relacaoModalOpen, setRelacaoModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    console.log('[upload] start', {
      count: list.length,
      hasDeclaracao: !!declaracao,
      clienteId: profile.clienteId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
    });

    if (!profile.clienteId) {
      toast.error('Sessão inválida. Faça login novamente.');
      console.warn('[upload] aborted: no clienteId in profile');
      return;
    }

    // Se não existe declaração, cria uma para o ano corrente automaticamente
    let declaracaoInicial = declaracao;
    if (!declaracaoInicial) {
      console.warn('[upload] sem declaracao, tentando criar para o ano corrente');
      const { data: cli, error: cliErr } = await supabase
        .from('clientes')
        .select('escritorio_id')
        .eq('id', profile.clienteId)
        .maybeSingle();
      if (cliErr || !cli?.escritorio_id) {
        console.error('[upload] nao foi possivel obter escritorio_id do cliente', cliErr);
        toast.error('Não foi possível identificar seu escritório. Contate seu contador.');
        return;
      }
      const anoAtual = new Date().getFullYear();
      const { data: nova, error: novaErr } = await supabase
        .from('declaracoes')
        .insert({
          cliente_id: profile.clienteId,
          escritorio_id: cli.escritorio_id,
          ano_base: anoAtual,
          status: 'aguardando_documentos',
        })
        .select('id, cliente_id, escritorio_id, ano_base, status')
        .single();
      if (novaErr || !nova) {
        console.error('[upload] falha ao criar declaracao inicial', novaErr);
        const msg = novaErr?.message || '';
        if (msg.includes('LIMITE_PLANO_ATINGIDO')) {
          toast.error('O escritório atingiu o limite de declarações do plano. Peça ao seu contador para liberar mais uma.');
        } else {
          toast.error('Não foi possível preparar sua declaração. Contate seu contador.');
        }
        return;
      }
      declaracaoInicial = nova as typeof declaracaoInicial;
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
    }


    const MAX_BYTES = 20 * 1024 * 1024; // 20MB
    const oversize = list.filter((f) => f.size > MAX_BYTES);
    if (oversize.length > 0) {
      toast.error(
        `Arquivo muito grande (máx 20MB): ${oversize.map((f) => f.name).join(', ')}`
      );
      console.warn('[upload] oversize files', oversize.map((f) => ({ name: f.name, size: f.size })));
      return;
    }

    setUploading(true);
    let successCount = 0;
    const failures: { name: string; reason: string }[] = [];

    // Garante que o upload seja vinculado a uma declaração do ano corrente.
    // Se a declaração ativa for de outro ano, busca/cria uma do ano atual.
    let declaracaoAtiva = declaracaoInicial;
    const anoAtual = new Date().getFullYear();
    if (declaracaoAtiva.ano_base !== anoAtual) {
      console.warn('[upload] declaracao ativa nao eh do ano corrente, redirecionando', {
        ano_ativo: declaracaoAtiva.ano_base,
        ano_atual: anoAtual,
      });
      const { data: doAno } = await supabase
        .from('declaracoes')
        .select('id, cliente_id, escritorio_id, ano_base, status')
        .eq('cliente_id', profile.clienteId)
        .eq('ano_base', anoAtual)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (doAno) {
        declaracaoAtiva = { ...declaracaoAtiva, ...doAno } as typeof declaracaoAtiva;
      } else {
        const { data: nova, error: novaErr } = await supabase
          .from('declaracoes')
          .insert({
            cliente_id: profile.clienteId,
            escritorio_id: declaracaoAtiva.escritorio_id,
            ano_base: anoAtual,
            status: 'aguardando_documentos',
          })
          .select('id, cliente_id, escritorio_id, ano_base, status')
          .single();
        if (novaErr || !nova) {
          console.error('[upload] falha ao criar declaracao do ano corrente', novaErr);
          const msg = novaErr?.message || '';
          if (msg.includes('LIMITE_PLANO_ATINGIDO')) {
            toast.error('O escritório atingiu o limite de declarações do plano. Peça ao seu contador para liberar mais uma.');
          } else {
            toast.error('Não foi possível preparar a declaração do ano corrente. Contate seu contador.');
          }
          setUploading(false);
          return;
        }
        declaracaoAtiva = { ...declaracaoAtiva, ...nova } as typeof declaracaoAtiva;
      }

      // Atualiza caches do portal para refletir a nova declaração
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
    }

    try {
      for (const file of list) {
        const timestamp = Date.now();
        const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const path = `${declaracaoAtiva.escritorio_id}/${profile.clienteId}/geral/${safeName}`;

        console.log('[upload] uploading', { name: file.name, size: file.size, type: file.type, path });

        const { error: uploadError } = await supabase.storage
          .from('documentos-clientes')
          .upload(path, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream',
          });

        if (uploadError) {
          console.error('[upload] storage error', { name: file.name, error: uploadError });
          failures.push({ name: file.name, reason: uploadError.message });
          continue;
        }

        const { error: insertError } = await supabase
          .from('checklist_documentos')
          .insert({
            declaracao_id: declaracaoAtiva.id,
            nome_documento: file.name,
            arquivo_url: path,
            arquivo_nome: file.name,
            status: 'recebido',
            categoria: 'documento_enviado',
            obrigatorio: false,
            data_recebimento: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[upload] db insert error', { name: file.name, error: insertError });
          // Best-effort cleanup of orphan storage object
          await supabase.storage.from('documentos-clientes').remove([path]).catch(() => undefined);
          failures.push({ name: file.name, reason: insertError.message });
          continue;
        }

        console.log('[upload] ok', { name: file.name });
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) carregado(s) com sucesso!`);

        const { data: updRows, error: updErr } = await supabase
          .from('declaracoes')
          .update({
            status_documentos: 'enviado',
            status: 'documentacao_recebida',
            ultima_atualizacao_status: new Date().toISOString(),
          })
          .eq('id', declaracaoAtiva.id)
          .select('id');

        if (updErr) {
          console.error('[upload] declaracao update error', updErr);
          toast.error(`Documentos salvos, mas falha ao atualizar status: ${updErr.message}`);
        } else if (!updRows || updRows.length === 0) {
          console.error('[upload] declaracao update afetou 0 linhas (RLS?)', { id: declaracaoAtiva.id });
          toast.error('Documentos salvos, mas o status não pôde ser atualizado. Avise seu contador.');
        }

        // Notifica o contador
        const { error: notifErr } = await supabase.from('notificacoes').insert({
          escritorio_id: declaracaoAtiva.escritorio_id,
          titulo: '📂 Documentos Enviados',
          mensagem: `O cliente ${profile.nome} enviou documentos.`,
          link_destino: `/declaracoes/${declaracaoAtiva.id}`,
        });
        if (notifErr) console.error('[upload] notificacao insert error', notifErr);


        // Sincroniza com o painel do contador (drive, checklist, lista de declarações)
        queryClient.invalidateQueries({ queryKey: ['cliente-checklist'] });
        queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
        queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
        queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs'] });
        queryClient.invalidateQueries({ queryKey: ['declaracao-checklist'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
        queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
      }

      if (failures.length > 0) {
        toast.error(
          `Falha em ${failures.length} arquivo(s): ${failures.map((f) => `${f.name} (${f.reason})`).join('; ')}`,
          { duration: 8000 }
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[upload] unexpected error', err);
      toast.error(`Erro inesperado no upload: ${message}`);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected after a failure
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFinalize = async () => {
    if (!declaracao) return;
    
    setSending(true);
    try {
      const { data: updRows, error } = await supabase
        .from('declaracoes')
        .update({ 
          status_documentos: 'enviado',
          status: 'documentacao_recebida',
          ultima_atualizacao_status: new Date().toISOString()
        })
        .eq('id', declaracao.id)
        .select('id');

      if (error) throw error;
      if (!updRows || updRows.length === 0) {
        console.error('[finalize] update afetou 0 linhas (RLS?)', { id: declaracao.id });
        throw new Error('Não foi possível atualizar o status da declaração.');
      }

      // Notify accountant
      const { error: notifErr } = await supabase.from('notificacoes').insert({
        escritorio_id: declaracao.escritorio_id,
        titulo: '📂 Documentos Enviados',
        mensagem: `O cliente ${profile.nome} enviou os documentos para conferência.`,
        link_destino: `/declaracoes/${declaracao.id}`,
      });
      if (notifErr) console.error('[finalize] notificacao insert error', notifErr);

      toast.success('Documentos enviados ao contador com sucesso!');
      setConcluido(true);
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar documentos';
      console.error('[finalize] erro', err);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const removeFile = async (docId: string, filePath: string, fileName: string) => {
    if (!declaracao?.id) {
      toast.error('Declaração não encontrada.');
      return;
    }
    try {

      const { error: storageError } = await supabase.storage
        .from('documentos-clientes')
        .remove([filePath]);
      
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('checklist_documentos')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      // Notify accountant
      const { error: notifErr } = await supabase.from('notificacoes').insert({
        escritorio_id: declaracao.escritorio_id,
        titulo: '🗑️ Documento Removido',
        mensagem: `O cliente ${profile.nome} removeu o documento "${fileName}" às ${new Date().toLocaleTimeString('pt-BR')}.`,
        link_destino: `/clientes/${declaracao.cliente_id}`,
      });
      if (notifErr) console.error('[remove] notificacao insert error', notifErr);

      // Se após a remoção não houver mais documentos, volta o status para aguardando
      const { data: rest } = await supabase
        .from('checklist_documentos')
        .select('id')
        .eq('declaracao_id', declaracao.id)
        .eq('status', 'recebido');

      if (!rest || rest.length === 0) {
        await supabase
          .from('declaracoes')
          .update({ 
            status: 'aguardando_documentos',
            status_documentos: 'pendente' 
          })
          .eq('id', declaracao.id);
      }



      toast.success('Arquivo removido');
      queryClient.invalidateQueries({ queryKey: ['cliente-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs', declaracao.id] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracao.id] });
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao', declaracao.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracao.id] });
    } catch (err: any) {
      console.error('[removeFile] error', err);
      toast.error(err?.message ? `Erro ao remover: ${err.message}` : 'Erro ao remover arquivo');
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </ClienteLayout>
    );
  }

  if (concluido) {
    return (
      <ClienteLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-20 w-20 text-success mb-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Documentos Enviados!</h2>
          <p className="text-muted-foreground max-w-md">
            Seus documentos foram enviados com sucesso para análise do seu contador. Você será notificado sobre qualquer atualização.
          </p>
        </div>
      </ClienteLayout>
    );
  }

  const recebidos = checklist.filter((d: { status: string }) => d.status === 'recebido');
  const docsEnviadosAoContador = (declaracao as { status_documentos?: string } | null)?.status_documentos === 'enviado';

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Card de ajuda - Relação de documentos */}
        <Card className="border-warning/30 bg-warning/5 shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:contents">
              <div className="h-11 w-11 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Não sabe quais documentos enviar?
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Consulte a relação completa de documentos necessários para sua declaração de IRPF 2026.
                </p>
              </div>
            </div>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setRelacaoModalOpen(true)}
                  className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90 shrink-0 w-full sm:w-auto"
                >
                  <FileText className="h-4 w-4" />
                  Ver lista de documentos
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs">
                Lista completa por categoria fiscal: rendimentos, deduções de saúde e educação, bens, dívidas e mais.
              </TooltipContent>
            </Tooltip>


          </CardContent>
        </Card>

        <RelacaoDocumentosModal open={relacaoModalOpen} onOpenChange={setRelacaoModalOpen} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie e envie seus documentos para o contador</p>
          </div>
          {recebidos.length > 0 && !docsEnviadosAoContador && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleFinalize}
                  disabled={sending}
                  className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar ao Contador
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                Finaliza o envio e notifica seu contador. Você ainda pode anexar novos documentos depois, mas o contador será avisado de cada novo upload.
              </TooltipContent>
            </Tooltip>
          )}
          {docsEnviadosAoContador && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Badge className="bg-success/15 text-success py-1.5 px-3 border-success/30 self-start sm:self-auto cursor-help">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enviado ao Contador
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                Seus documentos já foram entregues para análise. Novos uploads continuam sendo aceitos e o contador será notificado.
              </TooltipContent>
            </Tooltip>
          )}

        </div>

        {/* Upload Zone */}
        {!docsEnviadosAoContador && (
          <Card 
            className={`border-2 border-dashed transition-all duration-200 ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 cursor-help">
                    {uploading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Upload className="h-6 w-6 text-primary" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  Aceitamos PDF, imagens (JPG/PNG), DOC e XLS. Limite de 20 MB por arquivo.
                </TooltipContent>
              </Tooltip>
              <h3 className="text-lg font-semibold">Arraste e solte seus documentos aqui</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs">
                Você pode selecionar vários arquivos de uma vez (PDF, Imagens, DOC, XLS).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                Selecionar Arquivos
              </Button>
            </CardContent>

          </Card>
        )}

        {/* Count info */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <FileStack className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {recebidos.length > 0 
                  ? `${recebidos.length} arquivo(s) anexado(s)` 
                  : "Nenhum arquivo anexado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grid of documents */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm border-success/20">
            <CardHeader className="pb-3 border-b bg-success/5">
              <CardTitle className="text-base flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Arquivos Anexados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recebidos.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Nenhum arquivo anexado ainda. Comece arrastando arquivos para a área acima.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recebidos.map((doc: { id: string; arquivo_nome: string; data_recebimento: string; arquivo_url?: string | null }) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.arquivo_nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enviado em {new Date(doc.data_recebimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <AlertDialog>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                aria-label="Excluir documento"
                                className="text-destructive transition-colors hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">Excluir documento</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">

                              <AlertTriangle className="h-5 w-5" />
                              Confirmar Exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Você tem certeza que deseja excluir o documento <strong>{doc.arquivo_nome}</strong>? 
                              Esta ação não pode ser desfeita e seu contador será notificado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeFile(doc.id, doc.arquivo_url, doc.arquivo_nome)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClienteLayout>
  );
}
