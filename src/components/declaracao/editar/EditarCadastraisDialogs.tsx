import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { maskCPF, maskCEP, parseCPF, validateCPF } from '@/lib/formatters';
import { buscarCEP } from '@/lib/apiBrasil';
import { NATUREZAS_OCUPACAO, OCUPACOES_PRINCIPAIS } from '@/lib/constants-ir';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function ComboboxField({
  value, onChange, options, placeholder, searchPlaceholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between h-auto min-h-[40px] py-2 text-left font-normal bg-background"
        >
          <span className="whitespace-normal leading-tight pr-2 text-sm">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[400px] overflow-hidden flex flex-col"
        align="start"
        sideOffset={6}
      >
        <Command shouldFilter={true} className="border-0">
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList className="max-h-[320px] overflow-y-auto">
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.value} ${o.label}`}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                  className="py-2.5 px-3 cursor-pointer border-b last:border-0 border-muted/20"
                >
                  <Check className={cn('mr-2 h-4 w-4 mt-0.5 shrink-0', value === o.value ? 'opacity-100 text-primary' : 'opacity-0')} />
                  <span className="leading-tight text-sm">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ===== Schemas =====
const cpfOpt = z.string().optional().or(z.literal('')).refine(
  (v) => !v || validateCPF(v),
  { message: 'CPF inválido' },
);

const dadosPessoaisSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório').max(120),
  cpf: z.string().refine((v) => validateCPF(v), 'CPF inválido'),
  email: z.string().trim().email('E-mail inválido').max(150).or(z.literal('')),
  telefone: z.string().trim().max(20).optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  estado_civil: z.string().optional().or(z.literal('')),
  conjuge_nome: z.string().max(120).optional().or(z.literal('')),
  conjuge_cpf: cpfOpt,
  raca_cor: z.string().optional().or(z.literal('')),
  ocupacao_principal: z.string().max(80).optional().or(z.literal('')),
  natureza_ocupacao: z.string().max(80).optional().or(z.literal('')),
});
type DadosPessoaisForm = z.infer<typeof dadosPessoaisSchema>;

const enderecoSchema = z.object({
  cep: z.string().optional().or(z.literal('')),
  logradouro: z.string().max(150).optional().or(z.literal('')),
  numero: z.string().max(20).optional().or(z.literal('')),
  complemento: z.string().max(80).optional().or(z.literal('')),
  bairro: z.string().max(80).optional().or(z.literal('')),
  cidade: z.string().max(80).optional().or(z.literal('')),
  uf: z.string().max(2).optional().or(z.literal('')),
});
type EnderecoForm = z.infer<typeof enderecoSchema>;

const pixSchema = z.object({
  chave_pix_cliente: z.string().trim().max(150).optional().or(z.literal('')),
});
type PixForm = z.infer<typeof pixSchema>;

const dependenteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório').max(120),
  cpf: z.string().refine((v) => validateCPF(v), 'CPF obrigatório e válido'),
  parentesco: z.string().trim().max(40).optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
});
const dependentesSchema = z.object({ dependentes: z.array(dependenteSchema) });
type DependentesForm = z.infer<typeof dependentesSchema>;

// ===== Helpers =====
interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  declaracaoId: string;
  clienteId: string;
  anoBase?: number;
}

interface Initial {
  nome?: string; cpf?: string; email?: string; telefone?: string;
  data_nascimento?: string; estado_civil?: string; conjuge_nome?: string;
  conjuge_cpf?: string; raca_cor?: string; ocupacao_principal?: string;
  natureza_ocupacao?: string; cep?: string; logradouro?: string;
  numero?: string; complemento?: string; bairro?: string; cidade?: string;
  uf?: string; chave_pix_cliente?: string;
  dependentes?: Array<{ nome?: string; cpf?: string; parentesco?: string; data_nascimento?: string }>;
}

function useInvalidate(declaracaoId: string, clienteId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['info-cadastrais', declaracaoId, clienteId] });
}

type FormularioPatch = Database['public']['Tables']['formulario_ir']['Update'];

async function upsertFormulario(
  declaracaoId: string,
  clienteId: string,
  anoBase: number | undefined,
  patch: FormularioPatch,
) {
  const { data: existing } = await supabase
    .from('formulario_ir')
    .select('id, ano_base')
    .eq('declaracao_id', declaracaoId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('formulario_ir').update(patch).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('formulario_ir').insert({
      declaracao_id: declaracaoId,
      cliente_id: clienteId,
      ano_base: anoBase ?? new Date().getFullYear(),
      ...patch,
    });
    if (error) throw error;
  }
}

// ===== 1. Dados Pessoais =====
export function EditarDadosPessoaisDialog({ open, onOpenChange, declaracaoId, clienteId, anoBase, initial }: BaseProps & { initial: Initial }) {
  const invalidate = useInvalidate(declaracaoId, clienteId);
  const form = useForm<DadosPessoaisForm>({
    resolver: zodResolver(dadosPessoaisSchema),
    defaultValues: {
      nome: initial.nome ?? '',
      cpf: initial.cpf ? maskCPF(initial.cpf) : '',
      email: initial.email ?? '',
      telefone: initial.telefone ?? '',
      data_nascimento: initial.data_nascimento ?? '',
      estado_civil: initial.estado_civil ?? '',
      conjuge_nome: initial.conjuge_nome ?? '',
      conjuge_cpf: initial.conjuge_cpf ? maskCPF(initial.conjuge_cpf) : '',
      raca_cor: initial.raca_cor ?? '',
      ocupacao_principal: initial.ocupacao_principal ?? '',
      natureza_ocupacao: initial.natureza_ocupacao ?? '',
    },
  });

  useEffect(() => { if (open) form.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const mutation = useMutation({
    mutationFn: async (v: DadosPessoaisForm) => {
      const { error: cErr } = await supabase
        .from('clientes')
        .update({
          nome: v.nome.trim(),
          cpf: parseCPF(v.cpf),
          email: v.email || null,
          telefone: v.telefone || null,
          data_nascimento: v.data_nascimento || null,
        })
        .eq('id', clienteId);
      if (cErr) throw cErr;

      await upsertFormulario(declaracaoId, clienteId, anoBase, {
        data_nascimento: v.data_nascimento || null,
        estado_civil: v.estado_civil || null,
        conjuge_nome: v.conjuge_nome || null,
        conjuge_cpf: v.conjuge_cpf ? parseCPF(v.conjuge_cpf) : null,
        raca_cor: v.raca_cor || null,
        ocupacao_principal: v.ocupacao_principal || null,
        natureza_ocupacao: v.natureza_ocupacao || null,
      });
    },
    onSuccess: () => { toast.success('Dados atualizados'); invalidate(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar dados pessoais</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *" error={form.formState.errors.nome?.message}>
              <Input {...form.register('nome')} />
            </Field>
            <Field label="CPF *" error={form.formState.errors.cpf?.message}>
              <Input value={form.watch('cpf')} onChange={(e) => form.setValue('cpf', maskCPF(e.target.value))} maxLength={14} />
            </Field>
            <Field label="E-mail" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <Field label="Telefone"><Input {...form.register('telefone')} /></Field>
            <Field label="Data nascimento"><Input type="date" {...form.register('data_nascimento')} /></Field>
            <Field label="Estado civil">
              <Select value={form.watch('estado_civil') || ''} onValueChange={(v) => form.setValue('estado_civil', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'separado'].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cônjuge"><Input {...form.register('conjuge_nome')} /></Field>
            <Field label="CPF cônjuge" error={form.formState.errors.conjuge_cpf?.message}>
              <Input value={form.watch('conjuge_cpf') || ''} onChange={(e) => form.setValue('conjuge_cpf', maskCPF(e.target.value))} maxLength={14} />
            </Field>
            <Field label="Raça/cor"><Input {...form.register('raca_cor')} /></Field>
            <Field label="Ocupação principal">
              <ComboboxField
                value={form.watch('ocupacao_principal') || ''}
                onChange={(v) => form.setValue('ocupacao_principal', v)}
                options={OCUPACOES_PRINCIPAIS}
                placeholder="Selecione a ocupação..."
                searchPlaceholder="Ex: Médico, Engenheiro, 221..."
              />
            </Field>
            <Field label="Natureza da ocupação">
              <ComboboxField
                value={form.watch('natureza_ocupacao') || ''}
                onChange={(v) => form.setValue('natureza_ocupacao', v)}
                options={NATUREZAS_OCUPACAO}
                placeholder="Selecione a natureza..."
                searchPlaceholder="Busque por código ou nome..."
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== 2. Endereço =====
export function EditarEnderecoDialog({ open, onOpenChange, declaracaoId, clienteId, anoBase, initial }: BaseProps & { initial: Initial }) {
  const invalidate = useInvalidate(declaracaoId, clienteId);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const form = useForm<EnderecoForm>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      cep: initial.cep ?? '', logradouro: initial.logradouro ?? '', numero: initial.numero ?? '',
      complemento: initial.complemento ?? '', bairro: initial.bairro ?? '', cidade: initial.cidade ?? '',
      uf: initial.uf ?? '',
    },
  });
  useEffect(() => { if (open) form.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const handleCepBlur = async () => {
    const cep = form.getValues('cep') || '';
    if (cep.replace(/\D/g, '').length !== 8) return;
    setBuscandoCep(true);
    const data = await buscarCEP(cep);
    setBuscandoCep(false);
    if (data) {
      form.setValue('logradouro', data.logradouro);
      form.setValue('bairro', data.bairro);
      form.setValue('cidade', data.localidade);
      form.setValue('uf', data.uf);
    } else {
      toast.error('CEP não encontrado');
    }
  };

  const mutation = useMutation({
    mutationFn: async (v: EnderecoForm) => {
      await upsertFormulario(declaracaoId, clienteId, anoBase, {
        cep: v.cep || null, logradouro: v.logradouro || null, numero: v.numero || null,
        complemento: v.complemento || null, bairro: v.bairro || null, cidade: v.cidade || null,
        uf: v.uf ? v.uf.toUpperCase() : null,
      });
    },
    onSuccess: () => { toast.success('Endereço atualizado'); invalidate(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Editar endereço</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="CEP">
              <Input
                value={form.watch('cep') || ''}
                onChange={(e) => form.setValue('cep', maskCEP(e.target.value))}
                onBlur={handleCepBlur}
                maxLength={9}
              />
              {buscandoCep && <span className="text-xs text-muted-foreground">Buscando…</span>}
            </Field>
            <Field label="Logradouro"><Input {...form.register('logradouro')} /></Field>
            <Field label="Número"><Input {...form.register('numero')} /></Field>
            <Field label="Complemento"><Input {...form.register('complemento')} /></Field>
            <Field label="Bairro"><Input {...form.register('bairro')} /></Field>
            <Field label="Cidade"><Input {...form.register('cidade')} /></Field>
            <Field label="UF"><Input {...form.register('uf')} maxLength={2} /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== 3. Chave Pix =====
export function EditarChavePixDialog({ open, onOpenChange, declaracaoId, clienteId, anoBase, initial }: BaseProps & { initial: Initial }) {
  const invalidate = useInvalidate(declaracaoId, clienteId);
  const form = useForm<PixForm>({
    resolver: zodResolver(pixSchema),
    defaultValues: { chave_pix_cliente: initial.chave_pix_cliente ?? '' },
  });
  useEffect(() => { if (open) form.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const mutation = useMutation({
    mutationFn: async (v: PixForm) => {
      await upsertFormulario(declaracaoId, clienteId, anoBase, {
        chave_pix_cliente: v.chave_pix_cliente?.trim() || null,
      });
    },
    onSuccess: () => { toast.success('Chave Pix atualizada'); invalidate(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar chave Pix</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
          <Field label="Chave Pix do cliente">
            <Input {...form.register('chave_pix_cliente')} placeholder="CPF, e-mail, telefone ou chave aleatória" />
          </Field>
          <p className="text-xs text-muted-foreground">
            Em restituições, a Receita exige que a chave Pix seja o CPF do declarante.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== 4. Dependentes =====
export function EditarDependentesDialog({ open, onOpenChange, declaracaoId, clienteId, anoBase, initial }: BaseProps & { initial: Initial }) {
  const invalidate = useInvalidate(declaracaoId, clienteId);
  const form = useForm<DependentesForm>({
    resolver: zodResolver(dependentesSchema),
    defaultValues: {
      dependentes: (initial.dependentes ?? []).map((d) => ({
        nome: d.nome ?? '',
        cpf: d.cpf ? maskCPF(d.cpf) : '',
        parentesco: d.parentesco ?? '',
        data_nascimento: d.data_nascimento ?? '',
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'dependentes' });
  useEffect(() => { if (open) form.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const mutation = useMutation({
    mutationFn: async (v: DependentesForm) => {
      await upsertFormulario(declaracaoId, clienteId, anoBase, {
        dependentes: v.dependentes.map((d) => ({
          nome: d.nome.trim(),
          cpf: parseCPF(d.cpf),
          parentesco: d.parentesco || '',
          data_nascimento: d.data_nascimento || '',
        })),
      });
    },
    onSuccess: () => { toast.success('Dependentes atualizados'); invalidate(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar dependentes</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Nenhum dependente. Clique em "Adicionar".</p>
          )}
          {fields.map((f, idx) => {
            const errs = form.formState.errors.dependentes?.[idx];
            return (
              <div key={f.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dependente {idx + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nome *" error={errs?.nome?.message}>
                    <Input {...form.register(`dependentes.${idx}.nome`)} />
                  </Field>
                  <Field label="CPF *" error={errs?.cpf?.message}>
                    <Input
                      value={form.watch(`dependentes.${idx}.cpf`) || ''}
                      onChange={(e) => form.setValue(`dependentes.${idx}.cpf`, maskCPF(e.target.value))}
                      maxLength={14}
                    />
                  </Field>
                  <Field label="Parentesco"><Input {...form.register(`dependentes.${idx}.parentesco`)} /></Field>
                  <Field label="Data nascimento"><Input type="date" {...form.register(`dependentes.${idx}.data_nascimento`)} /></Field>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ nome: '', cpf: '', parentesco: '', data_nascimento: '' })}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar dependente
          </Button>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== Shared field wrapper =====
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
