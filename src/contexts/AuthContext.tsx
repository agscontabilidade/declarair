import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'contador' | 'cliente' | null;

interface UserProfile {
  escritorioId: string | null;
  papel: string | null;
  nome: string | null;
  clienteId: string | null;
  onboardingCompleto: boolean | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType;
  profile: UserProfile;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userType: null,
  profile: { escritorioId: null, papel: null, nome: null, clienteId: null, onboardingCompleto: null },
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [profile, setProfile] = useState<UserProfile>({
    escritorioId: null,
    papel: null,
    nome: null,
    clienteId: null,
    onboardingCompleto: null,
  });
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser: User) {
    try {
      // Check if is contador
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('escritorio_id, papel, nome')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (usuario) {
        let onboardingCompleto: boolean | null = null;
        if (usuario.escritorio_id) {
          const { data: esc } = await supabase
            .from('escritorios')
            .select('onboarding_completo')
            .eq('id', usuario.escritorio_id)
            .maybeSingle();
          onboardingCompleto = esc?.onboarding_completo ?? false;
        }

        setUserType('contador');
        setProfile({
          escritorioId: usuario.escritorio_id,
          papel: usuario.papel,
          nome: usuario.nome,
          clienteId: null,
          onboardingCompleto,
        });
        return;
      }

      // Check if is cliente
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('auth_user_id', currentUser.id)
        .maybeSingle();

      if (cliente) {
        setUserType('cliente');
        setProfile({
          escritorioId: null,
          papel: null,
          nome: cliente.nome,
          clienteId: cliente.id,
          onboardingCompleto: null,
        });
        return;
      }

      setUserType(null);
      setProfile({ escritorioId: null, papel: null, nome: null, clienteId: null, onboardingCompleto: null });
    } catch (error) {
      console.error('[AuthContext] Load profile error:', error);
      setUserType(null);
      setProfile({ escritorioId: null, papel: null, nome: null, clienteId: null, onboardingCompleto: null });
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthContext] Auth event:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setLoading(true);
          try {
            await loadProfile(newSession.user);
          } catch (error) {
            console.error('[AuthContext] Error loading profile:', error);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUserType(null);
          setProfile({ escritorioId: null, papel: null, nome: null, clienteId: null, onboardingCompleto: null });
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Silently refresh profile without loading state
          await loadProfile(newSession.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, userType, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
