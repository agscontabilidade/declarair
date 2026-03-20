import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_LABELS, formatCurrency, formatDate } from '@/lib/formatters';
import { CheckCircle, Plus, Receipt } from 'lucide-react';
import { NovaCobrancaModal } from './NovaCobrancaModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const statusColors: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  pago: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-muted text-muted-foreground',
};

interface Props {
  cobrancas: any[];
  isLoading: boolean;
  onMarcarPago: (id: string) => void;
  onCriarCobranca: (input: { descricao: string; valor: number; data_vencimento: string }) => void;
  criandoCobranca: boolean;
}

export function AbaCobrancas({ cobrancas, isLoading, onMarcarPago, onCriarCobranca, criandoCobranca }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const totalPago = cobrancas.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor), 0);
  const totalPendente = cobrancas.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
  const totalAtrasado = cobrancas.filter(c => c.status === 'atrasado').reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pago</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pendente</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Atrasado</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalAtrasado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Cobrança
            </Button>
          </div>
          {cobrancas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma cobrança cadastrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobrancas.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell>{formatCurrency(c.valor)}</TableCell>
                    <TableCell>{formatDate(c.data_vencimento)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status] || 'bg-muted text-muted-foreground'}>
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(c.status === 'pendente' || c.status === 'atrasado') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Marcar esta cobrança como paga? A data de pagamento será registrada como hoje.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onMarcarPago(c.id)}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NovaCobrancaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={(data) => {
          onCriarCobranca(data);
          setModalOpen(false);
        }}
        isPending={criandoCobranca}
      />
    </div>
  );
}
