import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CobrancaComCliente } from '@/types/domain';

interface UseCobrancasParams {
  statusFilter?: string;
  periodoInicio?: string;
  periodoFim?: string;
  busca?: string;
  clienteId?: string | null;
  page?: number;
  pageSize?: number;
}

export function useCobrancas(params: UseCobrancasParams = {}) {
  const {
    statusFilter,
    periodoInicio,
    periodoFim,
    busca = '',
    clienteId = null,
    page = 0,
    pageSize = 25,
  } = params;

  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  // Auto-detect atrasados on mount
  useQuery({
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

  const buscaTrim = busca.trim();

  const { data: pageData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cobrancas', escritorioId, statusFilter, periodoInicio, periodoFim, buscaTrim, clienteId, page, pageSize],
    queryFn: async () => {
      if (!escritorioId) return { data: [] as CobrancaComCliente[], total: 0 };

      let query = supabase
        .from('cobrancas')
        .select('*, clientes(nome, cpf)', { count: 'exact' })
        .eq('escritorio_id', escritorioId)
        .order('data_vencimento', { ascending: false });

      if (statusFilter && statusFilter !== 'todos') query = query.eq('status', statusFilter);
      if (periodoInicio) query = query.gte('data_vencimento', periodoInicio);
      if (periodoFim) query = query.lte('data_vencimento', periodoFim);
      if (clienteId) query = query.eq('cliente_id', clienteId);

      if (buscaTrim) {
        // Busca por descrição (server-side). Nome/CPF do cliente em tabela relacionada
        // ficam fora do .or() por simplicidade; filtro client-side cobre a página atual.
        query = query.ilike('descricao', `%${buscaTrim}%`);
      }

      const from = page * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error: qError } = await query;
      if (qError) throw qError;
      return { data: (data || []) as CobrancaComCliente[], total: count ?? 0 };
    },
    enabled: !!escritorioId,
    placeholderData: keepPreviousData,
  });

  const cobrancas = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // KPIs: query separada, sempre global por escritório (não depende de filtros/paginação)
  const { data: kpis = { totalReceber: 0, recebidoAno: 0, atrasado: 0 } } = useQuery({
    queryKey: ['cobrancas-kpis', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return { totalReceber: 0, recebidoAno: 0, atrasado: 0 };
      const inicioAno = `${new Date().getFullYear()}-01-01`;

      const [pendAtr, pagoAno, atras] = await Promise.all([
        supabase
          .from('cobrancas')
          .select('valor')
          .eq('escritorio_id', escritorioId)
          .in('status', ['pendente', 'atrasado']),
        supabase
          .from('cobrancas')
          .select('valor')
          .eq('escritorio_id', escritorioId)
          .eq('status', 'pago')
          .gte('data_pagamento', inicioAno),
        supabase
          .from('cobrancas')
          .select('valor')
          .eq('escritorio_id', escritorioId)
          .eq('status', 'atrasado'),
      ]);

      const sum = (rows: { valor: number | string }[] | null) =>
        (rows || []).reduce((acc, r) => acc + Number(r.valor || 0), 0);

      return {
        totalReceber: sum(pendAtr.data),
        recebidoAno: sum(pagoAno.data),
        atrasado: sum(atras.data),
      };
    },
    enabled: !!escritorioId,
    staleTime: 60000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
    queryClient.invalidateQueries({ queryKey: ['cobrancas-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['cobrancas-por-cliente'] });
  };

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase.from('cobrancas').select('status').eq('id', id).single();
      const isPaid = current?.status === 'pago';

      const { error: uErr } = await supabase
        .from('cobrancas')
        .update({
          status: isPaid ? 'pendente' : 'pago',
          data_pagamento: isPaid ? null : new Date().toISOString().split('T')[0],
        })
        .eq('id', id);
      if (uErr) throw uErr;

      if (!isPaid && escritorioId) {
        try {
          await supabase.from('notificacoes').insert({
            escritorio_id: escritorioId,
            titulo: 'Cobrança paga',
            mensagem: 'Uma cobrança foi marcada como paga.',
          });
        } catch { /* best-effort */ }
      }
      return !isPaid;
    },
    onSuccess: (isNowPaid) => {
      invalidateAll();
      toast.success(isNowPaid ? 'Cobrança marcada como paga' : 'Pagamento estornado com sucesso');
    },
    onError: () => toast.error('Erro ao atualizar cobrança'),
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error: cErr } = await supabase.from('cobrancas').update({ status: 'cancelado' }).eq('id', id);
      if (cErr) throw cErr;
    },
    onSuccess: () => { invalidateAll(); toast.success('Cobrança cancelada'); },
    onError: () => toast.error('Erro ao cancelar cobrança'),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error: dErr } = await supabase.from('cobrancas').delete().eq('id', id);
      if (dErr) throw dErr;
    },
    onSuccess: () => { invalidateAll(); toast.success('Cobrança excluída'); },
    onError: () => toast.error('Erro ao excluir cobrança'),
  });

  const criar = useMutation({
    mutationFn: async (data: { cliente_id: string; declaracao_id?: string; descricao: string; valor: number; data_vencimento: string }) => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { error: iErr } = await supabase.from('cobrancas').insert({
        ...data,
        escritorio_id: escritorioId,
        declaracao_id: data.declaracao_id || null,
      });
      if (iErr) throw iErr;
    },
    onSuccess: () => { invalidateAll(); toast.success('Cobrança criada'); },
    onError: () => toast.error('Erro ao criar cobrança'),
  });

  const editar = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; descricao?: string; valor?: number; data_vencimento?: string; cliente_id?: string; declaracao_id?: string | null }) => {
      const { error: eErr } = await supabase.from('cobrancas').update(data).eq('id', id);
      if (eErr) throw eErr;
    },
    onSuccess: () => { invalidateAll(); toast.success('Cobrança atualizada'); },
    onError: () => toast.error('Erro ao atualizar cobrança'),
  });

  return {
    cobrancas, total, totalPages,
    isLoading, isError, error, refetch,
    kpis,
    marcarPago, cancelar, excluir, criar, editar,
  };
}
