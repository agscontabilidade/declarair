import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { maskCPF, parseCPF } from '@/lib/formatters';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

const PARENTESCOS = ['Filho(a)', 'Enteado(a)', 'Cônjuge', 'Companheiro(a)', 'Pai/Mãe', 'Avô/Avó', 'Outro'];

export function StepDependentes({ data, onChange }: Props) {
  const deps = data.dependentes || [];

  const addDep = () => {
    onChange('dependentes', [...deps, { nome: '', cpf: '', data_nascimento: '', parentesco: '', tipo: 'dependente' }]);
  };

  const updateDep = (i: number, field: string, value: string) => {
    const updated = deps.map((d: any, idx: number) => idx === i ? { ...d, [field]: value } : d);
    onChange('dependentes', updated);
  };

  const removeDep = (i: number) => {
    onChange('dependentes', deps.filter((_: any, idx: number) => idx !== i));
  };

  const isValidCPF = (cpf: string) => parseCPF(cpf).length === 11;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Dependentes</h2>
        <p className="text-sm text-muted-foreground">Adicione seus dependentes. CPF é obrigatório para cada um.</p>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
        ⚠️ A Receita Federal exige CPF para todos os dependentes. Certifique-se de preencher corretamente.
      </div>

      {deps.map((dep: any, i: number) => (
        <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Dependente {i + 1}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeDep(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={dep.nome} onChange={(e) => updateDep(i, 'nome', e.target.value)} placeholder="Nome completo" maxLength={200} />
            </div>
            <div>
              <Label>CPF * <span className="text-destructive">(obrigatório)</span></Label>
              <Input
                value={dep.cpf}
                onChange={(e) => updateDep(i, 'cpf', maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className={dep.cpf && !isValidCPF(dep.cpf) ? 'border-destructive' : ''}
              />
              {dep.cpf && !isValidCPF(dep.cpf) && <p className="text-xs text-destructive mt-1">CPF inválido — deve conter 11 dígitos</p>}
              {!dep.cpf && <p className="text-xs text-muted-foreground mt-1">Obrigatório pela Receita Federal</p>}
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={dep.data_nascimento} onChange={(e) => updateDep(i, 'data_nascimento', e.target.value)} />
            </div>
            <div>
              <Label>Parentesco</Label>
              <Select value={dep.parentesco} onValueChange={(v) => updateDep(i, 'parentesco', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PARENTESCOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addDep} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Adicionar Dependente
      </Button>
    </div>
  );
}
