import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useClientePortal() {
  const { profile } = useAuth();
  const clienteId = profile.clienteId;

  const { data: declaracao, isLoading: loadingDeclaracao, isError: errorDeclaracao, error: declError, refetch: refetchDeclaracao } = useQuery({
    queryKey: ['cliente-declaracao', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, cliente_id, escritorio_id, contador_id, ano_base, status, tipo_resultado, valor_resultado, numero_recibo, data_transmissao, forma_tributacao, ultima_atualizacao_status, created_at, version')
        .eq('cliente_id', clienteId)
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

  const statusStep = declaracao ? {
    aguardando_documentos: 1,
    documentacao_recebida: 2,
    declaracao_pronta: 3,
    transmitida: 4,
  }[declaracao.status] || 1 : 0;

  const pendentes = checklist.filter((c: any) => c.status === 'pendente');

  return {
    declaracao, checklist, formulario, statusStep, pendentes,
    isLoading: loadingDeclaracao || loadingChecklist || loadingFormulario,
    isError: errorDeclaracao,
    error: declError,
    refetch: refetchDeclaracao,
  };
}
