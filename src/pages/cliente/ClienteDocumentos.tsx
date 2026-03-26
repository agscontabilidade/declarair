import { useState, useRef } from 'react';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, CheckCircle2, Clock, XCircle, Briefcase, Heart,
  GraduationCap, Home, FolderOpen, AlertCircle, User, PiggyBank,
  Landmark, FileWarning
} from 'lucide-react';
import { useClientePortal } from '@/hooks/useClientePortal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CategoriaRF } from '@/lib/checklistPorPerfil';
import { CATEGORIAS_RF, CATEGORIA_LABELS } from '@/lib/checklistPorPerfil';

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

// Fallback for legacy categories
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
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const handleUpload = async (docId: string, file: File) => {
    if (!declaracao || !profile.clienteId) return;
    setUploading(docId);
    try {
      const path = `${declaracao.escritorio_id}/${profile.clienteId}/${docId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('checklist_documentos')
        .update({
          arquivo_url: path,
          arquivo_nome: file.name,
          status: 'recebido',
          data_recebimento: new Date().toISOString(),
        })
        .eq('id', docId);
      if (updateError) throw updateError;

      toast.success('Documento enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['cliente-checklist'] });
    } catch {
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(null);
    }
  };

  const triggerUpload = (docId: string) => {
    setActiveDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocId) {
      handleUpload(activeDocId, file);
    }
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </ClienteLayout>
    );
  }

  if (!declaracao || checklist.length === 0) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum documento solicitado ainda</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Preencha seu perfil fiscal no formulário para gerar a lista de documentos</p>
            </CardContent>
          </Card>
        </div>
      </ClienteLayout>
    );
  }

  // Normalize legacy categories and group
  const normalizeCategory = (cat: string): CategoriaRF => {
    if (CATEGORIAS_RF.includes(cat as CategoriaRF)) return cat as CategoriaRF;
    return LEGACY_MAP[cat] || 'documentos_pessoais';
  };

  const grouped = checklist.reduce<Record<string, typeof checklist>>((acc, doc: any) => {
    const cat = normalizeCategory(doc.categoria || 'documentos_pessoais');
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const totalDocs = checklist.length;
  const recebidos = checklist.filter((d: any) => d.status === 'recebido').length;
  const progressPct = totalDocs > 0 ? Math.round((recebidos / totalDocs) * 100) : 0;
  const pendentes = checklist.filter((d: any) => d.status === 'pendente');

  return (
    <ClienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Envie os documentos solicitados pelo seu contador</p>
        </div>

        {/* Progress overview */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Progresso geral</p>
              <span className="text-sm font-bold text-accent tabular-nums">{recebidos}/{totalDocs}</span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            {pendentes.length > 0 && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {pendentes.length} documento{pendentes.length > 1 ? 's' : ''} pendente{pendentes.length > 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.webp"
          onChange={handleFileChange}
        />

        {/* Categories - 8 official RF categories */}
        {CATEGORIAS_RF.map((catKey) => {
          const docs = grouped[catKey];
          if (!docs || docs.length === 0) return null;
          const meta = CATEGORIA_META[catKey];
          const catRecebidos = docs.filter((d: any) => d.status === 'recebido').length;
          const Icon = meta.icon;

          return (
            <Card key={catKey} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                    {meta.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs tabular-nums">
                    {catRecebidos}/{docs.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {docs.map((doc: any) => {
                  const statusMeta = STATUS_META[doc.status] || STATUS_META.pendente;
                  const StatusIcon = statusMeta.icon;
                  const isUploading = uploading === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <StatusIcon className={`h-4 w-4 shrink-0 ${statusMeta.color.split(' ')[1]}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.nome_documento}</p>
                          {doc.arquivo_nome && (
                            <p className="text-xs text-muted-foreground truncate">{doc.arquivo_nome}</p>
                          )}
                        </div>
                        {doc.obrigatorio && (
                          <Badge variant="outline" className="text-[10px] py-0 shrink-0">Obrigatório</Badge>
                        )}
                      </div>
                      <div className="shrink-0 ml-3">
                        {doc.status === 'pendente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerUpload(doc.id)}
                            disabled={isUploading}
                            className="gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {isUploading ? 'Enviando...' : 'Enviar'}
                          </Button>
                        ) : doc.status === 'recebido' ? (
                          <Badge className={statusMeta.color}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ClienteLayout>
  );
}
