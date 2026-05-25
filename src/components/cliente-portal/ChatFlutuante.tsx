import { lazy, Suspense, useState } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SecaoChat = lazy(() =>
  import('@/components/declaracao/SecaoChat').then((m) => ({ default: m.SecaoChat }))
);

interface Props {
  declaracaoId: string;
  escritorioId: string;
  clienteId: string;
  unreadCount?: number;
}

export function ChatFlutuante({ declaracaoId, escritorioId, clienteId, unreadCount = 0 }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(!open)}
              size="icon"
              aria-label={open ? 'Fechar chat' : 'Abrir chat com o contador'}
              className="h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90"
            >
              {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {open
              ? 'Fechar chat'
              : unreadCount > 0
              ? `Fale com seu contador (${unreadCount} não lida${unreadCount > 1 ? 's' : ''})`
              : 'Fale com seu contador'}
          </TooltipContent>
        </Tooltip>
        {unreadCount > 0 && !open && (
          <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-5 w-5 flex items-center justify-center p-0 text-[10px] pointer-events-none">
            {unreadCount}
          </Badge>
        )}
      </div>

      {/* Chat panel — só monta (e baixa o chunk) ao abrir */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 duration-200">
          <Suspense
            fallback={
              <div className="bg-card border rounded-lg shadow-lg p-6 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <SecaoChat
              declaracaoId={declaracaoId}
              escritorioId={escritorioId}
              clienteId={clienteId}
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
