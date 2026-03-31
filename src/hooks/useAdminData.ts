import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminEscritorios() {
  return useQuery({
    queryKey: ['admin', 'escritorios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUsuarios() {
  return useQuery({
    queryKey: ['admin', 'usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, escritorios(nome)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminAssinaturas() {
  return useQuery({
    queryKey: ['admin', 'assinaturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinaturas')
        .select('*, escritorios(nome)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const [escritorios, usuarios, clientes, declaracoes, assinaturas, cobrancas] = await Promise.all([
        supabase.from('escritorios').select('id, plano, created_at', { count: 'exact', head: false }),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('declaracoes').select('id, status', { count: 'exact', head: false }),
        supabase.from('assinaturas').select('id, status, plano, valor'),
        supabase.from('cobrancas').select('id, status, valor'),
      ]);

      const totalEscritorios = escritorios.data?.length ?? 0;
      const totalUsuarios = usuarios.count ?? 0;
      const totalClientes = clientes.count ?? 0;
      const totalDeclaracoes = declaracoes.data?.length ?? 0;

      const planos = (escritorios.data ?? []).reduce((acc, e) => {
        const p = e.plano ?? 'gratuito';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const assinaturasAtivas = (assinaturas.data ?? []).filter(a => a.status === 'active').length;
      const mrrTotal = (assinaturas.data ?? [])
        .filter(a => a.status === 'active')
        .reduce((sum, a) => sum + Number(a.valor || 0), 0);

      return {
        totalEscritorios,
        totalUsuarios,
        totalClientes,
        totalDeclaracoes,
        planos,
        assinaturasAtivas,
        mrrTotal,
      };
    },
  });
}
