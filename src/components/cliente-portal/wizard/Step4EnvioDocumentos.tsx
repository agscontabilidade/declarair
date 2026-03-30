import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { WizardStepProps } from '../WizardFormulario';

const DOCUMENTOS_SUGERIDOS = [
  'Informe de Rendimentos (empresa / empregador)',
  'Informe de Rendimentos Bancários',
  'Informe de Rendimentos de Investimentos (corretoras)',
  'Comprovante de despesas médicas',
  'Comprovante de despesas com educação',
  'Comprovante de pagamento de previdência privada (PGBL)',
  'Escritura / contrato de compra e venda de imóveis',
  'Documento de veículos (CRLV)',
  'Comprovante de financiamentos',
  'Comprovante de doações realizadas',
  'Recibos de aluguel (pago ou recebido)',
  'Carnê-leão (se autônomo)',
];

export default function Step4EnvioDocumentos({ data, onUpdate }: WizardStepProps) {
  const [arquivos, setArquivos] = useState<File[]>((data as any).arquivos_documentos || []);
  const [observacoes, setObservacoes] = useState<string>((data as any).observacoes || '');
  const [confirmado, setConfirmado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const progress = arquivos.length > 0 ? (confirmado ? 100 : 70) : 0;
    onUpdate({
      ...(data as any),
      arquivos_documentos: arquivos,
      observacoes,
      documentos_confirmados: confirmado,
    } as any, progress);
  }, [arquivos, observacoes, confirmado]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const oversized = newFiles.filter(f => f.size > 20 * 1024 * 1024);
    if (oversized.length) {
      toast.error(`${oversized.length} arquivo(s) excede(m) 20MB e não foram adicionados`);
    }
    const valid = newFiles.filter(f => f.size <= 20 * 1024 * 1024);
    setArquivos(prev => [...prev, ...valid]);
    if (valid.length) toast.success(`${valid.length} arquivo(s) adicionado(s)`);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFiles} />

      <div>
        <h3 className="text-lg font-semibold text-foreground">Envio de Documentos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Envie todos os documentos necessários para seu contador elaborar sua declaração
        </p>
      </div>

      {/* Checklist sugerido */}
      <div className="p-4 border border-border rounded-lg bg-muted/20">
        <h4 className="font-medium text-sm text-foreground mb-3">📋 Documentos comuns — verifique se possui:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {DOCUMENTOS_SUGERIDOS.map((doc, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {doc}
            </p>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
        <p className="font-medium text-foreground text-sm">Clique para selecionar arquivos</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC, XLS — Máx. 20MB por arquivo</p>
      </div>

      {/* Arquivos selecionados */}
      {arquivos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Arquivos selecionados ({arquivos.length})</Label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {arquivos.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações */}
      <div className="space-y-1.5">
        <Label>Observações para o contador</Label>
        <Textarea
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
          placeholder="Informe qualquer detalhe relevante para sua declaração (ex: vendi um imóvel em 2024, mudei de emprego, etc.)"
          rows={3}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">{observacoes.length}/2000</p>
      </div>

      {/* Confirmação */}
      {arquivos.length > 0 && (
        <Alert className={confirmado ? 'border-success/30 bg-success/5' : 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20'}>
          {confirmado ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
          <AlertDescription>
            <div className="flex items-start gap-3">
              <Checkbox id="confirmar-docs" checked={confirmado} onCheckedChange={(c) => setConfirmado(c === true)} className="mt-0.5" />
              <Label htmlFor="confirmar-docs" className="cursor-pointer text-sm leading-relaxed">
                Confirmo que enviei todos os documentos que possuo para a declaração. 
                Entendo que informações faltantes podem atrasar o processo.
              </Label>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
