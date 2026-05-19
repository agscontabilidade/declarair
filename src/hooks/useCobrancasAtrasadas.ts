import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedInvalidate } from '@/hooks/useDebouncedInvalidate';

export function useCobrancasAtrasadas() {
  const { profile } = useAuth();
  const debouncedInvalidate = useDebouncedInvalidate(300);
  const escritorioId = profile.escritorioId;

  const { data: count = 0 } = useQuery({
    queryKey: ['cobrancas-atrasadas', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return 0;
      const { count } = await supabase
        .from('cobrancas')
        .select('id', { count: 'exact', head: true })
        .eq('escritorio_id', escritorioId)
        .eq('status', 'atrasado');
      return count ?? 0;
    },
    enabled: !!escritorioId,
  });

  useEffect(() => {
    if (!escritorioId) return;
    const channel = supabase
      .channel('cobrancas-atrasadas-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobrancas' }, () => {
        debouncedInvalidate(['cobrancas-atrasadas', escritorioId]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, debouncedInvalidate]);

  return count;
}
