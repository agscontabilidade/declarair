import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, FileCheck, Send, Loader2, Download } from 'lucide-react';
import { gerarCapaIR } from '@/lib/pdf/gerarCapaIR';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCPF } from '@/lib/formatters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaracao: any;
  escritorioData: {
    nome: string;
    email: string | null;
    telefone: string | null;
    logoUrl: string | null;
  } | null;
  contadorNome: string;
  onSendChat: (message: string) => Promise<void>;
}

export function EnviarDeclaracaoModal({ open, onOpenChange, declaracao, escritorioData, contadorNome, onSendChat }: Props) {
  const [declaracaoPdf, setDeclaracaoPdf] = useState<File | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'send'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const clienteNome = declaracao?.clientes?.nome || 'Cliente';
  const clienteCpf = declaracao?.clientes?.cpf || '';
  const clienteEmail = declaracao?.clientes?.email || '';
  const anoBase = declaracao?.ano_base?.toString() || '';
  const clienteId = declaracao?.clientes?.id;
  const escritorioId = declaracao?.escritorio_id;

  const defaultMessage = `Olá ${clienteNome},\n\nSua declaração de Imposto de Renda ${anoBase} foi concluída e transmitida com sucesso!\n\nSegue em anexo o documento completo com a capa e a declaração.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n${contadorNome}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setDeclaracaoPdf(file);
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const handleGerarDocumento = async () => {
    if (!declaracaoPdf) return;
    setProcessing(true);
    try {
      // 1. Generate capa PDF as bytes
      const capaBytes = await gerarCapaIR({
        nomeCliente: clienteNome,
        cpfCliente: formatCPF(clienteCpf),
        anoBase,
        nomeEscritorio: escritorioData?.nome || '',
        nomeContador: contadorNome,
        telefoneEscritorio: escritorioData?.telefone || '',
        emailEscritorio: escritorioData?.email || '',
        logoUrl: escritorioData?.logoUrl || null,
      }, true);

      // 2. Read uploaded declaration PDF
      const declBuffer = await declaracaoPdf.arrayBuffer();

      // 3. Merge: capa first, then declaration
      const mergedPdf = await PDFDocument.create();
      
      const capaPdfDoc = await PDFDocument.load(capaBytes);
      const capaPages = await mergedPdf.copyPages(capaPdfDoc, capaPdfDoc.getPageIndices());
      capaPages.forEach(page => mergedPdf.addPage(page));

      const declPdfDoc = await PDFDocument.load(declBuffer);
      const declPages = await mergedPdf.copyPages(declPdfDoc, declPdfDoc.getPageIndices());
      declPages.forEach(page => mergedPdf.addPage(page));

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);

      if (!mensagem) {
        setMensagem(defaultMessage);
      }
      setStep('preview');
      toast.success('Documento gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
      toast.error('Erro ao gerar o documento. Verifique se o PDF da declaração é válido.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const a = document.createElement('a');
    a.href = mergedPdfUrl;
    a.download = `Declaracao_IR_${clienteNome.replace(/\s+/g, '_')}_${anoBase}.pdf`;
    a.click();
  };

  const handleEnviar = async () => {
    if (!mergedPdfUrl || !mensagem.trim()) return;
    setProcessing(true);
    try {
      // 1. Upload merged PDF to storage
      const response = await fetch(mergedPdfUrl);
      const blob = await response.blob();
      const fileName = `Declaracao_IR_${clienteNome.replace(/\s+/g, '_')}_${anoBase}.pdf`;
      const storagePath = `${escritorioId}/${clienteId}/declaracao-completa/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(storagePath, blob, { upsert: true, contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      // 2. Get signed URL for the client
      const { data: signedData } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30); // 30 days

      const downloadUrl = signedData?.signedUrl || '';

      // 3. Send chat message with link
      const fullMessage = `${mensagem.trim()}\n\n📎 Documento completo disponível para download:\n${downloadUrl}`;
      await onSendChat(fullMessage);

      toast.success('Declaração enviada ao cliente com sucesso!');
      handleClose();
    } catch (err) {
      console.error('Erro ao enviar:', err);
      toast.error('Erro ao enviar a declaração ao cliente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setDeclaracaoPdf(null);
    setMensagem('');
    setMergedPdfUrl(null);
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Declaração ao Cliente
          </DialogTitle>
          <DialogDescription>
            Anexe a declaração transmitida, gere o documento completo com capa e envie ao cliente.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Declaração PDF (arquivo transmitido pela Receita Federal)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
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

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>📋 O sistema irá:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Gerar automaticamente a capa personalizada do escritório</li>
                <li>Unir a capa + declaração em um único PDF</li>
                <li>Disponibilizar para download e envio ao cliente</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
              <FileCheck className="h-4 w-4" />
              Documento gerado com sucesso! Capa + Declaração unificados.
            </div>

            <Button variant="outline" className="w-full" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar documento completo
            </Button>

            <div className="space-y-2">
              <Label>Mensagem para o cliente</Label>
              <Textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                rows={6}
                placeholder="Escreva uma mensagem personalizada..."
              />
              <p className="text-xs text-muted-foreground">
                O link para download do documento será incluído automaticamente na mensagem.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          
          {step === 'upload' && (
            <Button
              onClick={handleGerarDocumento}
              disabled={!declaracaoPdf || processing}
            >
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Gerando...</>
              ) : (
                <><FileText className="h-4 w-4 mr-1" /> Gerar Documento</>
              )}
            </Button>
          )}

          {step === 'preview' && (
            <Button
              onClick={handleEnviar}
              disabled={!mensagem.trim() || processing}
            >
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-1" /> Enviar ao Cliente</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
