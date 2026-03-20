import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contadores: { id: string; nome: string }[];
  onSubmit: (data: { ano_base: number; contador_id: string | null }) => void;
  isPending: boolean;
}

const years = [2023, 2024, 2025, 2026];

export function NovaDeclaracaoModal({ open, onOpenChange, contadores, onSubmit, isPending }: Props) {
  const [anoBase, setAnoBase] = useState(String(new Date().getFullYear()));
  const [contadorId, setContadorId] = useState<string>('');

  const handleSubmit = () => {
    onSubmit({ ano_base: Number(anoBase), contador_id: contadorId || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Declaração</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Ano Base *</Label>
            <Select value={anoBase} onValueChange={setAnoBase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contador Responsável</Label>
            <Select value={contadorId} onValueChange={setContadorId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {contadores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Criando...' : 'Criar Declaração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
