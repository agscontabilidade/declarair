import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface Props {
  mensagens: any[];
  isLoading: boolean;
}

export function AbaComunicacoes({ mensagens, isLoading }: Props) {
  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  if (mensagens.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma mensagem enviada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {mensagens.map(m => {
        const date = new Date(m.enviado_em);
        const formatted = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        return (
          <Card key={m.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={m.canal === 'whatsapp' ? 'default' : 'outline'} className="text-xs">
                      {m.canal === 'whatsapp' ? 'WhatsApp' : 'Email'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatted}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">{m.conteudo_final?.slice(0, 100)}{(m.conteudo_final?.length || 0) > 100 ? '...' : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
