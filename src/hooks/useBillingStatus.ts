import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type BillingStatus = 'active' | 'overdue' | 'cancelled' | 'free';

interface BillingState {
  status: BillingStatus;
  plano: string;
  isBlocked: boolean;
  isOverdue: boolean;
  loading: boolean;
}

export function useBillingStatus(): BillingState {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['billing-status', profile.escritorioId],
    queryFn: async () => {
      // Get subscription status
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('status, plano')
        .eq('escritorio_id', profile.escritorioId!)
        .maybeSingle();

      const { data: escritorio } = await supabase
        .from('escritorios')
        .select('plano')
        .eq('id', profile.escritorioId!)
        .single();

      return {
        subscriptionStatus: assinatura?.status || null,
        plano: escritorio?.plano || 'gratuito',
      };
    },
    enabled: !!profile.escritorioId,
    refetchInterval: 60000, // Check every minute
  });

  const plano = data?.plano || 'gratuito';
  const subStatus = data?.subscriptionStatus;

  const isOverdue = subStatus === 'overdue';
  // Block access only if overdue on a paid plan
  const isBlocked = isOverdue && plano !== 'gratuito';

  let status: BillingStatus = 'free';
  if (plano !== 'gratuito') {
    if (subStatus === 'active') status = 'active';
    else if (subStatus === 'overdue') status = 'overdue';
    else if (subStatus === 'cancelled') status = 'cancelled';
  }

  return {
    status,
    plano,
    isBlocked,
    isOverdue,
    loading: isLoading,
  };
}
