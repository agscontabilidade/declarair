import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
