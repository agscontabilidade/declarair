import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UsageLevel = 'normal' | 'warning' | 'critical' | 'blocked';

interface UsageState {
  usadas: number;
  limite: number;
  extras: number;
  percentual: number;
  level: UsageLevel;
  plano: 'free' | 'pro';
  loading: boolean;
}

export function useUsageStatus(): UsageState {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['usage-status', profile.escritorioId],
    queryFn: async () => {
      const { data: escritorio } = await supabase
        .from('escritorios')
        .select('plano, declaracoes_utilizadas, limite_declaracoes')
        .eq('id', profile.escritorioId!)
        .single();

      const planoNome = escritorio?.plano || 'gratuito';
      const normalized = planoNome.toLowerCase();
      const isPro = normalized === 'pro' || normalized === 'profissional';

      const usadas = escritorio?.declaracoes_utilizadas ?? 0;
      const limite = escritorio?.limite_declaracoes ?? (isPro ? 3 : 1);

      // Para Pro, extras = limite - usadas (limite cresce ao comprar)
      const extras = isPro ? Math.max(0, limite - usadas) : 0;

      return {
        usadas,
        limite,
        extras,
        plano: isPro ? 'pro' as const : 'free' as const,
      };
    },
    enabled: !!profile.escritorioId,
    refetchInterval: 30000,
  });

  const usadas = data?.usadas ?? 0;
  const limite = data?.limite ?? 1;
  const extras = data?.extras ?? 0;
  const plano = data?.plano ?? 'free';

  const percentual = limite > 0 ? Math.min((usadas / limite) * 100, 100) : 0;

  let level: UsageLevel = 'normal';
  if (plano === 'free') {
    if (usadas >= limite) level = 'blocked';
    else if (percentual >= 90) level = 'critical';
    else if (percentual >= 70) level = 'warning';
  } else {
    // Pro: blocked when no extras left
    if (extras <= 0 && usadas > 0) level = 'blocked';
    else if (extras <= 1) level = 'warning';
  }

  return { usadas, limite, extras, percentual, level, plano, loading: isLoading };
}
