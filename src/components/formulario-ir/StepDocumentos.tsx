import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Upload, CheckCircle2, Clock, XCircle, Briefcase, Heart,
  GraduationCap, Home, User, PiggyBank, Landmark, FileWarning, AlertCircle, HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CategoriaRF } from '@/lib/checklistPorPerfil';
import { CATEGORIAS_RF, DOCUMENTO_TOOLTIPS } from '@/lib/checklistPorPerfil';

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

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const MAX_SIZE = 20 * 1024 * 1024;

export function StepDocumentos({ checklist, declaracaoId, escritorioId, clienteId }: Props) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading('bulk');
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'pdf';
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${escritorioId}/${clienteId}/${declaracaoId}/${safeName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documentos-clientes')
          .upload(path, file, { upsert: true });
        
        if (uploadError) throw uploadError;

        await supabase
          .from('checklist_documentos')
          .insert({
            declaracao_id: declaracaoId,
            nome_documento: file.name,
            arquivo_url: path,
            arquivo_nome: file.name,
            status: 'recebido',
            categoria: 'documento_enviado',
            obrigatorio: false,
            data_recebimento: new Date().toISOString(),
          });
      }

      toast.success('Documentos enviados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['formulario-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-documentos'] });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Erro ao enviar documentos: ${err?.message || 'Tente novamente'}`);
    } finally {
      setUploading(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleUpload(e.target.files);
    e.target.value = '';
  };

  const recebidos = checklist.filter(d => d.status === 'recebido');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold">Envio de Documentos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste seus documentos aqui ou clique para selecionar. O seu contador fará a conferência de tudo.
        </p>
      </div>

      <div 
        className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
        onClick={triggerUpload}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">Clique ou arraste arquivos para enviar</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC, XLS (Max 20MB)</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.webp"
        onChange={handleFileChange}
      />

      {recebidos.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Arquivos Anexados ({recebidos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recebidos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.arquivo_nome || doc.nome_documento}</p>
                  </div>
                </div>
                <Badge className="bg-success/15 text-success">Enviado</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
