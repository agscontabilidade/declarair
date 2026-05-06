import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { validateCPF, maskCPF } from '@/lib/formatters';
import { getErrorMessage } from '@/lib/errors';
import { usePersistedForm } from '@/hooks/use-persisted-form';

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contadores: { id: string; nome: string }[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  mode?: 'create' | 'edit';
  cliente?: ClienteEditavel | null;
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
};

export function ClienteModal({ open, onOpenChange, contadores, onSave, mode = 'create', cliente }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm, clearForm] = usePersistedForm('cliente_modal', EMPTY);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && cliente) {
        // In edit mode, we prioritize the cliente data from props
        // unless we want to also persist edits (more complex)
        setForm({
          nome: cliente.nome ?? '',
          cpf: cliente.cpf ?? '',
          email: cliente.email ?? '',
          telefone: cliente.telefone ?? '',
          data_nascimento: cliente.data_nascimento ?? '',
          contador_responsavel_id: cliente.contador_responsavel_id ?? '',
          procuracao_ecac: !!cliente.procuracao_ecac,
          procuracao_ecac_validade: cliente.procuracao_ecac_validade ?? '',
        });
      } else {
        // In create mode, we only set to EMPTY if there's no persisted data
        // usePersistedForm already handles the initial state from localStorage
        // So we don't want to force EMPTY every time the modal opens if the user was mid-creation
        const saved = localStorage.getItem('form_persistence_cliente_modal');
        if (!saved) {
          setForm(EMPTY);
        }
      }
    }
  }, [open, mode, cliente, setForm]);

  const isEdit = mode === 'edit';
  const cpfDigits = form.cpf.replace(/\D/g, '');
  const cpfValid = isEdit ? true : validateCPF(form.cpf);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !cpfValid) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const base = {
        nome: form.nome.trim(),
        email: form.email || null,
        telefone: form.telefone.replace(/\D/g, '') || null,
        data_nascimento: form.data_nascimento || null,
        contador_responsavel_id: form.contador_responsavel_id || null,
        procuracao_ecac: form.procuracao_ecac,
        procuracao_ecac_validade: form.procuracao_ecac && form.procuracao_ecac_validade
          ? form.procuracao_ecac_validade
          : null,
      };
      if (isEdit) {
        await onSave({ id: cliente!.id, ...base });
        toast({ title: 'Cliente atualizado!' });
      } else {
        await onSave({ ...base, cpf: cpfDigits });
        toast({ title: 'Cliente criado com sucesso!' });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div>
            <Label htmlFor="cpf">CPF {!isEdit && '*'}</Label>
            <Input
              id="cpf"
              value={maskCPF(form.cpf)}
              onChange={e => !isEdit && setForm(f => ({ ...f, cpf: e.target.value }))}
              placeholder="000.000.000-00"
              disabled={isEdit}
            />
            {!isEdit && form.cpf && !cpfValid && <p className="text-xs text-destructive mt-1">CPF inválido</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label htmlFor="telefone">WhatsApp</Label>
            <Input id="telefone" value={maskTelefone(form.telefone)} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label htmlFor="nascimento">Data de Nascimento</Label>
            <Input id="nascimento" type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} />
          </div>
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

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="procuracao" className="cursor-pointer">Procuração e-CAC ativa</Label>
                <p className="text-xs text-muted-foreground">Cliente já cadastrou a procuração eletrônica.</p>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
