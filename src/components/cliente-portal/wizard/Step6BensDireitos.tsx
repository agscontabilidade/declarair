import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Home } from 'lucide-react';
import type { BemDireito } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step6BensDireitos({ data, onUpdate }: WizardStepProps) {
  const [items, setItems] = useState<BemDireito[]>(data.bens_direitos || []);

  useEffect(() => {
    onUpdate({ bens_direitos: items }, items.length > 0 ? 100 : 0);
  }, [items]);

  const addItem = () => setItems(prev => [...prev, {
    id: crypto.randomUUID(), tipo: '', descricao: '', valor_2024: 0, valor_2025: 0,
  }]);

  const removeItem = (id: string) => setItems(prev => prev.filter(b => b.id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Bens e Direitos</h3>
        <p className="text-sm text-muted-foreground mt-1">Imóveis, veículos, contas bancárias, investimentos</p>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Home className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum bem cadastrado</p>
        </div>
      )}

      {items.map((bem, i) => (
        <div key={bem.id} className="p-4 border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Bem {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeItem(bem.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Input value={bem.tipo} onChange={e => updateItem(bem.id, 'tipo', e.target.value)} placeholder="Imóvel, Veículo, Conta Corrente..." />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Descrição *</Label>
              <Textarea value={bem.descricao} onChange={e => updateItem(bem.id, 'descricao', e.target.value)} placeholder="Apartamento 2 quartos, Rua..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor em 31/12/2024 (R$)</Label>
              <Input type="number" step="0.01" value={bem.valor_2024 || ''} onChange={e => updateItem(bem.id, 'valor_2024', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor em 31/12/2025 (R$)</Label>
              <Input type="number" step="0.01" value={bem.valor_2025 || ''} onChange={e => updateItem(bem.id, 'valor_2025', Number(e.target.value))} />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Adicionar Bem ou Direito
      </Button>
    </div>
  );
}
