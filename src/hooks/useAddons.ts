import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Addon {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  tipo: string;
  icone: string;
  ativo: boolean;
}

export interface EscritorioAddon {
  id: string;
  escritorio_id: string;
  addon_id: string;
  status: string;
  ativado_em: string;
}

export function useAddons() {
  const { profile } = useAuth();

  const catalogQuery = useQuery({
    queryKey: ['addons-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .eq('ativo', true)
        .order('preco');
      if (error) throw error;
      return data as Addon[];
    },
  });

  const myAddonsQuery = useQuery({
    queryKey: ['my-addons', profile.escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escritorio_addons')
        .select('*, addons(*)')
        .eq('escritorio_id', profile.escritorioId!);
      if (error) throw error;
      return data as (EscritorioAddon & { addons: Addon })[];
    },
    enabled: !!profile.escritorioId,
  });

  return { catalog: catalogQuery.data || [], myAddons: myAddonsQuery.data || [], isLoading: catalogQuery.isLoading || myAddonsQuery.isLoading };
}

/** Check if a specific addon is active by keyword in addon name */
export function useHasAddon(keyword: string): boolean {
  const { myAddons } = useAddons();
  return myAddons.some(
    (a) => a.status === 'ativo' && a.addons?.nome?.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function useToggleAddon() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ addonId, currentStatus }: { addonId: string; currentStatus: string | null }) => {
      if (!profile.escritorioId) throw new Error('Sem escritório');

      if (!currentStatus) {
        const { error } = await supabase.from('escritorio_addons').insert({
          escritorio_id: profile.escritorioId,
          addon_id: addonId,
          status: 'ativo',
        });
        if (error) throw error;
      } else if (currentStatus === 'ativo') {
        const { error } = await supabase
          .from('escritorio_addons')
          .update({ status: 'inativo', desativado_em: new Date().toISOString() })
          .eq('escritorio_id', profile.escritorioId)
          .eq('addon_id', addonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('escritorio_addons')
          .update({ status: 'ativo', ativado_em: new Date().toISOString(), desativado_em: null })
          .eq('escritorio_id', profile.escritorioId)
          .eq('addon_id', addonId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { currentStatus }) => {
      qc.invalidateQueries({ queryKey: ['my-addons'] });
      toast.success(!currentStatus || currentStatus === 'inativo' ? 'Recurso ativado!' : 'Recurso desativado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
