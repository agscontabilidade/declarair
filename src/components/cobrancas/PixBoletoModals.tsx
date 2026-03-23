import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, QrCode, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface GerarBoletoModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cobranca: any;
}

export function GerarBoletoModal({ open, onOpenChange, cobranca }: GerarBoletoModalProps) {
  if (!cobranca) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Cobrança via Banco Inter</DialogTitle>
          <DialogDescription>Esta funcionalidade será ativada quando a Edge Function estiver implantada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Dados da cobrança que serão enviados ao Inter:</p>
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <p><span className="font-medium">Pagador:</span> {cobranca.clientes?.nome || '—'}</p>
            <p><span className="font-medium">CPF:</span> {cobranca.clientes?.cpf || '—'}</p>
            <p><span className="font-medium">Valor:</span> {formatCurrency(Number(cobranca.valor))}</p>
            <p><span className="font-medium">Vencimento:</span> {formatDate(cobranca.data_vencimento)}</p>
          </div>
          <p className="text-xs text-muted-foreground">Para ativar esta funcionalidade, entre em contato com o suporte técnico.</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VerQrModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pixQrcode: string;
  pixQrcodeUrl?: string;
}

export function VerQrModal({ open, onOpenChange, pixQrcode, pixQrcodeUrl }: VerQrModalProps) {
  const copiar = () => {
    navigator.clipboard.writeText(pixQrcode);
    toast.success('Código PIX copiado!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> PIX QR Code</DialogTitle>
          <DialogDescription>Copie o código ou escaneie o QR Code</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {pixQrcodeUrl && (
            <div className="flex justify-center">
              <img src={pixQrcodeUrl} alt="QR Code PIX" className="w-48 h-48 rounded-lg border" />
            </div>
          )}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">PIX Copia e Cola:</p>
            <p className="text-xs font-mono break-all">{pixQrcode}</p>
          </div>
          <Button onClick={copiar} className="w-full"><Copy className="h-4 w-4 mr-2" /> Copiar código PIX</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VerBoletoModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  linhaDigitavel: string;
  codigoBarras?: string;
  pdfUrl?: string;
}

export function VerBoletoModal({ open, onOpenChange, linhaDigitavel, codigoBarras, pdfUrl }: VerBoletoModalProps) {
  const copiar = () => {
    navigator.clipboard.writeText(linhaDigitavel);
    toast.success('Linha digitável copiada!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Boleto</DialogTitle>
          <DialogDescription>Dados do boleto gerado</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Linha Digitável:</p>
            <p className="text-sm font-mono break-all">{linhaDigitavel}</p>
          </div>
          {codigoBarras && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Código de Barras:</p>
              <p className="text-xs font-mono break-all">{codigoBarras}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={copiar} className="flex-1"><Copy className="h-4 w-4 mr-2" /> Copiar linha digitável</Button>
            {pdfUrl && (
              <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" /> PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
