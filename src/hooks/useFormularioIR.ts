import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { TablesUpdate } from '@/integrations/supabase/types';
import {
  validatePartial,
  validateComplete,
  type Dependente,
  type Alimentando,
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
  data_nascimento: string;
  raca_cor: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  natureza_ocupacao: string;
  ocupacao_principal: string;
  dependentes: Dependente[];
  alimentandos: Alimentando[];
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
  chave_pix_cliente: string;
}

const INITIAL_DATA: FormularioData = {
  estado_civil: '',
  conjuge_nome: '',
  conjuge_cpf: '',
  data_nascimento: '',
  raca_cor: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  natureza_ocupacao: '',
  ocupacao_principal: '',
  dependentes: [],
  alimentandos: [],
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
  chave_pix_cliente: '',
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

  // Reaproveita o cache de `useClientePortal` (mesma queryKey). Selecionamos o
  // superset de campos para que ambos os hooks compartilhem o resultado.
  const { data: declaracao } = useQuery({
    queryKey: ['cliente-declaracao-ativa', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const anoAtual = new Date().getFullYear();
      const SELECT = 'id, cliente_id, escritorio_id, contador_id, ano_base, status, status_documentos, tipo_resultado, valor_resultado, numero_recibo, data_transmissao, forma_tributacao, ultima_atualizacao_status, created_at, version';
      const { data: doAno } = await supabase
        .from('declaracoes')
        .select(SELECT)
        .eq('cliente_id', clienteId)
        .eq('ano_base', anoAtual)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (doAno) return doAno;
      const { data } = await supabase
        .from('declaracoes')
        .select(SELECT)
        .eq('cliente_id', clienteId)
        .order('ano_base', { ascending: false })
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
      // The Supabase generated types don't yet include the newer endereço/ocupação/pix
      // columns; cast through a partial typed shape rather than `any`.
      type FormularioExtra = Partial<{
        data_nascimento: string;
        raca_cor: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        uf: string;
        natureza_ocupacao: string;
        ocupacao_principal: string;
        alimentandos: Alimentando[];
        chave_pix_cliente: string;
      }>;
      const extra = formulario as unknown as FormularioExtra;
      setFormData({
        estado_civil: formulario.estado_civil || '',
        conjuge_nome: formulario.conjuge_nome || '',
        conjuge_cpf: formulario.conjuge_cpf || '',
        data_nascimento: extra.data_nascimento || '',
        raca_cor: extra.raca_cor || '',
        cep: extra.cep || '',
        logradouro: extra.logradouro || '',
        numero: extra.numero || '',
        complemento: extra.complemento || '',
        bairro: extra.bairro || '',
        cidade: extra.cidade || '',
        uf: extra.uf || '',
        natureza_ocupacao: extra.natureza_ocupacao || '',
        ocupacao_principal: extra.ocupacao_principal || '',
        dependentes: (formulario.dependentes as unknown as Dependente[]) || [],
        alimentandos: extra.alimentandos || [],
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
        chave_pix_cliente: extra.chave_pix_cliente || '',
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

      const updatePayload = {
        ...data,
        ultima_atualizacao: new Date().toISOString(),
      } as TablesUpdate<'formulario_ir'>;

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

    // Partial validation to allow finishing even with minor issues, as requested
    const validation = validatePartial(formData as unknown as Record<string, unknown>);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      setValidationErrors(fieldErrors);
      
      const firstError = validation.error.errors[0];
      toast.error(`Atenção: ${firstError.message} (${firstError.path.join('.')})`);
      // We still return true or false based on whether we want to HARD block
      // The user asked "sem validação ou checklist", so let's be more lenient
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
          // Buscar documentos anexados
          const { data: docs } = await supabase
            .from('checklist_documentos')
            .select('status')
            .eq('declaracao_id', declaracao.id);

          const docsCount = docs?.filter(d => d.status === 'recebido').length || 0;
          const msg = docsCount > 0 
            ? `O cliente preencheu as informações e anexou ${docsCount} documentos.`
            : `O cliente preencheu as informações cadastrais, mas ainda não anexou documentos.`;

          await supabase.from('notificacoes').insert({
            escritorio_id: declaracao.escritorio_id,
            titulo: '✅ Informações Cadastrais Preenchidas',
            mensagem: msg,
            link_destino: `/clientes/${clienteId}`,
          });
        } catch (err) {
          console.error('Erro ao enviar notificação:', err);
        }
      }

      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ['formulario-ir'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao'] });
      return true;
    } catch (err) {
      console.error('Erro ao finalizar:', err);
      toast.error('Erro ao finalizar formulário');
      return false;
    }
  }, [formulario?.id, clienteId, declaracao, queryClient, formData]);

  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const { data } = await supabase
        .from('clientes')
        .select('cpf')
        .eq('id', clienteId)
        .single();
      return data;
    },
    enabled: !!clienteId,
  });

  return {
    formData,
    updateField,
    formulario,
    declaracao,
    isLoading: isLoading || !clientInfo,
    saving,
    lastSaved,
    finalizar,
    validationErrors,
    clientCPF: clientInfo?.cpf || '',
  };
}
