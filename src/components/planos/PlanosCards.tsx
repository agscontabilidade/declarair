import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap, MessageCircle, Sparkles } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';

interface PlanosCardsProps {
  onNavigate: (planoId: string) => void;
}

const PLANOS_CONFIG = [
  {
    id: 'free',
    nome: 'Free',
    subtitulo: 'Para conhecer a plataforma',
    preco: 'R$ 0',
    periodo: '/mês',
    icon: Zap,
    badge: 'Teste grátis',
    destaque: false,
    cta: 'Seu plano atual',
    beneficios: [
      { texto: '1 declaração ativa', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: '1 usuário', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: '500 MB de armazenamento', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Chat com clientes', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Kanban de declarações', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Suporte por chat', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Verificador de malha fina', disponivel: false, destaque: false, addon: false, preco: 0 },
      { texto: 'Calculadora IR', disponivel: false, destaque: false, addon: false, preco: 0 },
      { texto: 'Notificações por email', disponivel: false, destaque: false, addon: false, preco: 0 },
      { texto: 'WhatsApp integrado', disponivel: false, destaque: false, addon: true, preco: 19.90 },
      { texto: 'Portal do Cliente', disponivel: false, destaque: false, addon: true, preco: 14.90 },
      { texto: 'API Pública', disponivel: false, destaque: false, addon: true, preco: 29.90 },
      { texto: 'Sua marca (Whitelabel)', disponivel: false, destaque: false, addon: true, preco: 9.90 },
    ],
    detalhes: [
      'Ideal para testar',
      'Comece em 2 minutos',
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    subtitulo: 'Sistema completo para seu escritório',
    preco: 'R$ 29,90',
    periodo: '/mês',
    icon: Crown,
    badge: 'Mais escolhido',
    destaque: true,
    cta: 'Fazer upgrade',
    beneficios: [
      { texto: '3 declarações inclusas', disponivel: true, destaque: true, addon: false, preco: 0 },
      { texto: 'Extras por R$ 9,90/declaração', disponivel: true, destaque: true, addon: false, preco: 0 },
      { texto: 'Até 5 usuários simultâneos', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Armazenamento ilimitado', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Verificador de malha fina', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Calculadora IR integrada', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Chat com clientes', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Kanban de declarações', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Notificações por email', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'Suporte prioritário', disponivel: true, destaque: false, addon: false, preco: 0 },
      { texto: 'WhatsApp integrado', disponivel: false, destaque: false, addon: true, preco: 19.90 },
      { texto: 'Portal do Cliente', disponivel: false, destaque: false, addon: true, preco: 14.90 },
      { texto: 'API Pública', disponivel: false, destaque: false, addon: true, preco: 29.90 },
      { texto: 'Sua marca (Whitelabel)', disponivel: false, destaque: false, addon: true, preco: 9.90 },
    ],
    detalhes: [
      'Usuários extras: R$ 9,90/usuário (6º+)',
      'Sem taxas ocultas',
      'Cancele quando quiser',
    ],
  },
];

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=5511998755782&text=Ol%C3%A1%2C+quero+saber+mais+sobre+o+DeclaraIR&type=phone_number&app_absent=0';

export function PlanosCards({ onNavigate }: PlanosCardsProps) {
  const { planoAtual, cancelSub } = useBilling();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {PLANOS_CONFIG.map((plano) => {
        const Icon = plano.icon;
        const isCurrent =
          planoAtual?.toLowerCase() === plano.id ||
          (plano.id === 'free' && ['gratuito', 'free'].includes(planoAtual?.toLowerCase() ?? ''));

        return (
          <Card
            key={plano.id}
            className={`relative flex flex-col transition-all duration-200 ${
              plano.destaque
                ? 'ring-2 ring-accent shadow-2xl scale-[1.02]'
                : 'shadow-lg hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {plano.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge
                  className={`text-xs whitespace-nowrap ${
                    plano.destaque
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {plano.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4 pt-8">
              <div
                className={`h-14 w-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  plano.destaque ? 'bg-accent/15' : 'bg-muted'
                }`}
              >
                <Icon className={`h-7 w-7 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-2xl">{plano.nome}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed min-h-[40px]">
                {plano.subtitulo}
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-foreground">{plano.preco}</span>
                <span className="text-muted-foreground text-sm">{plano.periodo}</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                {plano.beneficios.map((b) => (
                  <div key={b.texto} className="flex items-start gap-3 text-sm">
                    {b.disponivel ? (
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className={b.disponivel ? 'text-foreground' : 'text-muted-foreground/50'}>
                        {b.texto}
                        {b.destaque && (
                          <Sparkles className="inline-block h-4 w-4 text-accent ml-1" />
                        )}
                      </span>
                      {b.addon && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (+R$ {b.preco.toFixed(2)}/mês)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-1">
                {plano.detalhes.map((detalhe) => (
                  <p key={detalhe} className="text-xs text-muted-foreground">
                    • {detalhe}
                  </p>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                {isCurrent ? (
                  <>
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                    {plano.id === 'pro' && (
                      <Button
                        className="w-full"
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelSub.mutate()}
                        disabled={cancelSub.isPending}
                      >
                        Cancelar assinatura
                      </Button>
                    )}
                  </>
                ) : plano.id === 'free' ? (
                  <Button className="w-full" variant="ghost" disabled>
                    Incluído
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => onNavigate(plano.id)}
                    >
                      {plano.cta}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      asChild
                    >
                      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        Falar com consultor
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
