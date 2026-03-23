import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCobrancas(statusFilter?: string, periodoInicio?: string, periodoFim?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  // Auto-detect atrasados on mount
  const { data: _autoDetect } = useQuery({
    queryKey: ['cobrancas-auto-detect', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return null;
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('cobrancas')
        .update({ status: 'atrasado' })
        .lt('data_vencimento', today)
        .eq('status', 'pendente')
        .eq('escritorio_id', escritorioId);
      return true;
    },
    enabled: !!escritorioId,
    staleTime: 60000,
  });

  const { data: cobrancas = [], isLoading } = useQuery({
    queryKey: ['cobrancas', escritorioId, statusFilter, periodoInicio, periodoFim],
    queryFn: async () => {
      if (!escritorioId) return [];
      let query = supabase
        .from('cobrancas')
        .select('*, clientes(nome, cpf)')
        .eq('escritorio_id', escritorioId)
        .order('data_vencimento', { ascending: false });

      if (statusFilter && statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }
      if (periodoInicio) query = query.gte('data_vencimento', periodoInicio);
      if (periodoFim) query = query.lte('data_vencimento', periodoFim);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const kpis = {
    totalReceber: cobrancas
      .filter((c: any) => c.status === 'pendente' || c.status === 'atrasado')
      .reduce((sum: number, c: any) => sum + Number(c.valor), 0),
    recebidoAno: cobrancas
      .filter((c: any) => c.status === 'pago' && c.data_pagamento && new Date(c.data_pagamento).getFullYear() === new Date().getFullYear())
      .reduce((sum: number, c: any) => sum + Number(c.valor), 0),
    atrasado: cobrancas
      .filter((c: any) => c.status === 'atrasado')
      .reduce((sum: number, c: any) => sum + Number(c.valor), 0),
  };

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cobrancas')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;

      // Create notification
      if (escritorioId) {
        try {
          await (supabase as any).from('notificacoes').insert({
            escritorio_id: escritorioId,
            titulo: 'Cobrança paga',
            mensagem: 'Uma cobrança foi marcada como paga.',
          });
        } catch { /* best-effort */ }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança marcada como paga');
    },
    onError: () => toast.error('Erro ao atualizar cobrança'),
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cobrancas').update({ status: 'cancelado' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança cancelada');
    },
    onError: () => toast.error('Erro ao cancelar cobrança'),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cobrancas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança excluída');
    },
    onError: () => toast.error('Erro ao excluir cobrança'),
  });

  const criar = useMutation({
    mutationFn: async (data: { cliente_id: string; declaracao_id?: string; descricao: string; valor: number; data_vencimento: string }) => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { error } = await supabase.from('cobrancas').insert({
        ...data,
        escritorio_id: escritorioId,
        declaracao_id: data.declaracao_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança criada');
    },
    onError: () => toast.error('Erro ao criar cobrança'),
  });

  const editar = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; descricao?: string; valor?: number; data_vencimento?: string; cliente_id?: string; declaracao_id?: string | null }) => {
      const { error } = await supabase.from('cobrancas').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança atualizada');
    },
    onError: () => toast.error('Erro ao atualizar cobrança'),
  });

  return { cobrancas, isLoading, kpis, marcarPago, cancelar, excluir, criar, editar };
}
