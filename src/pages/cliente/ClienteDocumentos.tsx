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
  Landmark, FileWarning, Send, FileStack, Trash2, Loader2
} from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    if (!declaracao || !profile.clienteId) return;
    
    setUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        // Just upload as a new document entry, ignoring any checklist requirements
        const timestamp = Date.now();
        const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const path = `${declaracao.escritorio_id}/${profile.clienteId}/geral/${safeName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documentos-clientes')
          .upload(path, file, { upsert: true });
        
        if (uploadError) throw uploadError;

        // Create a new entry in checklist_documentos for this specific file
        await supabase
          .from('checklist_documentos')
          .insert({
            declaracao_id: declaracao.id,
            nome_documento: file.name,
            arquivo_url: path,
            arquivo_nome: file.name,
            status: 'recebido',
            categoria: 'documento_enviado',
            obrigatorio: false,
            data_recebimento: new Date().toISOString(),
          });

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) carregado(s) com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['cliente-checklist'] });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar arquivos');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = async () => {
    if (!declaracao) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('declaracoes')
        .update({ 
          status_documentos: 'enviado',
          status: 'documentacao_recebida',
          ultima_atualizacao_status: new Date().toISOString()
        })
        .eq('id', declaracao.id);

      if (error) throw error;

      // Notify accountant
      await supabase.from('notificacoes').insert({
        escritorio_id: declaracao.escritorio_id,
        titulo: '📂 Documentos Enviados',
        mensagem: `O cliente ${profile.nome} enviou os documentos para conferência.`,
        link_destino: `/declaracoes/${declaracao.id}`,
      });

      toast.success('Documentos enviados ao contador com sucesso!');
      setConcluido(true);
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao'] });
    } catch (err: any) {
      toast.error('Erro ao enviar documentos');
    } finally {
      setSending(false);
    }
  };

  const removeFile = async (docId: string, filePath: string) => {
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

      // Se após a remoção não houver mais documentos, volta o status para aguardando
      const { data: rest } = await supabase
        .from('checklist_documentos')
        .select('id')
        .eq('declaracao_id', declaracao?.id)
        .eq('status', 'recebido');

      if (!rest || rest.length === 0) {
        await supabase
          .from('declaracoes')
          .update({ status: 'aguardando_documentos' })
          .eq('id', declaracao?.id);
      }

      toast.success('Arquivo removido');
      queryClient.invalidateQueries({ queryKey: ['cliente-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao'] });
    } catch (err) {
      toast.error('Erro ao remover arquivo');
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

  const recebidos = checklist.filter((d: any) => d.status === 'recebido');
  const docsEnviadosAoContador = (declaracao as any)?.status_documentos === 'enviado';

  return (
    <ClienteLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie e envie seus documentos para o contador</p>
          </div>
          {recebidos.length > 0 && !docsEnviadosAoContador && (
            <Button 
              onClick={handleFinalize} 
              disabled={sending}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar ao Contador
            </Button>
          )}
          {docsEnviadosAoContador && (
            <Badge className="bg-success/15 text-success py-1.5 px-3 border-success/30">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enviado ao Contador
            </Badge>
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
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {uploading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Upload className="h-6 w-6 text-primary" />}
              </div>
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
                  {recebidos.map((doc: any) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.arquivo_nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enviado em {new Date(doc.data_recebimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!docsEnviadosAoContador && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(doc.id, doc.arquivo_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
