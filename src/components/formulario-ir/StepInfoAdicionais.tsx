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

      {/* Informative checkboxes (not saved, just reminders) */}
      <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
        <p className="text-sm font-medium text-foreground">Marque as situações que se aplicam a você (informativo para o contador):</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox />
            Recebi rendimentos tributáveis acima de R$ 30.639,90
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox />
            Possuo bens com valor total acima de R$ 800.000,00
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox />
            Recebi rendimentos isentos acima de R$ 200.000,00
          </label>
        </div>
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
