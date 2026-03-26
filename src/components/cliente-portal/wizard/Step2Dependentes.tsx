import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import type { Dependente } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

const PARENTESCO_LABELS: Record<string, string> = {
  filho: 'Filho(a)', conjuge: 'Cônjuge', pai: 'Pai', mae: 'Mãe', outro: 'Outro',
};

export default function Step2Dependentes({ data, onUpdate }: WizardStepProps) {
  const [items, setItems] = useState<Dependente[]>(data.dependentes || []);

  useEffect(() => {
    const progress = items.length === 0 ? 100 : items.every(d => d.nome && d.cpf && d.data_nascimento) ? 100 : 50;
    onUpdate({ dependentes: items }, progress);
  }, [items]);

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), nome: '', cpf: '', data_nascimento: '', grau_parentesco: 'filho' }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(d => d.id !== id));

  const updateItem = (id: string, field: keyof Dependente, value: string) => {
    setItems(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Dependentes</h3>
        <p className="text-sm text-muted-foreground mt-1">Informe seus dependentes para dedução no IR</p>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum dependente adicionado</p>
          <p className="text-xs mt-1">Se não possui dependentes, avance para a próxima etapa</p>
        </div>
      )}

      {items.map((dep, i) => (
        <div key={dep.id} className="p-4 border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Dependente {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeItem(dep.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input value={dep.nome} onChange={e => updateItem(dep.id, 'nome', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Input value={dep.cpf} onChange={e => updateItem(dep.id, 'cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Nascimento *</Label>
              <Input type="date" value={dep.data_nascimento} onChange={e => updateItem(dep.id, 'data_nascimento', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Grau de Parentesco *</Label>
              <Select value={dep.grau_parentesco} onValueChange={v => updateItem(dep.id, 'grau_parentesco', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PARENTESCO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Adicionar Dependente
      </Button>
    </div>
  );
}
