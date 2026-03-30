import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { maskCPF } from '@/lib/formatters';
import type { WizardStepProps } from '../WizardFormulario';

interface DadosCadastraisSimples {
  cpf: string;
  nome_completo: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo_chave_pix: string;
  chave_pix: string;
  banco: string;
  agencia: string;
  conta_corrente: string;
  tipo_conta: string;
}

const EMPTY: DadosCadastraisSimples = {
  cpf: '', nome_completo: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  tipo_chave_pix: '', chave_pix: '',
  banco: '', agencia: '', conta_corrente: '', tipo_conta: 'corrente',
};

const TIPOS_CHAVE_PIX = [
  { value: 'cpf', label: 'CPF' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave Aleatória' },
  { value: 'nenhuma', label: 'Não possuo chave PIX' },
];

export default function Step1DadosCadastrais({ data, onUpdate }: WizardStepProps) {
  const [form, setForm] = useState<DadosCadastraisSimples>(data.dados_cadastrais as any || EMPTY);

  useEffect(() => {
    const required = ['cpf', 'nome_completo', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'] as const;
    const filled = required.filter(k => (form as any)[k]?.trim()).length;
    onUpdate({ dados_cadastrais: form as any }, Math.round((filled / required.length) * 100));
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

  const update = (field: keyof DadosCadastraisSimples, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const showContaCorrente = form.tipo_chave_pix && form.tipo_chave_pix !== 'cpf';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Dados Cadastrais</h3>
        <p className="text-sm text-muted-foreground mt-1">Preencha suas informações pessoais para a declaração</p>
      </div>

      {/* Dados pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>CPF *</Label>
          <Input value={form.cpf} onChange={e => update('cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
        </div>
        <div className="space-y-1.5">
          <Label>Nome Completo *</Label>
          <Input value={form.nome_completo} onChange={e => update('nome_completo', e.target.value)} placeholder="Seu nome completo" maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone *</Label>
          <Input value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail *</Label>
          <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="seu@email.com" maxLength={100} />
        </div>
      </div>

      {/* Endereço */}
      <div className="border-t border-border pt-6">
        <h4 className="font-semibold text-foreground mb-4">Endereço Atualizado</h4>
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

      {/* Chave PIX / Conta Corrente */}
      <div className="border-t border-border pt-6">
        <h4 className="font-semibold text-foreground mb-2">Dados Bancários para Restituição</h4>
        
        <Alert className="mb-4 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Atenção:</strong> A Receita Federal só permite restituição por PIX quando a chave é o <strong>CPF do titular</strong>. 
            Caso sua chave PIX não seja CPF, a restituição será creditada em conta corrente informada abaixo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de Chave PIX</Label>
            <Select value={form.tipo_chave_pix} onValueChange={v => update('tipo_chave_pix', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {TIPOS_CHAVE_PIX.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.tipo_chave_pix && form.tipo_chave_pix !== 'nenhuma' && (
            <div className="space-y-1.5">
              <Label>Chave PIX</Label>
              <Input value={form.chave_pix} onChange={e => update('chave_pix', e.target.value)} placeholder="Insira sua chave PIX" />
            </div>
          )}
        </div>

        {showContaCorrente && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-4">
            <p className="text-sm text-muted-foreground">
              Como sua chave PIX não é CPF, informe os dados da conta corrente para restituição:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Input value={form.banco} onChange={e => update('banco', e.target.value)} placeholder="Nome ou código do banco" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Conta</Label>
                <Select value={form.tipo_conta} onValueChange={v => update('tipo_conta', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Agência</Label>
                <Input value={form.agencia} onChange={e => update('agencia', e.target.value)} placeholder="0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Conta (com dígito)</Label>
                <Input value={form.conta_corrente} onChange={e => update('conta_corrente', e.target.value)} placeholder="00000-0" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
