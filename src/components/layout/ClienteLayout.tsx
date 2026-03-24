import { Home, ClipboardList, Upload, LogOut } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { title: 'Início', url: '/cliente/dashboard', icon: Home },
  { title: 'Formulário IR', url: '/cliente/formulario', icon: ClipboardList },
  { title: 'Documentos', url: '/cliente/documentos', icon: Upload },
];

export function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  // Fetch escritorio branding for whitelabel
  const { data: clienteData } = useQuery({
    queryKey: ['cliente-escritorio', profile.clienteId],
    queryFn: async () => {
      if (!profile.clienteId) return null;
      const { data: cliente } = await supabase
        .from('clientes')
        .select('escritorio_id')
        .eq('id', profile.clienteId)
        .single();
      if (!cliente) return null;
      const { data: esc } = await supabase
        .from('escritorios')
        .select('*')
        .eq('id', cliente.escritorio_id)
        .single();
      return esc;
    },
    enabled: !!profile.clienteId,
    staleTime: 1000 * 60 * 10,
  });

  const esc = clienteData as any;
  const whitelabelAtivo = esc?.whitelabel_ativo === true;
  const corPrimaria = esc?.cor_primaria || '#1E3A5F';
  const logoUrl = esc?.logo_url;
  const nomePortal = esc?.nome_portal || 'DeclaraIR';

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={whitelabelAtivo ? { '--color-brand': corPrimaria } as React.CSSProperties : undefined}
    >
      <header className="h-16 flex items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-3">
          {whitelabelAtivo && logoUrl ? (
            <img src={logoUrl} alt={nomePortal} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <FileText className="h-6 w-6 text-accent" />
          )}
          <span
            className="font-display text-lg font-bold"
            style={whitelabelAtivo ? { color: corPrimaria } : undefined}
          >
            {nomePortal}
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === '/cliente/dashboard'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
              activeClassName="bg-accent/10 text-accent font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm ml-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
