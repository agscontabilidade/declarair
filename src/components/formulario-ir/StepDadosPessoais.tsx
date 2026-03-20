import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maskCPF } from '@/lib/formatters';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

export function StepDadosPessoais({ data, onChange }: Props) {
  const showConjuge = data.estado_civil === 'casado' || data.estado_civil === 'uniao_estavel';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Dados Pessoais</h2>
        <p className="text-sm text-muted-foreground">Informações básicas sobre seu estado civil</p>
      </div>
      <div>
        <Label>Estado Civil</Label>
        <Select value={data.estado_civil} onValueChange={(v) => onChange('estado_civil', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {ESTADOS_CIVIS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {showConjuge && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
          <div>
            <Label>Nome do Cônjuge</Label>
            <Input value={data.conjuge_nome} onChange={(e) => onChange('conjuge_nome', e.target.value)} placeholder="Nome completo" maxLength={200} />
          </div>
          <div>
            <Label>CPF do Cônjuge</Label>
            <Input value={data.conjuge_cpf} onChange={(e) => onChange('conjuge_cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
          </div>
        </div>
      )}
    </div>
  );
}
