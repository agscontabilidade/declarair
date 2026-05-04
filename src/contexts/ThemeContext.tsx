/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePref;
  resolved: 'light' | 'dark';
  setTheme: (t: ThemePref) => void;
}

const STORAGE_KEY = 'declarair-theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => {},
});

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(pref: ThemePref): 'light' | 'dark' {
  const resolved = pref === 'system' ? getSystemTheme() : pref;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, userType } = useAuth();
  const [theme, setThemeState] = useState<ThemePref>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
    return stored ?? 'system';
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => applyTheme(theme));

  // Apply on change + react to system changes when in 'system' mode
  useEffect(() => {
    setResolved(applyTheme(theme));
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Load preference from DB once user is known
  useEffect(() => {
    if (!user || !userType) return;
    (async () => {
      try {
        if (userType === 'contador') {
          const { data } = await supabase
            .from('usuarios')
            .select('tema_preferido')
            .eq('id', user.id)
            .maybeSingle();
          const remote = data?.tema_preferido as ThemePref | undefined;
          if (remote && remote !== theme) {
            setThemeState(remote);
            localStorage.setItem(STORAGE_KEY, remote);
          }
        } else if (userType === 'cliente') {
          const { data } = await supabase
            .from('clientes')
            .select('tema_preferido')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          const remote = data?.tema_preferido as ThemePref | undefined;
          if (remote && remote !== theme) {
            setThemeState(remote);
            localStorage.setItem(STORAGE_KEY, remote);
          }
        }
      } catch {
        // ignore — fallback to localStorage
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userType]);

  const setTheme = useCallback(
    (t: ThemePref) => {
      setThemeState(t);
      localStorage.setItem(STORAGE_KEY, t);
      if (user && userType === 'contador') {
        supabase.from('usuarios').update({ tema_preferido: t }).eq('id', user.id).then(() => {});
      } else if (user && userType === 'cliente') {
        supabase.from('clientes').update({ tema_preferido: t }).eq('auth_user_id', user.id).then(() => {});
      }
    },
    [user, userType]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
