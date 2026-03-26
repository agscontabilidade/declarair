import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TablesInsert } from '@/integrations/supabase/types';

const PAGE_SIZE = 10;

export function useClientes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['clientes', escritorioId, debouncedSearch, page],
    queryFn: async () => {
      if (!escritorioId) return { data: [], total: 0 };
      let q = supabase
        .from('clientes')
        .select('*, usuarios!clientes_contador_responsavel_id_fkey(nome)', { count: 'exact' })
        .eq('escritorio_id', escritorioId)
        .order('nome');

      if (debouncedSearch) {
        q = q.or(`nome.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
      }

      const from = page * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data || [], total: count ?? 0 };
    },
    enabled: !!escritorioId,
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
  });

  const createCliente = useMutation({
    mutationFn: async (input: Omit<TablesInsert<'clientes'>, 'escritorio_id'>) => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { error } = await supabase.from('clientes').insert({ ...input, escritorio_id: escritorioId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', escritorioId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
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
    contadores: contadores.data ?? [],
    createCliente,
  };
}
