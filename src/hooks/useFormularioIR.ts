import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  validatePartial,
  validateComplete,
  type Dependente,
  type RendimentoEmprego,
  type RendimentoAluguel,
  type DespesaMedica,
  type DespesaEducacao,
  type BemDireito,
  type DividaOnus,
} from '@/lib/schemas/formulario-ir';

export interface FormularioData {
  estado_civil: string;
  conjuge_nome: string;
  conjuge_cpf: string;
  dependentes: Dependente[];
  rendimentos_emprego: RendimentoEmprego[];
  rendimentos_autonomo: Record<string, unknown>;
  rendimentos_aluguel: RendimentoAluguel[];
  outros_rendimentos: Record<string, unknown>;
  bens_direitos: BemDireito[];
  dividas_onus: DividaOnus[];
  despesas_medicas: DespesaMedica[];
  despesas_educacao: DespesaEducacao[];
  previdencia_privada: Record<string, unknown>;
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
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
        dependentes: (formulario.dependentes as unknown as Dependente[]) || [],
        rendimentos_emprego: (formulario.rendimentos_emprego as unknown as RendimentoEmprego[]) || [],
        rendimentos_autonomo: (formulario.rendimentos_autonomo as unknown as Record<string, unknown>) || {},
        rendimentos_aluguel: (formulario.rendimentos_aluguel as unknown as RendimentoAluguel[]) || [],
        outros_rendimentos: (formulario.outros_rendimentos as unknown as Record<string, unknown>) || {},
        bens_direitos: (formulario.bens_direitos as unknown as BemDireito[]) || [],
        dividas_onus: (formulario.dividas_onus as unknown as DividaOnus[]) || [],
        despesas_medicas: (formulario.despesas_medicas as unknown as DespesaMedica[]) || [],
        despesas_educacao: (formulario.despesas_educacao as unknown as DespesaEducacao[]) || [],
        previdencia_privada: (formulario.previdencia_privada as unknown as Record<string, unknown>) || {},
        informacoes_adicionais: formulario.informacoes_adicionais || '',
      });
    }
  }, [formulario]);

  const saveToDb = useCallback(async (data: Partial<FormularioData>) => {
    if (!formulario?.id) return;
    setSaving(true);
    try {
      // Validate partial data before saving
      const validation = validatePartial(data as Record<string, unknown>);
      if (!validation.success) {
        const fieldErrors: Record<string, string[]> = {};
        validation.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        setValidationErrors((prev) => ({ ...prev, ...fieldErrors }));
        // Still save draft even with validation warnings
      }

      const updatePayload: Record<string, unknown> = {
        ...data,
        ultima_atualizacao: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('formulario_ir')
        .update(updatePayload)
        .eq('id', formulario.id);
      if (error) throw error;
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  }, [formulario?.id]);

  const updateField = useCallback(<K extends keyof FormularioData>(field: K, value: FormularioData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Clear validation errors for this field
      setValidationErrors((prevErrors) => {
        const next = { ...prevErrors };
        delete next[field];
        return next;
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => saveToDb({ [field]: value }), 1500);
      return updated;
    });
  }, [saveToDb]);

  const finalizar = useCallback(async () => {
    if (!formulario?.id || !clienteId) return false;

    // Full validation before finalizing
    const validation = validateComplete(formData as unknown as Record<string, unknown>);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      setValidationErrors(fieldErrors);
      toast.error('Corrija os erros antes de finalizar');
      return false;
    }

    try {
      await supabase
        .from('formulario_ir')
        .update({ status_preenchimento: 'concluido', ultima_atualizacao: new Date().toISOString() })
        .eq('id', formulario.id);
      await supabase
        .from('clientes')
        .update({ status_onboarding: 'concluido' })
        .eq('id', clienteId);

      // Create notification for the accountant
      if (declaracao) {
        try {
          await supabase.from('notificacoes').insert({
            escritorio_id: declaracao.escritorio_id,
            titulo: 'Formulário IR concluído',
            mensagem: 'O cliente finalizou o preenchimento do formulário IRPF.',
            link_destino: `/declaracoes/${declaracao.id}`,
          });
        } catch { /* notification is best-effort */ }
      }

      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ['formulario-ir'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao'] });
      return true;
    } catch {
      toast.error('Erro ao finalizar formulário');
      return false;
    }
  }, [formulario?.id, clienteId, declaracao, queryClient, formData]);

  return {
    formData,
    updateField,
    formulario,
    declaracao,
    isLoading,
    saving,
    lastSaved,
    finalizar,
    validationErrors,
  };
}
