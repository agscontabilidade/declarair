import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PORTAL_BASE_URL } from '@/lib/constants';

export function useClientePerfil(clienteId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  const cliente = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, usuarios!clientes_contador_responsavel_id_fkey(id, nome)')
        .eq('id', clienteId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  const declaracoes = useQuery({
    queryKey: ['cliente-declaracoes', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracoes')
        .select('*, usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('cliente_id', clienteId!)
        .order('ano_base', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
  });

  const cobrancas = useQuery({
    queryKey: ['cliente-cobrancas', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
  });

  const mensagens = useQuery({
    queryKey: ['cliente-mensagens', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('enviado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
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

  const enviarConvite = useMutation({
    mutationFn: async () => {
      if (!clienteId) throw new Error('Sem cliente');
      const token = crypto.randomUUID();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      const { error } = await supabase
        .from('clientes')
        .update({
          token_convite: token,
          token_convite_expira_em: expiraEm.toISOString(),
          status_onboarding: 'convite_enviado',
        })
        .eq('id', clienteId);
      if (error) throw error;

      const url = `${window.location.origin}/cliente/convite/${token}`;
      await navigator.clipboard.writeText(url);
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
    },
  });

  const criarDeclaracao = useMutation({
    mutationFn: async (input: { ano_base: number; contador_id: string | null }) => {
      if (!clienteId || !escritorioId) throw new Error('Dados incompletos');

      const { data: decl, error: declError } = await supabase
        .from('declaracoes')
        .insert({
          cliente_id: clienteId,
          escritorio_id: escritorioId,
          ano_base: input.ano_base,
          contador_id: input.contador_id,
        })
        .select()
        .single();
      if (declError) throw declError;

      const checklistItems = [
        { nome_documento: 'Informe de Rendimentos', categoria: 'Rendimentos' },
        { nome_documento: 'Comprovante de CPF', categoria: 'Outros' },
        { nome_documento: 'Comprovante de Residência', categoria: 'Outros' },
        { nome_documento: 'Documentos de Dependentes', categoria: 'Outros' },
        { nome_documento: 'Comprovantes de Despesas Médicas', categoria: 'Deduções' },
      ].map(item => ({ ...item, declaracao_id: decl.id }));

      const { error: checkError } = await supabase
        .from('checklist_documentos')
        .insert(checklistItems);
      if (checkError) throw checkError;

      return decl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracoes', clienteId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
    },
  });

  const marcarPago = useMutation({
    mutationFn: async (cobrancaId: string) => {
      const { error } = await supabase
        .from('cobrancas')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', cobrancaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-cobrancas', clienteId] });
    },
  });

  const criarCobranca = useMutation({
    mutationFn: async (input: { descricao: string; valor: number; data_vencimento: string; declaracao_id?: string }) => {
      if (!clienteId || !escritorioId) throw new Error('Dados incompletos');
      const { error } = await supabase
        .from('cobrancas')
        .insert({
          cliente_id: clienteId,
          escritorio_id: escritorioId,
          ...input,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-cobrancas', clienteId] });
    },
  });

  return {
    cliente: cliente.data,
    isLoading: cliente.isLoading,
    declaracoes: declaracoes.data ?? [],
    declaracoesLoading: declaracoes.isLoading,
    cobrancas: cobrancas.data ?? [],
    cobrancasLoading: cobrancas.isLoading,
    mensagens: mensagens.data ?? [],
    mensagensLoading: mensagens.isLoading,
    contadores: contadores.data ?? [],
    enviarConvite,
    criarDeclaracao,
    marcarPago,
    criarCobranca,
  };
}
