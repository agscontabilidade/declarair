import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

export function StepRendimentos({ data, onChange }: Props) {
  const empregos = data.rendimentos_emprego || [];
  const alugueis = data.rendimentos_aluguel || [];
  const autonomo = data.rendimentos_autonomo || {};

  const addEmprego = () => {
    onChange('rendimentos_emprego', [...empregos, { cnpj: '', razao_social: '', rendimento: '', irrf: '' }]);
  };

  const updateEmprego = (i: number, field: string, value: string) => {
    const updated = empregos.map((e: any, idx: number) => idx === i ? { ...e, [field]: value } : e);
    onChange('rendimentos_emprego', updated);
  };

  const removeEmprego = (i: number) => onChange('rendimentos_emprego', empregos.filter((_: any, idx: number) => idx !== i));

  const addAluguel = () => {
    onChange('rendimentos_aluguel', [...alugueis, { descricao: '', valor_mensal: '', inquilino: '' }]);
  };

  const updateAluguel = (i: number, field: string, value: string) => {
    const updated = alugueis.map((a: any, idx: number) => idx === i ? { ...a, [field]: value } : a);
    onChange('rendimentos_aluguel', updated);
  };

  const removeAluguel = (i: number) => onChange('rendimentos_aluguel', alugueis.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold">Rendimentos</h2>
        <p className="text-sm text-muted-foreground">Informe todas as fontes de renda</p>
      </div>

      {/* Emprego CLT */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Rendimentos de Emprego (CLT)</h3>
        {empregos.map((emp: any, i: number) => (
          <div key={i} className="p-3 rounded-lg border bg-card space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Empregador {i + 1}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeEmprego(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>CNPJ</Label><Input value={emp.cnpj} onChange={(e) => updateEmprego(i, 'cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} /></div>
              <div><Label>Razão Social</Label><Input value={emp.razao_social} onChange={(e) => updateEmprego(i, 'razao_social', e.target.value)} maxLength={200} /></div>
              <div><Label>Rendimento Anual (R$)</Label><Input value={emp.rendimento} onChange={(e) => updateEmprego(i, 'rendimento', e.target.value)} placeholder="0,00" /></div>
              <div><Label>IRRF Retido (R$)</Label><Input value={emp.irrf} onChange={(e) => updateEmprego(i, 'irrf', e.target.value)} placeholder="0,00" /></div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEmprego}><Plus className="h-4 w-4 mr-1" /> Adicionar Empregador</Button>
      </div>

      {/* Autônomo */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Rendimentos Autônomo (Carnê-Leão)</h3>
        <div className="p-3 rounded-lg border bg-card">
          <div><Label>Rendimento Anual (R$)</Label><Input value={String(autonomo.valor_anual || '')} onChange={(e) => onChange('rendimentos_autonomo', { ...autonomo, valor_anual: e.target.value })} placeholder="0,00" /></div>
        </div>
      </div>

      {/* Aluguéis */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Rendimentos de Aluguel</h3>
        {alugueis.map((alg: any, i: number) => (
          <div key={i} className="p-3 rounded-lg border bg-card space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Imóvel {i + 1}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeAluguel(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Descrição</Label><Input value={alg.descricao} onChange={(e) => updateAluguel(i, 'descricao', e.target.value)} maxLength={200} /></div>
              <div><Label>Valor Mensal (R$)</Label><Input value={alg.valor_mensal} onChange={(e) => updateAluguel(i, 'valor_mensal', e.target.value)} placeholder="0,00" /></div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addAluguel}><Plus className="h-4 w-4 mr-1" /> Adicionar Imóvel</Button>
      </div>
    </div>
  );
}
