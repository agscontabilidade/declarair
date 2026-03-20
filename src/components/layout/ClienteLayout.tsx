import { FileText, Home, ClipboardList, Upload, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { title: 'Início', url: '/cliente/dashboard', icon: Home },
  { title: 'Formulário IR', url: '/cliente/formulario', icon: ClipboardList },
  { title: 'Documentos', url: '/cliente/documentos', icon: Upload },
];

export function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 flex items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-accent" />
          <span className="font-display text-lg font-bold text-foreground">DeclaraIR</span>
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
