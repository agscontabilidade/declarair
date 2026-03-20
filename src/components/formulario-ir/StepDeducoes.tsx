import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

export function StepDeducoes({ data, onChange }: Props) {
  const medicas = data.despesas_medicas || [];
  const educacao = data.despesas_educacao || [];
  const prev = data.previdencia_privada || {};

  const addMedica = () => onChange('despesas_medicas', [...medicas, { profissional: '', valor: '' }]);
  const updateMedica = (i: number, f: string, v: string) => onChange('despesas_medicas', medicas.map((m: any, idx: number) => idx === i ? { ...m, [f]: v } : m));
  const removeMedica = (i: number) => onChange('despesas_medicas', medicas.filter((_: any, idx: number) => idx !== i));

  const addEducacao = () => onChange('despesas_educacao', [...educacao, { instituicao: '', valor: '' }]);
  const updateEducacao = (i: number, f: string, v: string) => onChange('despesas_educacao', educacao.map((e: any, idx: number) => idx === i ? { ...e, [f]: v } : e));
  const removeEducacao = (i: number) => onChange('despesas_educacao', educacao.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold">Deduções</h2>
        <p className="text-sm text-muted-foreground">Informe despesas dedutíveis</p>
      </div>

      {/* Médicas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">Despesas Médicas</h3>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Sem limite de dedução</span>
        </div>
        {medicas.map((m: any, i: number) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1"><Label>Profissional/Hospital</Label><Input value={m.profissional} onChange={(e) => updateMedica(i, 'profissional', e.target.value)} maxLength={200} /></div>
            <div className="w-36"><Label>Valor (R$)</Label><Input value={m.valor} onChange={(e) => updateMedica(i, 'valor', e.target.value)} placeholder="0,00" /></div>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeMedica(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addMedica}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
      </div>

      {/* Educação */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">Despesas com Educação</h3>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Limite: R$ 3.561,50/pessoa
          </span>
        </div>
        {educacao.map((e: any, i: number) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1"><Label>Instituição</Label><Input value={e.instituicao} onChange={(ev) => updateEducacao(i, 'instituicao', ev.target.value)} maxLength={200} /></div>
            <div className="w-36"><Label>Valor (R$)</Label><Input value={e.valor} onChange={(ev) => updateEducacao(i, 'valor', ev.target.value)} placeholder="0,00" /></div>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeEducacao(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEducacao}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
      </div>

      {/* PGBL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">Previdência Privada (PGBL)</h3>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Limite: 12% dos rendimentos
          </span>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <Label>Valor Total PGBL (R$)</Label>
          <Input value={prev.valor || ''} onChange={(e) => onChange('previdencia_privada', { ...prev, valor: e.target.value })} placeholder="0,00" className="max-w-xs" />
        </div>
      </div>
    </div>
  );
}
