import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Crown, MessageCircle } from 'lucide-react';
import { PLANOS, PRECOS } from '@/lib/constants/planos';

const WHATSAPP_URL = 'https://wa.me/5511998755782?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20DeclaraIR';

const CARDS = [
  {
    ...PLANOS.FREE,
    icon: Zap,
    badge: null,
    destaque: false,
    precoLabel: 'R$ 0',
    periodo: '/mês',
    beneficios: [
      { texto: '1 declaração para teste', disponivel: true },
      { texto: '1 usuário', disponivel: true },
      { texto: '500 MB de armazenamento', disponivel: true },
      { texto: 'Gestão básica de declarações', disponivel: true },
      { texto: 'Portal do cliente básico', disponivel: true },
      { texto: 'Suporte por chat', disponivel: true },
      { texto: 'Kanban e chat avançado', disponivel: false },
      { texto: 'Verificador de malha fina', disponivel: false },
      { texto: 'Calculadora IR integrada', disponivel: false },
      { texto: 'Múltiplos usuários', disponivel: false },
    ],
    cta: 'Começar Grátis',
  },
  {
    ...PLANOS.PRO,
    icon: Crown,
    badge: 'Mais escolhido',
    destaque: true,
    precoLabel: 'R$ 29,90',
    periodo: '/mês',
    beneficios: [
      { texto: `Declarações extras por R$ ${PRECOS.DECLARACAO_EXTRA.preco.toFixed(2).replace('.', ',')}/cada`, disponivel: true },
      { texto: 'Até 5 usuários simultâneos', disponivel: true },
      { texto: 'Armazenamento ilimitado', disponivel: true },
      { texto: 'Verificador de malha fina', disponivel: true },
      { texto: 'Calculadora IR integrada', disponivel: true },
      { texto: 'Chat com clientes', disponivel: true },
      { texto: 'Kanban de declarações', disponivel: true },
      { texto: 'Cobranças automáticas via Stripe', disponivel: true },
      { texto: 'Suporte prioritário', disponivel: true },
      { texto: 'Addons disponíveis (WhatsApp, Portal, API, Whitelabel)', disponivel: true },
    ],
    cta: 'Começar Agora',
  },
];

export function PlanosCardsPublic() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {CARDS.map((plano) => {
        const Icon = plano.icon;
        return (
          <Card
            key={plano.id}
            className={`relative flex flex-col transition-all duration-300 backdrop-blur-sm ${
              plano.destaque
                ? 'ring-2 ring-accent shadow-2xl shadow-accent/10 scale-[1.02] bg-gradient-to-b from-card to-accent/[0.03]'
                : 'shadow-md hover:shadow-xl hover:-translate-y-1 glass-card'
            }`}
          >
            {plano.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="text-xs whitespace-nowrap bg-accent text-accent-foreground">
                  {plano.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2 pt-8">
              <div className={`h-12 w-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                plano.destaque ? 'bg-accent/15' : 'bg-muted'
              }`}>
                <Icon className={`h-6 w-6 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-lg">{plano.nome}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">{plano.precoLabel}</span>
                <span className="text-muted-foreground text-sm">{plano.periodo}</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-2.5 flex-1">
                {plano.beneficios.map((b) => (
                  <div key={b.texto} className="flex items-start gap-2.5 text-sm">
                    {b.disponivel ? (
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                    <span className={b.disponivel ? 'text-foreground' : 'text-muted-foreground/50'}>
                      {b.texto}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <Link to="/cadastro" className="block">
                  <Button
                    className={`w-full ${plano.destaque ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
                  >
                    {plano.cta}
                  </Button>
                </Link>
                {plano.destaque && (
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      Falar com consultor
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
