import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Scale } from 'lucide-react';
import type { Alimentando } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step3Alimentandos({ data, onUpdate }: WizardStepProps) {
  const [pagaPensao, setPagaPensao] = useState(data.paga_pensao || false);
  const [items, setItems] = useState<Alimentando[]>(data.alimentandos || []);

  useEffect(() => {
    const progress = !pagaPensao ? 100 : items.length > 0 && items.every(a => a.nome && a.cpf) ? 100 : 50;
    onUpdate({ alimentandos: items, paga_pensao: pagaPensao }, progress);
  }, [items, pagaPensao]);

  const addItem = () => setItems(prev => [...prev, { id: crypto.randomUUID(), nome: '', cpf: '', data_nascimento: '' }]);
  const removeItem = (id: string) => setItems(prev => prev.filter(a => a.id !== id));
  const updateItem = (id: string, field: keyof Alimentando, value: string) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Alimentandos / Pensão Alimentícia</h3>
        <p className="text-sm text-muted-foreground mt-1">Informar caso pague pensão alimentícia judicial</p>
      </div>

      <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
        <Switch checked={pagaPensao} onCheckedChange={setPagaPensao} />
        <Label className="cursor-pointer">Pago pensão alimentícia judicial</Label>
      </div>

      {!pagaPensao && (
        <div className="text-center py-8 text-muted-foreground">
          <Scale className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Sem pensão alimentícia a declarar</p>
          <p className="text-xs mt-1">Avance para a próxima etapa</p>
        </div>
      )}

      {pagaPensao && (
        <>
          {items.map((al, i) => (
            <div key={al.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Alimentando {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeItem(al.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome Completo *</Label>
                  <Input value={al.nome} onChange={e => updateItem(al.id, 'nome', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF *</Label>
                  <Input value={al.cpf} onChange={e => updateItem(al.id, 'cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={al.data_nascimento} onChange={e => updateItem(al.id, 'data_nascimento', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Adicionar Alimentando
          </Button>
        </>
      )}
    </div>
  );
}
