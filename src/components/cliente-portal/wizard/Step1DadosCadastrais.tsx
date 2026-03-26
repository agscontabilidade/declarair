import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DadosCadastrais } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

const EMPTY: DadosCadastrais = {
  data_nascimento: '', cep: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidade: '', estado: '', numero_titulo_eleitor: '',
};

export default function Step1DadosCadastrais({ data, onUpdate }: WizardStepProps) {
  const [form, setForm] = useState<DadosCadastrais>(data.dados_cadastrais || EMPTY);

  useEffect(() => {
    const required = ['data_nascimento', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'numero_titulo_eleitor'] as const;
    const filled = required.filter(k => form[k]?.trim()).length;
    onUpdate({ dados_cadastrais: form }, Math.round((filled / required.length) * 100));
  }, [form]);

  const buscarCEP = async (cep: string) => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const d = await res.json();
      if (!d.erro) {
        setForm(prev => ({ ...prev, logradouro: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }));
      }
    } catch { /* silently fail */ }
  };

  const update = (field: keyof DadosCadastrais, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Dados Cadastrais</h3>
        <p className="text-sm text-muted-foreground mt-1">Complete suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data de Nascimento *</Label>
          <Input type="date" value={form.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Título de Eleitor *</Label>
          <Input value={form.numero_titulo_eleitor} onChange={e => update('numero_titulo_eleitor', e.target.value)} placeholder="0000 0000 0000" />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="font-semibold text-foreground mb-4">Endereço</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>CEP *</Label>
            <Input value={form.cep} onChange={e => { update('cep', e.target.value); if (e.target.value.replace(/\D/g, '').length === 8) buscarCEP(e.target.value); }} placeholder="00000-000" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Logradouro *</Label>
            <Input value={form.logradouro} onChange={e => update('logradouro', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Número *</Label>
            <Input value={form.numero} onChange={e => update('numero', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Complemento</Label>
            <Input value={form.complemento || ''} onChange={e => update('complemento', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bairro *</Label>
            <Input value={form.bairro} onChange={e => update('bairro', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade *</Label>
            <Input value={form.cidade} onChange={e => update('cidade', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Estado *</Label>
            <Input value={form.estado} onChange={e => update('estado', e.target.value)} maxLength={2} placeholder="UF" />
          </div>
        </div>
      </div>
    </div>
  );
}
