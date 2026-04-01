import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload, CheckCircle2, Clock, XCircle, Briefcase, Heart,
  GraduationCap, Home, User, PiggyBank, Landmark, FileWarning, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'bg-warning/15 text-warning' },
  recebido: { label: 'Enviado', icon: CheckCircle2, color: 'bg-success/15 text-success' },
  dispensado: { label: 'Dispensado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

interface ChecklistDoc {
  id: string;
  nome_documento: string;
  categoria: string;
  obrigatorio: boolean;
  status: string;
  arquivo_nome: string | null;
  arquivo_url: string | null;
}

interface Props {
  checklist: ChecklistDoc[];
  declaracaoId: string;
  escritorioId: string;
  clienteId: string;
}

export function StepDocumentos({ checklist, declaracaoId, escritorioId, clienteId }: Props) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const handleUpload = async (docId: string, file: File) => {
    setUploading(docId);
    try {
      const path = `${escritorioId}/${clienteId}/${docId}/${file.name}`;
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

      toast.success('Documento enviado!');
      queryClient.invalidateQueries({ queryKey: ['formulario-checklist'] });
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
    if (file && activeDocId) handleUpload(activeDocId, file);
    e.target.value = '';
  };

  // Group by category
  const grouped = checklist.reduce<Record<string, ChecklistDoc[]>>((acc, doc) => {
    const cat = CATEGORIAS_RF.includes(doc.categoria as CategoriaRF) ? doc.categoria : 'documentos_pessoais';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const totalDocs = checklist.length;
  const recebidos = checklist.filter(d => d.status === 'recebido').length;
  const pendentes = checklist.filter(d => d.status === 'pendente').length;
  const progressPct = totalDocs > 0 ? Math.round((recebidos / totalDocs) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold">Envio de Documentos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Com base no seu perfil fiscal, estes são os documentos necessários. Envie o que puder agora — os pendentes serão cobrados automaticamente.
        </p>
      </div>

      {/* Progress */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Progresso</p>
          <span className="text-sm font-bold text-accent tabular-nums">{recebidos}/{totalDocs}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
        {pendentes > 0 && (
          <p className="text-xs text-warning mt-2 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {pendentes} documento{pendentes > 1 ? 's' : ''} pendente{pendentes > 1 ? 's' : ''} — você pode enviar depois, mas seu contador será notificado.
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.webp"
        onChange={handleFileChange}
      />

      {/* By category */}
      {CATEGORIAS_RF.map((catKey) => {
        const docs = grouped[catKey];
        if (!docs || docs.length === 0) return null;
        const meta = CATEGORIA_META[catKey];
        const catRecebidos = docs.filter(d => d.status === 'recebido').length;
        const Icon = meta.icon;

        return (
          <Card key={catKey} className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  {meta.label}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {catRecebidos}/{docs.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-4">
              {docs.map((doc) => {
                const statusMeta = STATUS_META[doc.status] || STATUS_META.pendente;
                const StatusIcon = statusMeta.icon;
                const isUploading = uploading === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                    <div className="shrink-0 ml-2">
                      {doc.status === 'pendente' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerUpload(doc.id)}
                          disabled={isUploading}
                          className="gap-1 text-xs h-8"
                        >
                          <Upload className="h-3 w-3" />
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
  );
}
