import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    numero_recibo: string;
    data_transmissao: string;
    tipo_resultado: string;
    valor_resultado: number | null;
  }) => void;
  isPending: boolean;
}

export function TransmitidaModal({ open, onOpenChange, onSubmit, isPending }: Props) {
  const [recibo, setRecibo] = useState('');
  const [dataTransmissao, setDataTransmissao] = useState('');
  const [tipoResultado, setTipoResultado] = useState('');
  const [valorResultado, setValorResultado] = useState('');

  const isValid = recibo.trim() && dataTransmissao && tipoResultado &&
    (tipoResultado === 'nenhum' || valorResultado);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      numero_recibo: recibo.trim(),
      data_transmissao: dataTransmissao,
      tipo_resultado: tipoResultado,
      valor_resultado: tipoResultado !== 'nenhum' ? parseFloat(valorResultado) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Transmissão</DialogTitle>
          <DialogDescription>Preencha os dados obrigatórios para marcar como transmitida.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Número do Recibo *</Label>
            <Input value={recibo} onChange={e => setRecibo(e.target.value)} placeholder="Ex: 1234567890" />
          </div>
          <div className="space-y-2">
            <Label>Data da Transmissão *</Label>
            <Input type="date" value={dataTransmissao} onChange={e => setDataTransmissao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Resultado *</Label>
            <Select value={tipoResultado} onValueChange={setTipoResultado}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restituicao">Restituição</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="nenhum">Nenhum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tipoResultado && tipoResultado !== 'nenhum' && (
            <div className="space-y-2">
              <Label>Valor do Resultado (R$) *</Label>
              <Input type="number" step="0.01" value={valorResultado} onChange={e => setValorResultado(e.target.value)} placeholder="0,00" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending ? 'Salvando...' : 'Confirmar Transmissão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
