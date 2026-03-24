import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecaoChat } from '@/components/declaracao/SecaoChat';

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
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90"
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
        {unreadCount > 0 && !open && (
          <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-5 w-5 flex items-center justify-center p-0 text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 duration-200">
          <SecaoChat
            declaracaoId={declaracaoId}
            escritorioId={escritorioId}
            clienteId={clienteId}
          />
        </div>
      )}
    </>
  );
}
