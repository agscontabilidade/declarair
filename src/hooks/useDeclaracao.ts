import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedInvalidate } from '@/hooks/useDebouncedInvalidate';

export function useDeclaracao(declaracaoId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const debouncedInvalidate = useDebouncedInvalidate(300);

  // Lista explícita: omite colunas JSONB pesadas (declaracao_extracao, recibo_extracao,
  // mei_extracao, darf_extracao) que não são consumidas em nenhum componente.
  const DECLARACAO_COLUMNS =
    'id, cliente_id, escritorio_id, contador_id, ano_base, status, tipo_resultado, ' +
    'valor_resultado, numero_recibo, data_transmissao, observacoes_internas, forma_tributacao, ' +
    'ultima_atualizacao_status, created_at, version, status_documentos, em_processamento, ' +
    'status_processamento_rfb, arquivo_declaracao_nome, arquivo_declaracao_url, ' +
    'arquivo_declaracao_uploaded_at, arquivo_recibo_url, arquivo_recibo_nome, ' +
    'arquivo_recibo_uploaded_at, recibo_validado_em, declaracao_validada_em, ' +
    'arquivo_analise_caixa_url, arquivo_analise_caixa_uploaded_at, declaracao_enviada_em, ' +
    'arquivo_mei_url, arquivo_mei_nome, arquivo_mei_uploaded_at, mei_validado_em, ' +
    'arquivo_darf_url, arquivo_darf_nome, arquivo_darf_uploaded_at, darf_validado_em, ' +
    'arquivos_outros, observacoes_cliente, observacoes_cliente_atualizado_em, observacoes_cliente_lida_em';


  const declaracao = useQuery({
    queryKey: ['declaracao', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracoes')
        .select(`${DECLARACAO_COLUMNS}, clientes(id, nome, cpf, email), usuarios!declaracoes_contador_id_fkey(nome)`)
        .eq('id', declaracaoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracaoId,
  });

  // Realtime: mantém a declaração sincronizada (status_processamento_rfb, status, etc.)
  useEffect(() => {
    if (!declaracaoId) return;
    const channel = supabase
      .channel(`declaracao-${declaracaoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'declaracoes', filter: `id=eq.${declaracaoId}` },
        () => {
          debouncedInvalidate(['declaracao', declaracaoId]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [declaracaoId, debouncedInvalidate]);

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
      const { data: currentDecl } = await supabase
        .from('declaracoes')
        .select('status, cliente_id, escritorio_id, ano_base')
        .eq('id', declaracaoId!)
        .single();

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

      // Se o status regrediu para aguardando_documentos, notifica o cliente
      if (input.status === 'aguardando_documentos' && currentDecl && currentDecl.status !== 'aguardando_documentos') {
        await supabase.from('notificacoes').insert({
          escritorio_id: currentDecl.escritorio_id,
          titulo: '⚠️ Pendência na Documentação',
          mensagem: `Seu contador solicitou novos documentos ou correções na declaração de ${currentDecl.ano_base}. Verifique os detalhes no portal.`,
          link_destino: '/cliente/documentos',
        });
      }
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

  const notasInternas = useQuery({
    queryKey: ['declaracao-notas', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracao_notas_internas')
        .select('*')
        .eq('declaracao_id', declaracaoId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracaoId,
  });

  const saveNotas = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!declaracaoId) throw new Error('Sem declaração');
      const escritorioId = profile.escritorioId;
      if (!escritorioId) throw new Error('Sem escritório');
      const { error } = await supabase
        .from('declaracao_notas_internas')
        .upsert(
          { declaracao_id: declaracaoId, escritorio_id: escritorioId, conteudo },
          { onConflict: 'declaracao_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao-notas', declaracaoId] });
    },
  });

  const uploadDoc = useMutation({
    mutationFn: async ({ docId, file, isRequestingNew }: { docId: string; file: File; isRequestingNew?: boolean }) => {
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
    mutationFn: async (input: { nome_documento: string; categoria: string; obrigatorio?: boolean }) => {
      const { data: currentDecl } = await supabase
        .from('declaracoes')
        .select('escritorio_id, ano_base, status')
        .eq('id', declaracaoId!)
        .single();

      const { error } = await supabase
        .from('checklist_documentos')
        .insert({ 
          ...input, 
          declaracao_id: declaracaoId!,
          status: 'pendente'
        });
      if (error) throw error;

      // Se o contador adicionar um documento e o status da declaração estiver avançado,
      // regride o status e notifica o cliente
      if (currentDecl && currentDecl.status !== 'aguardando_documentos') {
        await supabase
          .from('declaracoes')
          .update({ 
            status: 'aguardando_documentos',
            ultima_atualizacao_status: new Date().toISOString()
          })
          .eq('id', declaracaoId!);
        
        await supabase.from('notificacoes').insert({
          escritorio_id: currentDecl.escritorio_id,
          titulo: '📂 Novo Documento Solicitado',
          mensagem: `Seu contador adicionou um novo item necessário à sua checklist de ${currentDecl.ano_base}.`,
          link_destino: '/cliente/documentos',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
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
    notasInternas: notasInternas.data?.conteudo ?? null,
    notasLoading: notasInternas.isLoading,
    updateStatus,
    saveResultado,
    saveNotas,
    uploadDoc,
    addDocItem,
    papel: profile.papel,
  };
}
