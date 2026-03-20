import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
  confirmado: boolean;
  onConfirmChange: (v: boolean) => void;
}

export function StepInfoAdicionais({ data, onChange, confirmado, onConfirmChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Informações Adicionais</h2>
        <p className="text-sm text-muted-foreground">Adicione qualquer informação relevante para o contador</p>
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea
          value={data.informacoes_adicionais}
          onChange={(e) => onChange('informacoes_adicionais', e.target.value)}
          rows={6}
          placeholder="Informe aqui qualquer situação especial, como: herança recebida, venda de imóvel, ganho de capital, pensão alimentícia, etc."
          maxLength={5000}
        />
      </div>
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
        <Checkbox id="confirm" checked={confirmado} onCheckedChange={(v) => onConfirmChange(!!v)} className="mt-0.5" />
        <label htmlFor="confirm" className="text-sm cursor-pointer leading-relaxed">
          Confirmo que as informações preenchidas neste formulário são verdadeiras e completas, e assumo a responsabilidade pela veracidade dos dados informados.
        </label>
      </div>
    </div>
  );
}
