import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { QrCode } from 'lucide-react';
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
        <h2 className="font-display text-lg font-semibold">Revisão e Envio</h2>
        <p className="text-sm text-muted-foreground">Informe seus dados finais e confirme o envio</p>
      </div>

      {/* Chave PIX */}
      <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-5 w-5 text-accent" />
          <p className="text-sm font-medium text-foreground">Chave PIX para Restituição</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Caso tenha direito à restituição, informe sua chave PIX para que o contador registre na declaração.
        </p>
        <Input
          value={data.chave_pix_cliente || ''}
          onChange={(e) => onChange('chave_pix_cliente', e.target.value)}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
          maxLength={200}
        />
      </div>

      {/* Informative checkboxes */}
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
