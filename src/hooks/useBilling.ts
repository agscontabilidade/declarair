import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getPlanoConfig } from '@/lib/constants/planos';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function billingAction(action: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const url = `https://${PROJECT_ID}.supabase.co/functions/v1/billing-service?action=${action}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no serviço de billing');
  return data;
}

export function useSubscription() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['subscription', profile.escritorioId],
    queryFn: () => billingAction('get-subscription'),
    enabled: !!profile.escritorioId,
  });
}

export function usePayments() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['billing-payments', profile.escritorioId],
    queryFn: () => billingAction('get-payments'),
    enabled: !!profile.escritorioId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { plano: string; billingType: string; creditCard?: any; creditCardHolderInfo?: any }) =>
      billingAction('create-subscription', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['escritorio-plano'] });
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao criar assinatura');
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingAction('cancel-subscription'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['escritorio-plano'] });
      toast.success('Assinatura cancelada');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cancelar');
    },
  });
}

export function useRegisterWebhook() {
  return useMutation({
    mutationFn: () => billingAction('register-webhook'),
    onSuccess: (data) => {
      toast.success(data.message || 'Webhook registrado!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao registrar webhook');
    },
  });
}

export function useListWebhooks() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['asaas-webhooks', profile.escritorioId],
    queryFn: () => billingAction('list-webhooks'),
    enabled: !!profile.escritorioId,
  });
}

/** Hook unificado para informações de billing com novo modelo Free/Pro */
export function useBilling() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: escritorio, isLoading: loadingEscritorio } = useQuery({
    queryKey: ['escritorio-billing', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('escritorios')
        .select('plano, declaracoes_utilizadas, limite_declaracoes')
        .eq('id', profile.escritorioId!)
        .single();
      return data;
    },
    enabled: !!profile.escritorioId,
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['active-addons', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('escritorio_addons')
        .select('*, addons(*)')
        .eq('escritorio_id', profile.escritorioId!)
        .eq('status', 'ativo');
      return data || [];
    },
    enabled: !!profile.escritorioId,
  });

  const planoNome = escritorio?.plano || 'gratuito';
  const planoConfig = getPlanoConfig(planoNome);

  const usadas = escritorio?.declaracoes_utilizadas ?? 0;
  const limite = planoConfig.limites.declaracoes;
  const declaracoesRestantes = limite ? Math.max(0, limite - usadas) : Infinity;
  const atingiuLimiteDeclaracoes = limite !== null && usadas >= limite;

  const hasAddon = (addonNome: string) => {
    return addons.some((a: any) => a.addons?.nome?.toLowerCase().includes(addonNome.toLowerCase()));
  };

  const cancelSub = useMutation({
    mutationFn: () => billingAction('cancel-subscription'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
      toast.success('Assinatura cancelada com sucesso');
    },
    onError: (err: Error) => {
      toast.error('Erro ao cancelar assinatura', { description: err.message });
    },
  });

  return {
    planoAtual: planoNome,
    planoConfig,
    addons,
    hasAddon,
    declaracoesCount: usadas,
    declaracoesRestantes,
    atingiuLimiteDeclaracoes,
    limiteDeclaracoes: limite,
    isLoading: loadingEscritorio,
    cancelSub,
  };
}
