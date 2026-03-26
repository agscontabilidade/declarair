import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Convite {
  id: string;
  escritorio_id: string;
  email: string;
  nome: string;
  papel: string;
  token: string;
  enviado_por: string;
  usado: boolean;
  expira_em: string;
  usado_em: string | null;
  created_at: string;
}

export const useColaboradores = (escritorioId: string) => {
  const queryClient = useQueryClient();

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ['colaboradores', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!escritorioId,
  });

  const { data: convitesPendentes = [] } = useQuery({
    queryKey: ['convites-pendentes', escritorioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('colaborador_convites')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .eq('usado', false)
        .gte('expira_em', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Convite[];
    },
    enabled: !!escritorioId,
  });

  const enviarConvite = useMutation({
    mutationFn: async (dados: { email: string; nome: string; papel?: string }) => {
      const token = crypto.randomUUID();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: convite, error: conviteError } = await (supabase as any)
        .from('colaborador_convites')
        .insert({
          escritorio_id: escritorioId,
          email: dados.email,
          nome: dados.nome,
          papel: dados.papel || 'colaborador',
          token,
          expira_em: expiraEm.toISOString(),
          enviado_por: userId,
        })
        .select()
        .single();

      if (conviteError) throw conviteError;

      const linkConvite = `${window.location.origin}/convite-colaborador/${token}`;

      return { convite, linkConvite };
    },
    onSuccess: ({ linkConvite }) => {
      toast.success('Convite criado! Compartilhe o link com o colaborador.', {
        description: 'Link copiado para a área de transferência.',
        duration: 5000,
      });
      navigator.clipboard.writeText(linkConvite).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['convites-pendentes', escritorioId] });
    },
    onError: (error: any) => {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao criar convite');
    },
  });

  const cancelarConvite = useMutation({
    mutationFn: async (conviteId: string) => {
      const { error } = await (supabase as any)
        .from('colaborador_convites')
        .delete()
        .eq('id', conviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite cancelado');
      queryClient.invalidateQueries({ queryKey: ['convites-pendentes', escritorioId] });
    },
  });

  const removerColaborador = useMutation({
    mutationFn: async (usuarioId: string) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', usuarioId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Colaborador desativado');
      queryClient.invalidateQueries({ queryKey: ['colaboradores', escritorioId] });
    },
  });

  return {
    colaboradores,
    convitesPendentes,
    isLoading,
    enviarConvite,
    cancelarConvite,
    removerColaborador,
  };
};
