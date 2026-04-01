import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function stripeAction(action: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const url = `https://${PROJECT_ID}.supabase.co/functions/v1/stripe-checkout?action=${action}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no serviço de pagamentos');
  return data;
}

export function useStripeCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { plano: string; paymentMethod: string }) =>
      stripeAction('create-subscription', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao criar assinatura');
    },
  });
}

export function useStripeCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => stripeAction('cancel-subscription'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
      toast.success('Assinatura cancelada com sucesso');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cancelar');
    },
  });
}

export function useStripeSubscription() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['subscription', profile.escritorioId],
    queryFn: () => stripeAction('get-subscription'),
    enabled: !!profile.escritorioId,
  });
}

export function useStripePayments() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['billing-payments', profile.escritorioId],
    queryFn: () => stripeAction('get-payments'),
    enabled: !!profile.escritorioId,
  });
}

export function useStripeActivateAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { addonSlug: string }) =>
      stripeAction('activate-addon', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-addons'] });
      queryClient.invalidateQueries({ queryKey: ['my-addons'] });
      // Don't toast here — component handles success/payment flow
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao ativar recurso');
    },
  });
}

export function useStripeDeactivateAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { addonSlug: string }) =>
      stripeAction('deactivate-addon', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-addons'] });
      toast.success('Recurso desativado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao desativar recurso');
    },
  });
}

export function useStripePortalSession() {
  return useMutation({
    mutationFn: () => stripeAction('create-portal-session'),
    onSuccess: (data) => {
      if (data.url) window.open(data.url, '_blank');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao abrir portal');
    },
  });
}

export function useStripeBuyExtraDeclaracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quantidade: number) =>
      stripeAction('buy-extra-declaracoes', { quantidade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao comprar declarações extras');
    },
  });
}
