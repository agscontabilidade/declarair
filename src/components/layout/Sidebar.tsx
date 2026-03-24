import { LayoutDashboard, Users, FileText, DollarSign, MessageSquare, Settings, LogOut, Newspaper, Shield, FolderOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useCobrancasAtrasadas } from '@/hooks/useCobrancasAtrasadas';
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
  { title: 'Mensagens', url: '/mensagens', icon: MessageSquare },
  { title: 'Capa', url: '/capa', icon: Newspaper },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const atrasadas = useCobrancasAtrasadas();

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const papel = profile.papel === 'dono' ? 'Dono' : 'Colaborador';

  return (
    <ShadcnSidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">
          DI
        </div>
        {!collapsed && (
          <span className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">
            DeclaraIR
          </span>
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
        <div className="flex items-center gap-3 px-1 mb-2">
          <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm text-sidebar-foreground font-medium truncate">{profile.nome ?? '—'}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{papel}</p>
            </div>
          )}
        </div>
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
