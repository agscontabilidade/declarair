import { LayoutDashboard, Users, FileText, DollarSign, MessageSquare, Settings, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
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
  { title: 'Cobranças', url: '/cobrancas', icon: DollarSign },
  { title: 'Mensagens', url: '/mensagens', icon: MessageSquare },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <ShadcnSidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
        <FileText className="h-7 w-7 text-accent shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg font-bold text-white tracking-tight">
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-white/10 hover:text-white transition-colors"
                      activeClassName="bg-accent/20 text-white font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-3">
        {!collapsed && profile.nome && (
          <p className="text-xs text-sidebar-foreground/50 mb-2 truncate px-1">
            {profile.nome}
          </p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
