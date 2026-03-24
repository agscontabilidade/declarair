import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Wand2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const QUICK_REPLIES = [
  'Seus documentos foram recebidos, obrigado!',
  'Preciso do informe de rendimentos do banco.',
  'Sua declaração está pronta para revisão.',
  'Falta o comprovante de despesas médicas.',
];

interface Props {
  declaracaoId: string;
  escritorioId: string;
  clienteId: string;
}

export function SecaoChat({ declaracaoId, escritorioId, clienteId }: Props) {
  const { profile } = useAuth();
  const senderId = profile.userId;
  const senderType = profile.userType === 'cliente' ? 'cliente' as const : 'contador' as const;
  const { messages, isLoading, sendMessage, markRead, unreadCount } = useChat(
    declaracaoId, escritorioId, clienteId, senderType, senderId
  );
  const [text, setText] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    markRead();
  }, [messages, markRead]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent" />
            Mensagens
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-3">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.remetente_tipo === senderType;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick replies */}
        {showQuick && senderType === 'contador' && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => { setText(reply); setShowQuick(false); }}
                className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          {senderType === 'contador' && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setShowQuick(!showQuick)}
              title="Respostas rápidas"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          )}
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
