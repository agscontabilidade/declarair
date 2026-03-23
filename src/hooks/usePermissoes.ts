import { useAuth } from '@/contexts/AuthContext';

export function usePermissoes() {
  const { profile } = useAuth();
  const isDono = profile.papel === 'dono';

  return {
    isDono,
    podeExcluirCliente: isDono,
    podeGerenciarUsuarios: isDono,
    podeAlterarEscritorio: isDono,
    podeExcluirCobranca: isDono,
    podeCancelarCobranca: true,
    podeGerenciarTemplates: true,
    podeVerConfiguracoes: true,
  };
}
