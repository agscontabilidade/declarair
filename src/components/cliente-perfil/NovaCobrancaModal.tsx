import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { descricao: string; valor: number; data_vencimento: string }) => void;
  isPending: boolean;
}

export function NovaCobrancaModal({ open, onOpenChange, onSubmit, isPending }: Props) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const handleSubmit = () => {
    if (!descricao || !valor || !dataVencimento) return;
    onSubmit({ descricao, valor: parseFloat(valor), data_vencimento: dataVencimento });
    setDescricao('');
    setValor('');
    setDataVencimento('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Cobrança</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Declaração IRPF 2025" />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !descricao || !valor || !dataVencimento}>
            {isPending ? 'Salvando...' : 'Criar Cobrança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
