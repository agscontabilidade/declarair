import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maskCPF, validateCPF, maskCEP } from '@/lib/formatters';
import type { FormularioData } from '@/hooks/useFormularioIR';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const RACAS_CORES = [
  { value: 'branca', label: 'Branca' },
  { value: 'preta', label: 'Preta' },
  { value: 'parda', label: 'Parda' },
  { value: 'amarela', label: 'Amarela' },
  { value: 'indigena', label: 'Indígena' },
];

const NATUREZAS_OCUPACAO = [
  { value: '01', label: '01 - Empregado de empresa privada, exceto de instituições financeiras' },
  { value: '02', label: '02 - Empregado de instituições financeiras privadas' },
  { value: '11', label: '11 - Servidor público da administração direta, autárquica e fundacional e empregado de empresa pública ou de sociedade de economia mista' },
  { value: '12', label: '12 - Militar' },
  { value: '21', label: '21 - Profissional liberal ou autônomo sem vínculo de emprego' },
  { value: '22', label: '22 - Proprietário de empresa ou de firma individual ou sócio-gerente' },
  { value: '31', label: '31 - Capitalista, que auferiu rendimentos de capital' },
  { value: '41', label: '41 - Aposentado, militar reformado ou reserva remunerada e pensionista de previdência' },
  { value: '51', label: '51 - Espólio' },
  { value: '61', label: '61 - Natureza de ocupação não especificada anteriormente' },
];

const OCUPACOES_PRINCIPAIS = [
  { value: '101', label: '101 - Membro das Forças Armadas' },
  { value: '102', label: '102 - Membro da Polícia Militar' },
  { value: '103', label: '103 - Membro do Corpo de Bombeiros Militar' },
  { value: '211', label: '211 - Membro do Poder Judiciário' },
  { value: '212', label: '212 - Membro do Ministério Público' },
  { value: '214', label: '214 - Membro do Poder Legislativo' },
  { value: '290', label: '290 - Dirigente superior da administração pública (inclusive autárquica e fundacional), ocupante de cargo eletivo e outros' },
  { value: '310', label: '310 - Agrônomo, engenheiro, arquiteto e afins' },
  { value: '320', label: '320 - Profissional de ensino' },
  { value: '330', label: '330 - Médico, odontólogo, veterinário e afins' },
  { value: '340', label: '340 - Enfermeiro, fisioterapeuta, fonoaudiólogo, nutricionista e afins' },
  { value: '350', label: '350 - Advogado e afins' },
  { value: '360', label: '360 - Contador, auditor, economista, administrador e afins' },
  { value: '370', label: '370 - Arquiteto e urbanista' },
  { value: '380', label: '380 - Ator, diretor de espetáculos e afins' },
  { value: '390', label: '390 - Assistente social, psicólogo e afins' },
  { value: '410', label: '410 - Biólogo, biomédico e afins' },
  { value: '510', label: '510 - Técnico em eletrônica, eletrotécnica e afins' },
  { value: '610', label: '610 - Vendedor e prestador de serviços do comércio' },
  { value: '710', label: '710 - Motorista de veículos a motor e afins' },
  { value: '810', label: '810 - Operador de máquinas e afins' },
  { value: '999', label: '999 - Outros' },
];

export function StepDadosPessoais({ data, onChange }: Props) {
  const [loadingCep, setLoadingCep] = useState(false);
  const showConjuge = data.estado_civil === 'casado' || data.estado_civil === 'uniao_estavel';

  const handleCepSearch = async () => {
    const cep = data.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const result = await response.json();

      if (result.erro) {
        toast.error('CEP não encontrado');
      } else {
        onChange('logradouro', result.logradouro || '');
        onChange('bairro', result.bairro || '');
        onChange('cidade', result.localidade || '');
        onChange('uf', result.uf || '');
        toast.success('Endereço atualizado!');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Informações Cadastrais</h2>
          <p className="text-sm text-muted-foreground">Informações básicas essenciais para sua declaração</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Input 
              type="date" 
              value={data.data_nascimento} 
              onChange={(e) => onChange('data_nascimento', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Raça / Cor</Label>
            <Select value={data.raca_cor} onValueChange={(v) => onChange('raca_cor', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {RACAS_CORES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado Civil</Label>
            <Select value={data.estado_civil} onValueChange={(v) => onChange('estado_civil', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showConjuge && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/30 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <Label>Nome do Cônjuge</Label>
              <Input 
                value={data.conjuge_nome} 
                onChange={(e) => onChange('conjuge_nome', e.target.value)} 
                placeholder="Nome completo" 
                maxLength={200} 
              />
            </div>
            <div className="space-y-2">
              <Label>CPF do Cônjuge</Label>
              <Input
                value={data.conjuge_cpf}
                onChange={(e) => onChange('conjuge_cpf', maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className={data.conjuge_cpf && !validateCPF(data.conjuge_cpf) ? 'border-destructive' : ''}
              />
              {data.conjuge_cpf && !validateCPF(data.conjuge_cpf) && (
                <p className="text-xs text-destructive mt-1">CPF inválido</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Endereço Completo</h2>
          <p className="text-sm text-muted-foreground">Informe seu endereço residencial atualizado</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>CEP</Label>
            <div className="flex gap-2">
              <Input 
                value={data.cep} 
                onChange={(e) => onChange('cep', maskCEP(e.target.value))} 
                placeholder="00000-000"
                maxLength={9}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={handleCepSearch}
                disabled={loadingCep || !data.cep || data.cep.length < 9}
              >
                {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Logradouro (Rua, Av, etc)</Label>
            <Input 
              value={data.logradouro} 
              onChange={(e) => onChange('logradouro', e.target.value)} 
              placeholder="Ex: Rua das Flores" 
            />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input 
              value={data.numero} 
              onChange={(e) => onChange('numero', e.target.value)} 
              placeholder="Ex: 123" 
            />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input 
              value={data.complemento} 
              onChange={(e) => onChange('complemento', e.target.value)} 
              placeholder="Ex: Apto 101" 
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input 
              value={data.bairro} 
              onChange={(e) => onChange('bairro', e.target.value)} 
              placeholder="Ex: Centro" 
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Cidade</Label>
            <Input 
              value={data.cidade} 
              onChange={(e) => onChange('cidade', e.target.value)} 
              placeholder="Ex: São Paulo" 
            />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input 
              value={data.uf} 
              onChange={(e) => onChange('uf', e.target.value.toUpperCase())} 
              placeholder="Ex: SP" 
              maxLength={2}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Ocupação Profissional</h2>
          <p className="text-sm text-muted-foreground">Sua atividade principal no ano-base</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Natureza da Ocupação</Label>
            <Select value={data.natureza_ocupacao} onValueChange={(v) => onChange('natureza_ocupacao', v)}>
              <SelectTrigger className="h-auto py-2"><SelectValue placeholder="Selecione a natureza" /></SelectTrigger>
              <SelectContent>
                {NATUREZAS_OCUPACAO.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    <span className="whitespace-normal text-left">{n.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ocupação Principal</Label>
            <Select value={data.ocupacao_principal} onValueChange={(v) => onChange('ocupacao_principal', v)}>
              <SelectTrigger className="h-auto py-2"><SelectValue placeholder="Selecione sua ocupação" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {OCUPACOES_PRINCIPAIS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="whitespace-normal text-left">{o.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}