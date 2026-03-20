import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

const TIPOS_BENS = ['Imóvel', 'Veículo', 'Aplicação Financeira', 'Criptoativo', 'Participação Societária', 'Conta Corrente/Poupança', 'Outro'];

export function StepBensDireitos({ data, onChange }: Props) {
  const bens = data.bens_direitos || [];

  const add = () => onChange('bens_direitos', [...bens, { tipo: '', descricao: '', valor_anterior: '', valor_atual: '' }]);
  const update = (i: number, field: string, value: string) => {
    onChange('bens_direitos', bens.map((b: any, idx: number) => idx === i ? { ...b, [field]: value } : b));
  };
  const remove = (i: number) => onChange('bens_direitos', bens.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Bens e Direitos</h2>
        <p className="text-sm text-muted-foreground">Declare imóveis, veículos, aplicações e outros bens</p>
      </div>
      {bens.map((bem: any, i: number) => (
        <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bem {i + 1}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={bem.tipo} onValueChange={(v) => update(i, 'tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{TIPOS_BENS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={bem.descricao} onChange={(e) => update(i, 'descricao', e.target.value)} maxLength={300} /></div>
            <div><Label>Valor 31/12 Ano Anterior (R$)</Label><Input value={bem.valor_anterior} onChange={(e) => update(i, 'valor_anterior', e.target.value)} placeholder="0,00" /></div>
            <div><Label>Valor 31/12 Ano Atual (R$)</Label><Input value={bem.valor_atual} onChange={(e) => update(i, 'valor_atual', e.target.value)} placeholder="0,00" /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full"><Plus className="h-4 w-4 mr-2" /> Adicionar Bem</Button>
    </div>
  );
}
