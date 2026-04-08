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
        .select('id, escritorio_id, contador_responsavel_id, nome, cpf, email, telefone, data_nascimento, status_onboarding, created_at, auth_user_id, conta_azul_id, usuarios!clientes_contador_responsavel_id_fkey(nome)', { count: 'exact' })
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
      const { data: cliente, error } = await supabase
        .from('clientes')
        .insert({ ...input, escritorio_id: escritorioId })
        .select('id')
        .single();
      if (error) throw error;

      // Auto-create declaration for current year
      const anoBase = new Date().getFullYear() - 1;
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

      // Create base checklist
      if (newDecl) {
        await supabase.from('checklist_documentos').insert([
          { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'documentos_pessoais', obrigatorio: true, declaracao_id: newDecl.id },
          { nome_documento: 'CPF do Titular', categoria: 'documentos_pessoais', obrigatorio: true, declaracao_id: newDecl.id },
          { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'documentos_pessoais', obrigatorio: true, declaracao_id: newDecl.id },
          { nome_documento: 'Título de Eleitor (opcional)', categoria: 'documentos_pessoais', obrigatorio: false, declaracao_id: newDecl.id },
          { nome_documento: 'Última Declaração Entregue (Recibo)', categoria: 'documentos_pessoais', obrigatorio: false, declaracao_id: newDecl.id },
        ]);
      }
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
    contadores: contadores.data ?? [],
    createCliente,
  };
}
