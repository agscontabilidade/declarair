import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDeclaracao(declaracaoId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const declaracao = useQuery({
    queryKey: ['declaracao', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracoes')
        .select('*, clientes(id, nome, cpf, email), usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('id', declaracaoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracaoId,
  });

  const checklist = useQuery({
    queryKey: ['declaracao-checklist', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('*')
        .eq('declaracao_id', declaracaoId!)
        .order('categoria')
        .order('nome_documento');
      if (error) throw error;
      return data || [];
    },
    enabled: !!declaracaoId,
  });

  const formularioIR = useQuery({
    queryKey: ['declaracao-formulario', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formulario_ir')
        .select('*')
        .eq('declaracao_id', declaracaoId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracaoId,
  });

  const updateStatus = useMutation({
    mutationFn: async (input: {
      status: string;
      numero_recibo?: string;
      data_transmissao?: string;
      tipo_resultado?: string;
      valor_resultado?: number | null;
    }) => {
      const { error } = await supabase
        .from('declaracoes')
        .update({
          status: input.status,
          ultima_atualizacao_status: new Date().toISOString(),
          ...(input.numero_recibo && { numero_recibo: input.numero_recibo }),
          ...(input.data_transmissao && { data_transmissao: input.data_transmissao }),
          ...(input.tipo_resultado && { tipo_resultado: input.tipo_resultado }),
          ...(input.valor_resultado !== undefined && { valor_resultado: input.valor_resultado }),
        })
        .eq('id', declaracaoId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });

  const saveResultado = useMutation({
    mutationFn: async (input: { tipo_resultado: string; valor_resultado: number | null; numero_recibo: string }) => {
      const { error } = await supabase
        .from('declaracoes')
        .update(input)
        .eq('id', declaracaoId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
    },
  });

  const saveNotas = useMutation({
    mutationFn: async (observacoes_internas: string) => {
      const { error } = await supabase
        .from('declaracoes')
        .update({ observacoes_internas })
        .eq('id', declaracaoId!);
      if (error) throw error;
    },
  });

  const uploadDoc = useMutation({
    mutationFn: async ({ docId, file }: { docId: string; file: File }) => {
      const escritorioId = profile.escritorioId;
      const clienteId = declaracao.data?.clientes?.id;
      if (!escritorioId || !clienteId) throw new Error('Dados incompletos');

      const path = `${escritorioId}/${clienteId}/${docId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('checklist_documentos')
        .update({
          arquivo_url: path,
          arquivo_nome: file.name,
          status: 'recebido',
          data_recebimento: new Date().toISOString(),
        })
        .eq('id', docId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
    },
  });

  const addDocItem = useMutation({
    mutationFn: async (input: { nome_documento: string; categoria: string }) => {
      const { error } = await supabase
        .from('checklist_documentos')
        .insert({ ...input, declaracao_id: declaracaoId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
    },
  });

  return {
    declaracao: declaracao.data,
    isLoading: declaracao.isLoading,
    isError: declaracao.isError,
    error: declaracao.error,
    refetch: declaracao.refetch,
    checklist: checklist.data ?? [],
    checklistLoading: checklist.isLoading,
    formularioIR: formularioIR.data,
    formularioLoading: formularioIR.isLoading,
    updateStatus,
    saveResultado,
    saveNotas,
    uploadDoc,
    addDocItem,
    papel: profile.papel,
  };
}
