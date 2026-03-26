import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap, Building2, Rocket, MessageCircle } from 'lucide-react';

interface PlanosCardsProps {
  planoAtual: string;
  subData: any;
  cancelSub: any;
  onNavigate: (planoId: string) => void;
}

const PLANOS = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    subtitulo: 'Para conhecer a plataforma sem compromisso',
    preco: 'R$ 0',
    periodo: '/mês',
    icon: Zap,
    badge: null,
    destaque: false,
    beneficios: [
      { texto: '5 declarações inclusas', disponivel: true },
      { texto: '1 usuário', disponivel: true },
      { texto: '500 MB de armazenamento', disponivel: true },
      { texto: 'Suporte por email', disponivel: true },
      { texto: 'Evite malha fina automaticamente', disponivel: false },
      { texto: 'Calculadora IR integrada', disponivel: false },
      { texto: 'Chat com clientes', disponivel: false },
      { texto: 'Sua marca no portal', disponivel: false },
    ],
  },
  {
    id: 'starter',
    nome: 'Starter',
    subtitulo: 'Para contadores autônomos que querem profissionalizar o IR',
    preco: 'R$ 29,90',
    periodo: '/mês',
    icon: Rocket,
    badge: 'Mais econômico',
    destaque: false,
    beneficios: [
      { texto: '10 declarações inclusas', disponivel: true },
      { texto: '1 usuário', disponivel: true },
      { texto: '10 GB de armazenamento', disponivel: true },
      { texto: 'Evite malha fina automaticamente', disponivel: true },
      { texto: 'Reduza erros com Calculadora IR', disponivel: true },
      { texto: 'Chat integrado com clientes', disponivel: true },
      { texto: 'Suporte por email', disponivel: true },
      { texto: 'Sua marca no portal', disponivel: false },
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    subtitulo: 'Para escritórios que querem escalar sem aumentar equipe',
    preco: 'R$ 49,90',
    periodo: '/mês',
    icon: Crown,
    badge: 'Mais escolhido',
    destaque: true,
    beneficios: [
      { texto: '20 declarações inclusas', disponivel: true },
      { texto: '5 usuários simultâneos', disponivel: true },
      { texto: '30 GB de armazenamento', disponivel: true },
      { texto: 'Evite malha fina automaticamente', disponivel: true },
      { texto: 'Reduza erros com Calculadora IR', disponivel: true },
      { texto: 'Chat integrado com clientes', disponivel: true },
      { texto: 'Atenda mais clientes sem contratar', disponivel: true },
      { texto: 'Sua marca no portal (Whitelabel)', disponivel: true },
    ],
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    subtitulo: 'Para grandes escritórios que precisam de escala profissional',
    preco: 'Sob consulta',
    periodo: '',
    icon: Building2,
    badge: 'Escala profissional',
    destaque: false,
    beneficios: [
      { texto: 'Declarações ilimitadas', disponivel: true },
      { texto: 'Usuários ilimitados', disponivel: true },
      { texto: 'Armazenamento personalizado', disponivel: true },
      { texto: 'Todas as funcionalidades inclusas', disponivel: true },
      { texto: 'Suporte dedicado e prioritário', disponivel: true },
      { texto: 'Onboarding personalizado', disponivel: true },
      { texto: 'SLA garantido', disponivel: true },
      { texto: 'API dedicada', disponivel: true },
    ],
  },
];

const WHATSAPP_URL = 'https://wa.me/5500000000000?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20DeclaraIR';

export function PlanosCards({ planoAtual, subData, cancelSub, onNavigate }: PlanosCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {PLANOS.map((plano) => {
        const Icon = plano.icon;
        const isCurrent = planoAtual === plano.id;

        return (
          <Card
            key={plano.id}
            className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${
              plano.destaque
                ? 'ring-2 ring-accent shadow-xl scale-[1.02]'
                : 'shadow-sm hover:-translate-y-1'
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

            <CardHeader className="text-center pb-2 pt-8">
              <div className={`h-12 w-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                plano.destaque ? 'bg-accent/15' : 'bg-muted'
              }`}>
                <Icon className={`h-6 w-6 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-lg">{plano.nome}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plano.subtitulo}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">{plano.preco}</span>
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
                {isCurrent ? (
                  <>
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                    {planoAtual !== 'gratuito' && subData?.assinatura && (
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
                ) : plano.id === 'enterprise' ? (
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" asChild>
                      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Falar com Consultor
                      </a>
                    </Button>
                  </div>
                ) : plano.id === 'gratuito' ? (
                  <Button className="w-full" variant="ghost" disabled>
                    Incluído
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className={`w-full ${plano.destaque ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
                      onClick={() => onNavigate(plano.id)}
                    >
                      {planoAtual === 'gratuito' ? 'Começar agora' : 'Fazer upgrade'}
                    </Button>
                    {(plano.id === 'profissional') && (
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                          Falar com consultor
                        </a>
                      </Button>
                    )}
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
