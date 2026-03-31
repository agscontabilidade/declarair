import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BillingBanner } from '@/components/billing/BillingBanner';
import { UsageBanner } from '@/components/billing/UsageBanner';
import { ReportBugModal } from '@/components/bug-report/ReportBugModal';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userType } = useAuth();
  const isContador = userType === 'contador';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-card px-4 gap-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1" />
            {isContador && <NotificacoesBell />}
          </header>
          {isContador && <BillingBanner />}
          {isContador && <UsageBanner />}
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
        {isContador && <ReportBugModal />}
      </div>
    </SidebarProvider>
  );
}

function NotificacoesBell() {
  const navigate = useNavigate();
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 animate-pulse-badge">
              {naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => marcarTodasComoLidas.mutate()}>
              <Check className="h-3 w-3 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
          ) : (
            notificacoes.slice(0, 10).map((n: any) => (
              <button
                key={n.id}
                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${!n.lida ? 'bg-accent/5' : ''}`}
                onClick={() => {
                  marcarComoLida.mutate(n.id);
                  if (n.link_destino) navigate(n.link_destino);
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.lida && <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.lida ? 'font-medium' : ''}`}>{n.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{n.mensagem}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
