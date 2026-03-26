import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import type { Divida } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step8Dividas({ data, onUpdate }: WizardStepProps) {
  const [items, setItems] = useState<Divida[]>(data.dividas || []);

  useEffect(() => {
    onUpdate({ dividas: items }, items.length > 0 ? 100 : 0);
  }, [items]);

  const addItem = () => setItems(prev => [...prev, {
    id: crypto.randomUUID(), tipo: '', credor: '', cpf_cnpj_credor: '',
    saldo_2024: 0, saldo_2025: 0, valor_pago_2025: 0,
  }]);

  const removeItem = (id: string) => setItems(prev => prev.filter(d => d.id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Dívidas e Ônus Reais</h3>
        <p className="text-sm text-muted-foreground mt-1">Financiamentos, empréstimos, consórcios</p>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma dívida cadastrada</p>
          <p className="text-xs mt-1">Se não possui dívidas, você pode finalizar</p>
        </div>
      )}

      {items.map((div, i) => (
        <div key={div.id} className="p-4 border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Dívida {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeItem(div.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Input value={div.tipo} onChange={e => updateItem(div.id, 'tipo', e.target.value)} placeholder="Financiamento, Empréstimo, Consórcio..." />
            </div>
            <div className="space-y-1.5">
              <Label>Credor *</Label>
              <Input value={div.credor} onChange={e => updateItem(div.id, 'credor', e.target.value)} placeholder="Banco, Financeira..." />
            </div>
            <div className="space-y-1.5">
              <Label>CPF/CNPJ do Credor *</Label>
              <Input value={div.cpf_cnpj_credor} onChange={e => updateItem(div.id, 'cpf_cnpj_credor', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Saldo em 31/12/2024 (R$)</Label>
              <Input type="number" step="0.01" value={div.saldo_2024 || ''} onChange={e => updateItem(div.id, 'saldo_2024', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Saldo em 31/12/2025 (R$)</Label>
              <Input type="number" step="0.01" value={div.saldo_2025 || ''} onChange={e => updateItem(div.id, 'saldo_2025', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Pago em 2025 (R$)</Label>
              <Input type="number" step="0.01" value={div.valor_pago_2025 || ''} onChange={e => updateItem(div.id, 'valor_pago_2025', Number(e.target.value))} />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Adicionar Dívida
      </Button>
    </div>
  );
}
