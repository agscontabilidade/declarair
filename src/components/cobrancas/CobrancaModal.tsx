import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CobrancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  loading?: boolean;
  editData?: any;
}

export function CobrancaModal({ open, onOpenChange, onSave, loading, editData }: CobrancaModalProps) {
  const { profile } = useAuth();
  const [clienteId, setClienteId] = useState('');
  const [declaracaoId, setDeclaracaoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [dataVencimento, setDataVencimento] = useState<Date>();

  useEffect(() => {
    if (editData) {
      setClienteId(editData.cliente_id);
      setDescricao(editData.descricao);
      setValorStr(String(editData.valor).replace('.', ','));
      setDataVencimento(new Date(editData.data_vencimento + 'T12:00:00'));
      setDeclaracaoId(editData.declaracao_id || '');
    } else {
      setClienteId(''); setDescricao(''); setValorStr(''); setDataVencimento(undefined); setDeclaracaoId('');
    }
  }, [editData, open]);

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nome').eq('escritorio_id', profile.escritorioId!).order('nome');
      return data || [];
    },
    enabled: open && !!profile.escritorioId,
  });

  const { data: declaracoes = [] } = useQuery({
    queryKey: ['declaracoes-select', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data } = await supabase.from('declaracoes').select('id, ano_base').eq('cliente_id', clienteId).order('ano_base', { ascending: false });
      return data || [];
    },
    enabled: !!clienteId,
  });

  const handleSubmit = () => {
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
    if (!clienteId || !descricao || isNaN(valor) || !dataVencimento) return;
    onSave({
      ...(editData ? { id: editData.id } : {}),
      cliente_id: clienteId,
      declaracao_id: declaracaoId || undefined,
      descricao,
      valor,
      data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
    });
  };

  const maskCurrency = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Cobrança' : 'Nova Cobrança'}</DialogTitle>
          <DialogDescription>Preencha os dados da cobrança</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={(v) => { setClienteId(v); setDeclaracaoId(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {declaracoes.length > 0 && (
            <div>
              <Label>Declaração (opcional)</Label>
              <Select value={declaracaoId} onValueChange={setDeclaracaoId}>
                <SelectTrigger><SelectValue placeholder="Vincular a declaração" /></SelectTrigger>
                <SelectContent>
                  {declaracoes.map((d: any) => <SelectItem key={d.id} value={d.id}>IR {d.ano_base}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Descrição *</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Declaração IRPF 2025" maxLength={200} />
          </div>
          <div>
            <Label>Valor (R$) *</Label>
            <Input value={valorStr} onChange={(e) => setValorStr(maskCurrency(e.target.value))} placeholder="0,00" />
          </div>
          <div>
            <Label>Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !dataVencimento && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataVencimento ? format(dataVencimento, 'dd/MM/yyyy') : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dataVencimento} onSelect={setDataVencimento} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !clienteId || !descricao || !valorStr || !dataVencimento}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
