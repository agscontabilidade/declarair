import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { validateCPF, maskCPF } from '@/lib/formatters';
import { getErrorMessage } from '@/lib/errors';
import { User, IdCard, Mail, Phone, Calendar, UserPlus, Upload, Loader2, ShieldCheck, Send } from 'lucide-react';

interface ClienteEditavel {
  id?: string;
  nome?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  contador_responsavel_id?: string | null;
  procuracao_ecac?: boolean | null;
  procuracao_ecac_validade?: string | null;
}

export interface SavedClienteResult {
  clienteId: string;
  declaracaoId: string | null;
  nome: string;
  email?: string | null;
  telefone?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contadores: { id: string; nome: string }[];
  onSave: (data: Record<string, unknown>) => Promise<{ clienteId: string; declaracaoId: string | null } | void>;
  mode?: 'create' | 'edit';
  cliente?: ClienteEditavel | null;
  onSavedAndUpload?: (ctx: SavedClienteResult) => void;
  onSavedAndInvite?: (ctx: SavedClienteResult) => void;
  /** Disparado após criar cliente (qualquer botão), para fluxos pós-cadastro. */
  onSavedCreate?: (ctx: SavedClienteResult) => void;
}


function maskTelefone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const EMPTY = {
  nome: '', cpf: '', email: '', telefone: '', data_nascimento: '',
  contador_responsavel_id: '', procuracao_ecac: false, procuracao_ecac_validade: '',
  enviar_convite: false,
};

export function ClienteModal({ open, onOpenChange, contadores, onSave, mode = 'create', cliente, onSavedAndUpload, onSavedAndInvite, onSavedCreate }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<null | 'save' | 'save-upload'>(null);
  const [form, setForm] = useState(EMPTY);
  const clearForm = () => setForm(EMPTY);

  // Cleanup legacy persisted data
  useEffect(() => {
    localStorage.removeItem('form_persistence_cliente_modal');
  }, []);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && cliente) {
        setForm({
          nome: cliente.nome ?? '',
          cpf: cliente.cpf ?? '',
          email: cliente.email ?? '',
          telefone: cliente.telefone ?? '',
          data_nascimento: cliente.data_nascimento ?? '',
          contador_responsavel_id: cliente.contador_responsavel_id ?? '',
          procuracao_ecac: !!cliente.procuracao_ecac,
          procuracao_ecac_validade: cliente.procuracao_ecac_validade ?? '',
          enviar_convite: false,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, mode, cliente]);

  const isEdit = mode === 'edit';
  const cpfDigits = form.cpf.replace(/\D/g, '');
  // CPF é opcional. Só valida se o usuário começou a digitar algo.
  const cpfValid = cpfDigits.length === 0 ? true : validateCPF(form.cpf);

  async function doSave(): Promise<SavedClienteResult | null> {
    if (!form.nome.trim()) {
      toast({ title: 'Informe o nome do cliente', variant: 'destructive' });
      return null;
    }
    if (!cpfValid) {
      toast({ title: 'CPF inválido', description: 'Corrija o CPF ou deixe em branco.', variant: 'destructive' });
      return null;
    }
    const emailClean = form.email.trim() || null;
    const telClean = form.telefone.replace(/\D/g, '') || null;
    const base = {
      nome: form.nome.trim(),
      email: emailClean,
      telefone: telClean,
      data_nascimento: form.data_nascimento || null,
      contador_responsavel_id: form.contador_responsavel_id || null,
      procuracao_ecac: form.procuracao_ecac,
      procuracao_ecac_validade: form.procuracao_ecac && form.procuracao_ecac_validade
        ? form.procuracao_ecac_validade
        : null,
    };
    if (isEdit) {
      await onSave({ id: cliente!.id, ...base });
      return { clienteId: cliente!.id ?? '', declaracaoId: null, nome: base.nome, email: emailClean, telefone: telClean };
    }
    const result = await onSave({ ...base, cpf: cpfDigits || null });
    if (result && typeof result === 'object' && 'clienteId' in result) {
      return { clienteId: result.clienteId, declaracaoId: result.declaracaoId, nome: base.nome, email: emailClean, telefone: telClean };
    }
    return { clienteId: '', declaracaoId: null, nome: base.nome, email: emailClean, telefone: telClean };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting('save');
    try {
      const r = await doSave();
      if (!r) return;
      const wantInvite = !isEdit && form.enviar_convite && !!r.clienteId;
      toast({ title: isEdit ? 'Cliente atualizado!' : 'Cliente criado com sucesso!' });
      clearForm();
      onOpenChange(false);
      if (wantInvite) onSavedAndInvite?.(r);
      else if (!isEdit && r.clienteId) onSavedCreate?.(r);
    } catch (err: unknown) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmitAndUpload = async () => {
    setSubmitting('save-upload');
    try {
      const r = await doSave();
      if (!r) return;
      toast({ title: 'Cliente criado. Envie os documentos para o Drive.' });
      clearForm();
      onOpenChange(false);
      if (r.declaracaoId) onSavedAndUpload?.(r);
      if (!isEdit && r.clienteId) onSavedCreate?.(r);
    } catch (err: unknown) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };


  const loading = submitting !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden>
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg">
                {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? 'Atualize os dados do contribuinte.'
                  : 'Cadastre um novo contribuinte. Você poderá enviar documentos logo em seguida.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados pessoais */}
          <section aria-labelledby="sec-dados" className="space-y-3">
            <h3 id="sec-dados" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dados pessoais
            </h3>

            <div>
              <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="cpf">CPF <span className="text-xs font-normal text-muted-foreground">(opcional)</span></Label>
                <div className="relative">
                  <IdCard aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    value={maskCPF(form.cpf)}
                    onChange={e => !isEdit && setForm(f => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    disabled={isEdit}
                    className="pl-9"
                  />
                </div>
                {!isEdit && form.cpf && !cpfValid && (
                  <p className="text-xs text-destructive mt-1">CPF inválido</p>
                )}
              </div>

              <div>
                <Label htmlFor="nascimento">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nascimento"
                    type="date"
                    value={form.data_nascimento}
                    onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section aria-labelledby="sec-contato" className="space-y-3">
            <h3 id="sec-contato" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contato
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="telefone">WhatsApp</Label>
                <div className="relative">
                  <Phone aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    value={maskTelefone(form.telefone)}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Atribuição */}
          <section aria-labelledby="sec-atrib" className="space-y-3">
            <h3 id="sec-atrib" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Atribuição
            </h3>
            <div>
              <Label>Contador Responsável</Label>
              <Select value={form.contador_responsavel_id} onValueChange={v => setForm(f => ({ ...f, contador_responsavel_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {contadores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Procuração e-CAC */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ShieldCheck aria-hidden className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <Label htmlFor="procuracao" className="cursor-pointer">Procuração e-CAC ativa</Label>
                  <p className="text-xs text-muted-foreground">Cliente já cadastrou a procuração eletrônica.</p>
                </div>
              </div>
              <Switch
                id="procuracao"
                checked={form.procuracao_ecac}
                onCheckedChange={(v) => setForm(f => ({ ...f, procuracao_ecac: v }))}
              />
            </div>
            {form.procuracao_ecac && (
              <div>
                <Label htmlFor="validade" className="text-xs">Validade (opcional)</Label>
                <Input
                  id="validade"
                  type="date"
                  value={form.procuracao_ecac_validade}
                  onChange={e => setForm(f => ({ ...f, procuracao_ecac_validade: e.target.value }))}
                />
              </div>
            )}
          </div>


          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="outline" disabled={loading}>
              {submitting === 'save' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : 'Salvar'}
            </Button>
            {!isEdit && (
              <Button type="button" onClick={handleSubmitAndUpload} disabled={loading} className="gap-2">
                {submitting === 'save-upload' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Salvar e enviar documentos</>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
