import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FormularioData {
  estado_civil: string;
  conjuge_nome: string;
  conjuge_cpf: string;
  dependentes: any[];
  rendimentos_emprego: any[];
  rendimentos_autonomo: any;
  rendimentos_aluguel: any[];
  outros_rendimentos: any;
  bens_direitos: any[];
  dividas_onus: any[];
  despesas_medicas: any[];
  despesas_educacao: any[];
  previdencia_privada: any;
  informacoes_adicionais: string;
}

const INITIAL_DATA: FormularioData = {
  estado_civil: '',
  conjuge_nome: '',
  conjuge_cpf: '',
  dependentes: [],
  rendimentos_emprego: [],
  rendimentos_autonomo: {},
  rendimentos_aluguel: [],
  outros_rendimentos: {},
  bens_direitos: [],
  dividas_onus: [],
  despesas_medicas: [],
  despesas_educacao: [],
  previdencia_privada: {},
  informacoes_adicionais: '',
};

export function useFormularioIR() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const clienteId = profile.clienteId;
  const [formData, setFormData] = useState<FormularioData>(INITIAL_DATA);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Get active declaration
  const { data: declaracao } = useQuery({
    queryKey: ['cliente-declaracao-form', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const { data } = await supabase
        .from('declaracoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!clienteId,
  });

  // Get or create formulario
  const { data: formulario, isLoading } = useQuery({
    queryKey: ['formulario-ir', declaracao?.id],
    queryFn: async () => {
      if (!declaracao?.id || !clienteId) return null;
      const { data: existing } = await supabase
        .from('formulario_ir')
        .select('*')
        .eq('declaracao_id', declaracao.id)
        .maybeSingle();

      if (existing) return existing;

      // Create new
      const { data: created, error } = await supabase
        .from('formulario_ir')
        .insert({
          cliente_id: clienteId,
          declaracao_id: declaracao.id,
          ano_base: declaracao.ano_base,
          status_preenchimento: 'em_andamento',
        })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    enabled: !!declaracao?.id && !!clienteId,
  });

  // Sync form data from DB
  useEffect(() => {
    if (formulario) {
      setFormData({
        estado_civil: formulario.estado_civil || '',
        conjuge_nome: formulario.conjuge_nome || '',
        conjuge_cpf: formulario.conjuge_cpf || '',
        dependentes: (formulario.dependentes as any[]) || [],
        rendimentos_emprego: (formulario.rendimentos_emprego as any[]) || [],
        rendimentos_autonomo: formulario.rendimentos_autonomo || {},
        rendimentos_aluguel: (formulario.rendimentos_aluguel as any[]) || [],
        outros_rendimentos: formulario.outros_rendimentos || {},
        bens_direitos: (formulario.bens_direitos as any[]) || [],
        dividas_onus: (formulario.dividas_onus as any[]) || [],
        despesas_medicas: (formulario.despesas_medicas as any[]) || [],
        despesas_educacao: (formulario.despesas_educacao as any[]) || [],
        previdencia_privada: formulario.previdencia_privada || {},
        informacoes_adicionais: formulario.informacoes_adicionais || '',
      });
    }
  }, [formulario]);

  const saveToDb = useCallback(async (data: Partial<FormularioData>) => {
    if (!formulario?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('formulario_ir')
        .update({ ...data, ultima_atualizacao: new Date().toISOString() })
        .eq('id', formulario.id);
      if (error) throw error;
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  }, [formulario?.id]);

  const updateField = useCallback((field: keyof FormularioData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => saveToDb({ [field]: value }), 1500);
      return updated;
    });
  }, [saveToDb]);

  const finalizar = useCallback(async () => {
    if (!formulario?.id || !clienteId) return;
    try {
      await supabase
        .from('formulario_ir')
        .update({ status_preenchimento: 'concluido', ultima_atualizacao: new Date().toISOString() })
        .eq('id', formulario.id);
      await supabase
        .from('clientes')
        .update({ status_onboarding: 'concluido' })
        .eq('id', clienteId);
      queryClient.invalidateQueries({ queryKey: ['formulario-ir'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao'] });
      return true;
    } catch {
      toast.error('Erro ao finalizar formulário');
      return false;
    }
  }, [formulario?.id, clienteId, queryClient]);

  return {
    formData, updateField, formulario, declaracao, isLoading, saving, lastSaved, finalizar,
  };
}
