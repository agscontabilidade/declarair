import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UsageLevel = 'normal' | 'warning' | 'critical' | 'blocked';

interface UsageState {
  usadas: number;
  limite: number;
  percentual: number;
  level: UsageLevel;
  loading: boolean;
}

export function useUsageStatus(): UsageState {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['usage-status', profile.escritorioId],
    queryFn: async () => {
      const { data: escritorio } = await supabase
        .from('escritorios')
        .select('declaracoes_utilizadas, limite_declaracoes')
        .eq('id', profile.escritorioId!)
        .single();
      return {
        usadas: escritorio?.declaracoes_utilizadas ?? 0,
        limite: escritorio?.limite_declaracoes ?? 1,
      };
    },
    enabled: !!profile.escritorioId,
    refetchInterval: 30000,
  });

  const usadas = data?.usadas ?? 0;
  const limite = data?.limite ?? 1;
  const percentual = limite > 0 ? Math.min((usadas / limite) * 100, 100) : 0;

  let level: UsageLevel = 'normal';
  if (percentual >= 100) level = 'blocked';
  else if (percentual >= 90) level = 'critical';
  else if (percentual >= 70) level = 'warning';

  return { usadas, limite, percentual, level, loading: isLoading };
}
