import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function usePermissoes() {
  const { user, profile } = useAuth();
  const isDono = profile.papel === 'dono';

  const { data: permissoes = [] } = useQuery({
    queryKey: ['usuario-permissoes', user?.id],
    queryFn: async () => {
      if (isDono) return ['*'];

      const { data, error } = await supabase
        .from('usuario_permissoes')
        .select('permissao_id, permissoes(nome)')
        .eq('user_id', user!.id);

      if (error) throw error;
      return (data ?? []).map((p: any) => p.permissoes?.nome).filter(Boolean) as string[];
    },
    enabled: !!user?.id,
  });

  const temPermissao = (permissao: string) => {
    if (isDono) return true;
    return permissoes.includes('*') || permissoes.includes(permissao);
  };

  return {
    isDono,
    temPermissao,
    permissoes,
    // Clientes
    podeVerClientes: temPermissao('clientes.view'),
    podeCriarClientes: temPermissao('clientes.create'),
    podeEditarClientes: temPermissao('clientes.edit'),
    podeExcluirCliente: temPermissao('clientes.delete'),
    // Declarações
    podeVerDeclaracoes: temPermissao('declaracoes.view'),
    podeCriarDeclaracoes: temPermissao('declaracoes.create'),
    podeEditarDeclaracoes: temPermissao('declaracoes.edit'),
    podeDeletarDeclaracoes: temPermissao('declaracoes.delete'),
    // Cobranças
    podeVerCobrancas: temPermissao('cobrancas.view'),
    podeCriarCobrancas: temPermissao('cobrancas.create'),
    podeEditarCobrancas: temPermissao('cobrancas.edit'),
    podeExcluirCobranca: temPermissao('cobrancas.delete'),
    podeCancelarCobranca: temPermissao('cobrancas.edit'),
    // Configurações
    podeVerConfiguracoes: temPermissao('configuracoes.view'),
    podeAlterarEscritorio: temPermissao('configuracoes.edit'),
    // Outros (mantidos para compatibilidade)
    podeGerenciarUsuarios: isDono,
    podeGerenciarTemplates: temPermissao('configuracoes.edit'),
  };
}
