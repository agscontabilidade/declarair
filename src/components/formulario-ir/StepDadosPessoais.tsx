import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maskCPF, validateCPF, maskCEP } from '@/lib/formatters';
import type { FormularioData } from '@/hooks/useFormularioIR';
import { toast } from 'sonner';
import { Loader2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { RACAS_CORES, ESTADOS_CIVIS, NATUREZAS_OCUPACAO, OCUPACOES_PRINCIPAIS } from '@/lib/constants-ir';

interface Props {
  data: FormularioData;
  onChange: (field: keyof FormularioData, value: any) => void;
}

export function StepDadosPessoais({ data, onChange }: Props) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [openNatureza, setOpenNatureza] = useState(false);
  const [openOcupacao, setOpenOcupacao] = useState(false);
  
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
          <h2 className="font-display text-lg font-semibold">Informações Pessoais</h2>
          <p className="text-sm text-muted-foreground">Dados básicos para identificação na Receita Federal</p>
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

        <div className="flex items-center space-x-2 p-4 rounded-xl border bg-muted/20">
          <Switch 
            id="possui-conjuge" 
            checked={showConjuge}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange('estado_civil', 'casado');
              } else {
                onChange('estado_civil', 'solteiro');
                onChange('conjuge_nome', '');
                onChange('conjuge_cpf', '');
              }
            }}
          />
          <Label htmlFor="possui-conjuge" className="cursor-pointer">Possui cônjuge / companheiro(a)?</Label>
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
          <h2 className="font-display text-lg font-semibold">Endereço Atualizado</h2>
          <p className="text-sm text-muted-foreground">Informe onde você reside atualmente</p>
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
          <p className="text-sm text-muted-foreground">Informe sua atividade principal (padrão Receita Federal)</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label>Natureza da Ocupação</Label>
            <Popover open={openNatureza} onOpenChange={setOpenNatureza}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openNatureza}
                  className="w-full justify-between h-auto min-h-[44px] py-2 text-left font-normal bg-background"
                >
                  <span className="whitespace-normal leading-tight pr-4">
                    {data.natureza_ocupacao
                      ? NATUREZAS_OCUPACAO.find((n) => n.value === data.natureza_ocupacao)?.label
                      : "Selecione a natureza..."}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[500px] overflow-hidden flex flex-col" 
                align="start"
                sideOffset={4}
              >
                <Command shouldFilter={true}>
                  <CommandInput 
                    placeholder="Busque por código ou nome..." 
                    className="h-11"
                  />
                  <CommandList className="max-h-[350px]">
                    <CommandEmpty>Nenhuma natureza encontrada.</CommandEmpty>
                    <CommandGroup>
                      {NATUREZAS_OCUPACAO.map((n) => (
                        <CommandItem
                          key={n.value}
                          value={`${n.value} ${n.label}`}
                          onSelect={() => {
                            onChange('natureza_ocupacao', n.value);
                            setOpenNatureza(false);
                          }}
                          className="py-3 px-4 aria-selected:bg-accent cursor-pointer border-b last:border-0 border-muted/20"
                        >
                          <div className="flex items-start w-full">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 mt-0.5 shrink-0",
                                data.natureza_ocupacao === n.value ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            <span className="leading-tight">{n.label}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Ocupação Principal</Label>
            <Popover open={openOcupacao} onOpenChange={setOpenOcupacao}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openOcupacao}
                  className="w-full justify-between h-auto min-h-[44px] py-2 text-left font-normal bg-background"
                >
                  <span className="whitespace-normal leading-tight pr-4">
                    {data.ocupacao_principal
                      ? OCUPACOES_PRINCIPAIS.find((o) => o.value === data.ocupacao_principal)?.label
                      : "Selecione a ocupação..."}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[500px] overflow-hidden flex flex-col" 
                align="start"
                sideOffset={4}
              >
                <Command shouldFilter={true}>
                  <CommandInput 
                    placeholder="Ex: Médico, Engenheiro, 221..." 
                    className="h-11"
                  />
                  <CommandList className="max-h-[400px]">
                    <CommandEmpty>Nenhuma ocupação encontrada.</CommandEmpty>
                    <CommandGroup>
                      {OCUPACOES_PRINCIPAIS.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={`${o.value} ${o.label}`}
                          onSelect={() => {
                            onChange('ocupacao_principal', o.value);
                            setOpenOcupacao(false);
                          }}
                          className="py-3 px-4 aria-selected:bg-accent cursor-pointer border-b last:border-0 border-muted/20"
                        >
                          <div className="flex items-start w-full">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 mt-0.5 shrink-0",
                                data.ocupacao_principal === o.value ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            <span className="leading-tight">{o.label}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>
    </div>
  );
}
