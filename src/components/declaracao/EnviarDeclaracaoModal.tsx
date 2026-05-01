import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, FileCheck, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaracao: { id?: string; ano_base?: number; escritorio_id?: string; clientes?: { id?: string; nome?: string; cpf?: string; email?: string } | null } | null | undefined;
  contadorNome: string;
  onSendChat: (message: string) => Promise<void>;
}

export function EnviarDeclaracaoModal({ open, onOpenChange, declaracao, contadorNome, onSendChat }: Props) {
  const [declaracaoPdf, setDeclaracaoPdf] = useState<File | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'message'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const clienteNome = declaracao?.clientes?.nome || 'Cliente';
  const anoBase = declaracao?.ano_base?.toString() || '';
  const clienteId = declaracao?.clientes?.id;
  const escritorioId = declaracao?.escritorio_id;

  const defaultMessage = `Olá ${clienteNome},\n\nSua declaração de Imposto de Renda ${anoBase} foi concluída e transmitida com sucesso!\n\nSegue em anexo o arquivo da declaração transmitida.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n${contadorNome}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setDeclaracaoPdf(file);
      setStep('message');
      if (!mensagem) setMensagem(defaultMessage);
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const handleEnviar = async () => {
    if (!declaracaoPdf || !mensagem.trim()) return;
    setProcessing(true);
    try {
      const fileName = `Declaracao_IR_${clienteNome.replace(/\s+/g, '_')}_${anoBase}.pdf`;
      const storagePath = `${escritorioId}/${clienteId}/declaracoes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(storagePath, declaracaoPdf, { upsert: true, contentType: 'application/pdf' });
      
      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30); // 30 days

      const downloadUrl = signedData?.signedUrl || '';
      const fullMessage = `${mensagem.trim()}\n\n📎 Documento para download:\n${downloadUrl}`;
      
      await onSendChat(fullMessage);

      toast.success('Declaração enviada com sucesso!');
      handleClose();
    } catch (err) {
      console.error('Erro ao enviar:', err);
      toast.error('Erro ao enviar a declaração.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setDeclaracaoPdf(null);
    setMensagem('');
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Declaração
          </DialogTitle>
          <DialogDescription>
            Anexe a declaração transmitida e envie ao cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Arquivo da Declaração (PDF)</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                declaracaoPdf ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
            >
              {declaracaoPdf ? (
                <div className="flex items-center justify-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium">{declaracaoPdf.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(declaracaoPdf.size / 1024).toFixed(0)} KB
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar o PDF da declaração
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {step === 'message' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label>Mensagem para o cliente</Label>
                <Textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  rows={6}
                  placeholder="Escreva uma mensagem..."
                />
                <p className="text-[10px] text-muted-foreground">
                  O link para download será incluído automaticamente ao final.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleEnviar}
            disabled={!declaracaoPdf || !mensagem.trim() || processing}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="h-4 w-4 mr-1" /> Enviar ao Cliente</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
