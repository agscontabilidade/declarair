import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QrCode, AlertTriangle } from 'lucide-react';
import type { FormularioData } from '@/hooks/useFormularioIR';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
  confirmado: boolean;
  onConfirmChange: (v: boolean) => void;
}

export function StepInfoAdicionais({ data, onChange, confirmado, onConfirmChange }: Props) {
  // Determine if user has CPF as PIX key or needs bank details
  const [pixTipo, setPixTipo] = useState<'cpf' | 'banco' | ''>('');

  useEffect(() => {
    const val = data.chave_pix_cliente || '';
    if (val.startsWith('BANCO:')) {
      setPixTipo('banco');
    } else if (val.length > 0) {
      setPixTipo('cpf');
    }
  }, []);

  const handlePixTipoChange = (tipo: string) => {
    setPixTipo(tipo as 'cpf' | 'banco');
    if (tipo === 'cpf') {
      // Clear any bank data, keep just CPF field
      onChange('chave_pix_cliente', '');
    } else {
      onChange('chave_pix_cliente', 'BANCO:');
    }
  };

  const parseBankData = (raw: string) => {
    // Format: BANCO:banco|agencia|conta|tipo
    const parts = raw.replace('BANCO:', '').split('|');
    return { banco: parts[0] || '', agencia: parts[1] || '', conta: parts[2] || '', tipoConta: parts[3] || 'corrente' };
  };

  const updateBankField = (field: string, value: string) => {
    const current = parseBankData(data.chave_pix_cliente || 'BANCO:');
    const updated = { ...current, [field]: value };
    onChange('chave_pix_cliente', `BANCO:${updated.banco}|${updated.agencia}|${updated.conta}|${updated.tipoConta}`);
  };

  const bankData = pixTipo === 'banco' ? parseBankData(data.chave_pix_cliente || 'BANCO:') : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Revisão e Envio</h2>
        <p className="text-sm text-muted-foreground">Informe seus dados finais e confirme o envio</p>
      </div>

      {/* Restituição */}
      <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-accent" />
          <p className="text-sm font-medium text-foreground">Dados para Restituição (caso haja)</p>
        </div>

        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Importante:</strong> A Receita Federal só realiza restituição via PIX se a chave cadastrada for o <strong>CPF do titular</strong>. Chaves de e-mail, telefone ou aleatória não são aceitas. Se você não possui o CPF como chave PIX, informe seus dados bancários.
          </p>
        </div>

        <RadioGroup value={pixTipo} onValueChange={handlePixTipoChange} className="space-y-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="cpf" id="pix-cpf" />
            <Label htmlFor="pix-cpf" className="cursor-pointer text-sm">Meu CPF é minha chave PIX</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="banco" id="pix-banco" />
            <Label htmlFor="pix-banco" className="cursor-pointer text-sm">Não tenho CPF como chave PIX — informar dados bancários</Label>
          </div>
        </RadioGroup>

        {pixTipo === 'cpf' && (
          <div>
            <Label className="text-xs">Confirme seu CPF (chave PIX)</Label>
            <Input
              value={data.chave_pix_cliente || ''}
              onChange={(e) => {
                // Format CPF
                let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                onChange('chave_pix_cliente', v);
              }}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        )}

        {pixTipo === 'banco' && bankData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do Banco</Label>
              <Input value={bankData.banco} onChange={(e) => updateBankField('banco', e.target.value)} placeholder="Ex: Banco do Brasil" maxLength={100} />
            </div>
            <div>
              <Label className="text-xs">Agência (sem dígito)</Label>
              <Input value={bankData.agencia} onChange={(e) => updateBankField('agencia', e.target.value.replace(/\D/g, ''))} placeholder="0000" maxLength={10} />
            </div>
            <div>
              <Label className="text-xs">Conta com dígito</Label>
              <Input value={bankData.conta} onChange={(e) => updateBankField('conta', e.target.value)} placeholder="00000-0" maxLength={20} />
            </div>
            <div>
              <Label className="text-xs">Tipo de conta</Label>
              <RadioGroup value={bankData.tipoConta} onValueChange={(v) => updateBankField('tipoConta', v)} className="flex gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="corrente" id="tc-c" />
                  <Label htmlFor="tc-c" className="text-xs cursor-pointer">Corrente</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="poupanca" id="tc-p" />
                  <Label htmlFor="tc-p" className="text-xs cursor-pointer">Poupança</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
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