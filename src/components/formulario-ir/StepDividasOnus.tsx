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

const TIPOS_DIVIDAS = ['Financiamento Imobiliário', 'Financiamento de Veículo', 'Empréstimo Pessoal', 'Empréstimo Consignado', 'Outro'];

export function StepDividasOnus({ data, onChange }: Props) {
  const dividas = data.dividas_onus || [];

  const add = () => onChange('dividas_onus', [...dividas, { tipo: '', credor: '', saldo: '' }]);
  const update = (i: number, field: string, value: string) => {
    onChange('dividas_onus', dividas.map((d: any, idx: number) => idx === i ? { ...d, [field]: value } : d));
  };
  const remove = (i: number) => onChange('dividas_onus', dividas.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Dívidas e Ônus</h2>
        <p className="text-sm text-muted-foreground">Declare financiamentos e empréstimos</p>
      </div>
      {dividas.map((div: any, i: number) => (
        <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Dívida {i + 1}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={div.tipo} onValueChange={(v) => update(i, 'tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{TIPOS_DIVIDAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Credor</Label><Input value={div.credor} onChange={(e) => update(i, 'credor', e.target.value)} maxLength={200} /></div>
            <div><Label>Saldo 31/12 (R$)</Label><Input value={div.saldo} onChange={(e) => update(i, 'saldo', e.target.value)} placeholder="0,00" /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full"><Plus className="h-4 w-4 mr-2" /> Adicionar Dívida</Button>
    </div>
  );
}
