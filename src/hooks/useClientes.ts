import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { ClienteWithContador } from '@/types/domain';

const PAGE_SIZE = 20;

export type OrdenacaoClientes = 'alfabetica_az' | 'alfabetica_za' | 'cadastro_recente' | 'cadastro_antigo';
export type FiltroProcuracao = 'todas' | 'ativa' | 'pendente';
export type FiltroCobranca = 'todas' | 'gerada' | 'nao_gerada';

export function useClientes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile?.escritorioId;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [ordenacao, setOrdenacaoState] = useState<OrdenacaoClientes>('alfabetica_az');
  const [filtroProcuracao, setFiltroProcuracaoState] = useState<FiltroProcuracao>('todas');
  const [filtroCobranca, setFiltroCobrancaState] = useState<FiltroCobranca>('todas');

  const setOrdenacao = (v: OrdenacaoClientes) => { setOrdenacaoState(v); setPage(0); };
  const setFiltroProcuracao = (v: FiltroProcuracao) => { setFiltroProcuracaoState(v); setPage(0); };
  const setFiltroCobranca = (v: FiltroCobranca) => { setFiltroCobrancaState(v); setPage(0); };

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const cobrancasPorCliente = useQuery({
    queryKey: ['cobrancas-por-cliente', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return new Set<string>();
      const { data, error } = await supabase
        .from('cobrancas')
        .select('cliente_id')
        .eq('escritorio_id', escritorioId);
      if (error) throw error;
      return new Set<string>((data || []).map((r) => r.cliente_id));
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60 * 2,
  });

  const cobrancasSet = cobrancasPorCliente.data;
  const cobrancasReady = cobrancasPorCliente.isSuccess;

  const query = useQuery({
    queryKey: [
      'clientes', escritorioId, debouncedSearch, page,
      ordenacao, filtroProcuracao, filtroCobranca,
      filtroCobranca !== 'todas' ? Array.from(cobrancasSet ?? []).sort().join(',') : null,
    ],
    queryFn: async () => {
      if (!escritorioId) return { data: [] as ClienteWithContador[], total: 0 };

      let q = supabase
        .from('clientes')
        .select('id, escritorio_id, contador_responsavel_id, nome, cpf, email, telefone, data_nascimento, status_onboarding, created_at, auth_user_id, conta_azul_id, procuracao_ecac, procuracao_ecac_validade, usuarios!clientes_contador_responsavel_id_fkey(nome)', { count: 'exact' })
        .eq('escritorio_id', escritorioId);

      // Ordenação
      switch (ordenacao) {
        case 'alfabetica_az': q = q.order('nome', { ascending: true }); break;
        case 'alfabetica_za': q = q.order('nome', { ascending: false }); break;
        case 'cadastro_recente': q = q.order('created_at', { ascending: false }); break;
        case 'cadastro_antigo': q = q.order('created_at', { ascending: true }); break;
      }

      // Filtro procuração e-CAC
      if (filtroProcuracao === 'ativa') q = q.eq('procuracao_ecac', true);
      else if (filtroProcuracao === 'pendente') q = q.eq('procuracao_ecac', false);

      // Filtro cobrança (depende do set carregado)
      if (filtroCobranca === 'gerada') {
        const ids = Array.from(cobrancasSet ?? []);
        if (ids.length === 0) return { data: [], total: 0 };
        q = q.in('id', ids);
      } else if (filtroCobranca === 'nao_gerada') {
        const ids = Array.from(cobrancasSet ?? []);
        if (ids.length > 0) {
          q = q.not('id', 'in', `(${ids.join(',')})`);
        }
      }

      if (debouncedSearch) {
        q = q.or(`nome.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
      }

      const from = page * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: ((data as unknown) as ClienteWithContador[]) || [], total: count ?? 0 };
    },
    enabled: !!escritorioId && (filtroCobranca === 'todas' || cobrancasReady),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const clientesComObservacao = useQuery({
    queryKey: ['clientes-com-observacao', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return new Set<string>();
      const { data, error } = await supabase
        .from('declaracoes')
        .select('cliente_id')
        .eq('escritorio_id', escritorioId)
        .not('observacoes_cliente', 'is', null)
        .is('observacoes_cliente_lida_em', null);
      if (error) throw error;
      return new Set<string>((data || []).map((r) => r.cliente_id));
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60 * 2,
  });

  const contadores = useQuery({
    queryKey: ['contadores', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('escritorio_id', escritorioId)
        .eq('ativo', true);
      return data || [];
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60 * 10,
  });

  const createCliente = useMutation({
    mutationFn: async (input: Omit<TablesInsert<'clientes'>, 'escritorio_id'>): Promise<{ clienteId: string; declaracaoId: string | null }> => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { data: cliente, error } = await supabase
        .from('clientes')
        .insert({ ...input, escritorio_id: escritorioId })
        .select('id')
        .single();
      if (error) throw error;

      const anoBase = new Date().getFullYear();
      const { data: newDecl } = await supabase
        .from('declaracoes')
        .insert({
          cliente_id: cliente.id,
          escritorio_id: escritorioId,
          ano_base: anoBase,
          status: 'aguardando_documentos',
        })
        .select('id')
        .single();

      return { clienteId: cliente.id, declaracaoId: newDecl?.id ?? null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', escritorioId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TablesUpdate<'clientes'>) => {
      const { error } = await supabase
        .from('clientes')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', escritorioId] });
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', escritorioId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
    },
  });

  const totalPages = Math.ceil((query.data?.total ?? 0) / PAGE_SIZE);

  return {
    clientes: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    search, setSearch,
    page, setPage,
    totalPages,
    ordenacao, setOrdenacao,
    filtroProcuracao, setFiltroProcuracao,
    filtroCobranca, setFiltroCobranca,
    contadores: contadores.data ?? [],
    clientesComCobranca: cobrancasPorCliente.data ?? new Set<string>(),
    clientesComObservacao: clientesComObservacao.data ?? new Set<string>(),
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
