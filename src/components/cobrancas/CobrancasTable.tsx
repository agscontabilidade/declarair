import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Edit, X, Trash2, DollarSign, CreditCard, QrCode, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { usePermissoes } from '@/hooks/usePermissoes';
import { GerarBoletoModal, VerQrModal, VerBoletoModal } from './PixBoletoModals';

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  pago: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

interface CobrancasTableProps {
  cobrancas: any[];
  isLoading: boolean;
  onMarcarPago: (id: string) => void;
  onEditar: (cobranca: any) => void;
  onCancelar: (id: string) => void;
  onExcluir: (id: string) => void;
  interAtivo?: boolean;
}

export function CobrancasTable({ cobrancas, isLoading, onMarcarPago, onEditar, onCancelar, onExcluir, interAtivo = false }: CobrancasTableProps) {
  const { podeExcluirCobranca } = usePermissoes();
  const [gerarModal, setGerarModal] = useState<any>(null);
  const [qrModal, setQrModal] = useState<{ pixQrcode: string; pixQrcodeUrl?: string } | null>(null);
  const [boletoModal, setBoletoModal] = useState<{ linhaDigitavel: string; codigoBarras?: string; pdfUrl?: string } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (cobrancas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground font-medium">Nenhuma cobrança encontrada</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cobrança</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cobrancas.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.clientes?.nome || '—'}</TableCell>
              <TableCell>{c.descricao}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.valor))}</TableCell>
              <TableCell>{formatDate(c.data_vencimento)}</TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[c.status] || ''}>{STATUS_LABELS[c.status] || c.status}</Badge>
              </TableCell>
              <TableCell>
                {(c.status === 'pendente' || c.status === 'atrasado') ? (
                  c.pix_qrcode ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setQrModal({ pixQrcode: c.pix_qrcode, pixQrcodeUrl: c.pix_qrcode_url })}>
                        <QrCode className="h-3 w-3 mr-1" /> QR
                      </Button>
                      {c.boleto_linha_digitavel && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setBoletoModal({ linhaDigitavel: c.boleto_linha_digitavel, codigoBarras: c.boleto_codigo_barras, pdfUrl: c.boleto_pdf_url })}>
                          <FileText className="h-3 w-3 mr-1" /> Boleto
                        </Button>
                      )}
                    </div>
                  ) : interAtivo ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setGerarModal(c)}>
                      <CreditCard className="h-3 w-3 mr-1" /> Gerar
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {(c.status === 'pendente' || c.status === 'atrasado') && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => onMarcarPago(c.id)} title="Marcar como pago">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {c.status !== 'pago' && c.status !== 'cancelado' && (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditar(c)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => onCancelar(c.id)} title="Cancelar">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {c.status === 'cancelado' && podeExcluirCobranca && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onExcluir(c.id)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <GerarBoletoModal open={!!gerarModal} onOpenChange={v => { if (!v) setGerarModal(null); }} cobranca={gerarModal} />
      {qrModal && <VerQrModal open={!!qrModal} onOpenChange={v => { if (!v) setQrModal(null); }} pixQrcode={qrModal.pixQrcode} pixQrcodeUrl={qrModal.pixQrcodeUrl} />}
      {boletoModal && <VerBoletoModal open={!!boletoModal} onOpenChange={v => { if (!v) setBoletoModal(null); }} linhaDigitavel={boletoModal.linhaDigitavel} codigoBarras={boletoModal.codigoBarras} pdfUrl={boletoModal.pdfUrl} />}
    </>
  );
}
