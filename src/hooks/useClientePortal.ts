import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAnoBaseAtual } from '@/lib/constants';

export function useClientePortal() {
  const { profile } = useAuth();
  const clienteId = profile.clienteId;

  const { data: declaracao, isLoading: loadingDeclaracao, isError: errorDeclaracao, error: declError, refetch: refetchDeclaracao } = useQuery({
    queryKey: ['cliente-declaracao', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const anoAtual = getAnoBaseAtual();
      // 1) Prioriza a declaração do ano corrente
      const { data: doAno, error: errAno } = await supabase
        .from('declaracoes')
        .select('id, cliente_id, escritorio_id, contador_id, ano_base, status, status_documentos, tipo_resultado, valor_resultado, numero_recibo, data_transmissao, forma_tributacao, ultima_atualizacao_status, created_at, version')
        .eq('cliente_id', clienteId)
        .eq('ano_base', anoAtual)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (errAno) throw errAno;
      if (doAno) return doAno;

      // 2) Fallback: declaração mais recente por ano-base, depois por created_at
      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, cliente_id, escritorio_id, contador_id, ano_base, status, status_documentos, tipo_resultado, valor_resultado, numero_recibo, data_transmissao, forma_tributacao, ultima_atualizacao_status, created_at, version')
        .eq('cliente_id', clienteId)
        .order('ano_base', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  const { data: checklist = [], isLoading: loadingChecklist } = useQuery({
    queryKey: ['cliente-checklist', declaracao?.id],
    queryFn: async () => {
      if (!declaracao?.id) return [];
      const { data, error } = await supabase
        .from('checklist_documentos')
        .select('*')
        .eq('declaracao_id', declaracao.id)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!declaracao?.id,
  });

  const { data: formulario, isLoading: loadingFormulario } = useQuery({
    queryKey: ['cliente-formulario', declaracao?.id],
    queryFn: async () => {
      if (!declaracao?.id) return null;
      const { data, error } = await supabase
        .from('formulario_ir')
        .select('*')
        .eq('declaracao_id', declaracao.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracao?.id,
  });

  const statusStep = (() => {
    if (!declaracao) return 0;
    
    const hasPendencia = checklist.some((doc: { status: string; obrigatorio: boolean }) => doc.status === 'pendente' && doc.obrigatorio);
    
    // Etapa 5: Transmitida
    if (declaracao.status === 'transmitida') return 5;
    
    // Etapa 4: Declaração Pronta
    if (declaracao.status === 'declaracao_pronta') return 4;
    
    // Se houver pendência marcada pelo contador, retorna para a etapa de Enviar Documentos (Etapa 2)
    // mesmo que o status da declaração esteja como documentacao_recebida
    if (hasPendencia && declaracao.status === 'documentacao_recebida') {
      return 2;
    }
    
    // Etapa 3: Documentação Recebida
    if (declaracao.status === 'documentacao_recebida') return 3;
    
    // Etapa 2: Enviar Documentos (se o formulário já foi concluído ou se já existem documentos anexados)
    if (formulario?.status_preenchimento === 'concluido' || checklist.length > 0) return 2;
    
    // Etapa 1: Enviar Dados Cadastrais (status inicial)
    return 1;
  })();


  const pendentes = checklist.filter((c: { status: string }) => c.status === 'pendente');

  return {
    declaracao, checklist, formulario, statusStep, pendentes,
    isLoading: loadingDeclaracao || loadingChecklist || loadingFormulario,
    isError: errorDeclaracao,
    error: declError,
    refetch: refetchDeclaracao,
  };
}
