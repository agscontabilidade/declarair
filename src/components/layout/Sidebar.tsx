import { LayoutDashboard, Users, FileText, DollarSign, MessageSquare, Settings, LogOut, Newspaper, Shield, FolderOpen, User, TrendingUp, Puzzle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useCobrancasAtrasadas } from '@/hooks/useCobrancasAtrasadas';
import { useUsageStatus } from '@/hooks/useUsageStatus';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Declarações', url: '/declaracoes', icon: FileText },
  { title: 'Cobranças', url: '/cobrancas', icon: DollarSign, badge: true },
  { title: 'Malha Fina', url: '/malha-fina', icon: Shield },
  { title: 'Drive', url: '/drive', icon: FolderOpen },
  { title: 'Mensagens', url: '/mensagens', icon: MessageSquare },
  { title: 'Capa', url: '/capa', icon: Newspaper },
  { title: 'WhatsApp', url: '/whatsapp', icon: Phone },
  { title: 'Add-ons', url: '/addons', icon: Puzzle },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';
  const atrasadas = useCobrancasAtrasadas();
  const { percentual, level, usadas, limite } = useUsageStatus();

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const papel = profile.papel === 'dono' ? 'Dono' : 'Colaborador';

  return (
    <ShadcnSidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <img src={logoIcon} alt="DeclaraIR" className="h-10 w-10 shrink-0" />
        {!collapsed && (
          <img src={logoFull} alt="DeclaraIR" className="h-7" />
        )}
      </div>

      <SidebarContent className="mt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1 transform transition-all duration-150"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && item.badge && atrasadas > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {atrasadas}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {level !== 'normal' && (
          <button
            onClick={() => navigate('/meus-planos')}
            className={`flex items-center gap-2 w-full px-3 py-2 mb-2 rounded-lg text-xs font-medium transition-colors ${
              level === 'blocked'
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : level === 'critical'
                ? 'bg-warning/10 text-warning hover:bg-warning/20'
                : 'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="truncate">{usadas}/{limite} declarações</span>
            )}
          </button>
        )}
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-3 px-1 mb-2 w-full rounded-lg hover:bg-sidebar-accent/50 transition-colors py-1"
        >
          <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="text-sm text-sidebar-foreground font-medium truncate">{profile.nome ?? '—'}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{papel}</p>
            </div>
          )}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
