import { useEffect } from 'react';
import { Home, ClipboardList, Upload, LogOut, Eye, ArrowLeft } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useClienteAtivo, type PortalView } from '@/contexts/PortalViewContext';

type Escritorio = Tables<'escritorios'>;

const navItems: { title: string; url: string; view: PortalView; icon: typeof Home; tooltip: string }[] = [
  { title: 'Início', url: '/cliente/dashboard', view: 'dashboard', icon: Home, tooltip: 'Visão geral do status da sua declaração' },
  { title: 'Dados Cadastrais', url: '/cliente/formulario', view: 'formulario', icon: ClipboardList, tooltip: 'Preencha suas informações pessoais e fiscais' },
  { title: 'Documentos', url: '/cliente/documentos', view: 'documentos', icon: Upload, tooltip: 'Anexe comprovantes, informes e documentos da Receita' },
];


export function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { clienteId, clienteNome, isImpersonating, view, setView } = useClienteAtivo();

  // Portal do cliente: padrão é tema claro. Se nunca houve escolha explícita
  // (theme === 'system'), forçamos 'light' — sem afetar o ambiente do contador.
  useEffect(() => {
    if (theme === 'system') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  // Fetch escritorio branding for whitelabel
  const { data: clienteData } = useQuery({
    queryKey: ['cliente-escritorio', clienteId],
    queryFn: async (): Promise<Escritorio | null> => {
      if (!clienteId) return null;
      const { data: cliente } = await supabase
        .from('clientes')
        .select('escritorio_id')
        .eq('id', clienteId)
        .single();
      if (!cliente) return null;
      const { data: esc } = await supabase
        .from('escritorios')
        .select('*')
        .eq('id', cliente.escritorio_id)
        .single();
      return esc;
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 10,
  });

  const esc = clienteData;
  const whitelabelAtivo = esc?.whitelabel_ativo === true;
  const corPrimaria = esc?.cor_primaria || '#1E3A5F';
  const logoUrl = esc?.logo_url;
  const nomePortal = esc?.nome_portal || 'DeclaraIR';

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={whitelabelAtivo ? { '--color-brand': corPrimaria } as React.CSSProperties : undefined}
    >
      {isImpersonating && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-warning/15 border-b border-warning/30 px-3 sm:px-6 py-2 text-sm text-warning-foreground">
          <span className="flex items-center gap-2 font-medium text-warning">
            <Eye className="h-4 w-4 shrink-0" />
            <span>
              Você está visualizando o portal de{' '}
              <strong className="font-bold underline decoration-warning/60 underline-offset-2">{clienteNome}</strong>{' '}
              como contador
            </span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-warning hover:bg-warning/20 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Sair da visualização
          </button>
        </div>
      )}
      <header className="h-16 flex items-center justify-between border-b bg-card px-3 sm:px-6 shrink-0 gap-2">
        <div className="flex items-center gap-3">
          {whitelabelAtivo && logoUrl ? (
            <img src={logoUrl} alt={nomePortal} className="h-10 w-auto rounded-lg object-contain" />
          ) : (
            <img src={logoFull} alt="DeclaraIR" className="h-10 w-auto object-contain dark:brightness-0 dark:invert" />
          )}
          {whitelabelAtivo && (
            <span
              className="font-display text-lg font-bold"
              style={{ color: corPrimaria }}
            >
              {nomePortal}
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Tooltip key={item.url} delayDuration={200}>
              <TooltipTrigger asChild>
                {isImpersonating ? (
                  <button
                    type="button"
                    onClick={() => setView?.(item.view)}
                    aria-label={item.title}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      view === item.view
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </button>
                ) : (
                  <NavLink
                    to={item.url}
                    end={item.url === '/cliente/dashboard'}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
                    activeClassName="bg-accent/10 text-accent font-medium"
                    aria-label={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </NavLink>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span><ThemeToggle /></span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Alternar tema claro/escuro</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => (isImpersonating ? navigate('/clientes') : signOut())}
                aria-label={isImpersonating ? 'Sair da visualização' : 'Sair da conta'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm ml-2"
              >
                {isImpersonating ? <ArrowLeft className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">{isImpersonating ? 'Sair da visualização' : 'Sair'}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{isImpersonating ? 'Voltar para a lista de clientes' : 'Sair da sua conta'}</TooltipContent>
          </Tooltip>
        </nav>

      </header>
      <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
