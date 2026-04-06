import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Crown, MessageCircle } from 'lucide-react';
import { PLANOS, PRECOS } from '@/lib/constants/planos';

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=5511998755782&text=Ol%C3%A1%2C+quero+saber+mais+sobre+o+DeclaraIR&type=phone_number&app_absent=0';

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
    precoLabel: 'R$ 49,90',
    periodo: '/mês',
    beneficios: [
      { texto: '3 declarações inclusas no plano', disponivel: true },
      { texto: `R$ ${PRECOS.DECLARACAO_EXTRA.preco.toFixed(2).replace('.', ',')}/declaração avulsa`, disponivel: true },
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
          <div
            key={plano.id}
            className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
              plano.destaque
                ? 'border-2 border-[hsl(var(--lv2-emerald)/0.4)] bg-white shadow-2xl shadow-[hsl(var(--lv2-emerald)/0.08)] scale-[1.02]'
                : 'border border-[hsl(var(--lv2-slate-200))] bg-white shadow-md hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {plano.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span className="text-xs font-bold whitespace-nowrap px-4 py-1.5 rounded-full bg-[hsl(var(--lv2-emerald))] text-white shadow-lg shadow-[hsl(var(--lv2-emerald)/0.3)]">
                  {plano.badge}
                </span>
              </div>
            )}

            <div className="text-center pb-2 pt-2">
              <div className={`h-14 w-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                plano.destaque
                  ? 'bg-[hsl(var(--lv2-emerald)/0.1)] border border-[hsl(var(--lv2-emerald)/0.2)]'
                  : 'bg-[hsl(var(--lv2-slate-100))]'
              }`}>
                <Icon className={`h-7 w-7 ${plano.destaque ? 'text-[hsl(var(--lv2-emerald))]' : 'text-[hsl(var(--lv2-slate-400))]'}`} />
              </div>
              <h3 className="text-lg font-bold text-[hsl(var(--lv2-slate-950))]">{plano.nome}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">{plano.precoLabel}</span>
                <span className="text-[hsl(var(--lv2-slate-400))] text-sm ml-1">{plano.periodo}</span>
              </div>
            </div>

            <div className="flex-1 mt-6 space-y-3">
              {plano.beneficios.map((b) => (
                <div key={b.texto} className="flex items-start gap-3 text-sm">
                  {b.disponivel ? (
                    <Check className="h-4 w-4 text-[hsl(var(--lv2-emerald))] shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-[hsl(var(--lv2-slate-300))] shrink-0 mt-0.5" />
                  )}
                  <span className={b.disponivel ? 'text-[hsl(var(--lv2-slate-700))] font-medium' : 'text-[hsl(var(--lv2-slate-300))]'}>
                    {b.texto}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <Link to="/cadastro" className="block">
                <Button
                  size="lg"
                  className={`w-full h-14 text-base font-bold rounded-full ${
                    plano.destaque
                      ? 'bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white shadow-lg shadow-[hsl(var(--lv2-emerald)/0.25)]'
                      : 'bg-[hsl(var(--lv2-slate-950))] hover:bg-[hsl(var(--lv2-slate-900))] text-white'
                  }`}
                >
                  {plano.cta}
                </Button>
              </Link>
              {plano.destaque && (
                <Button variant="ghost" size="sm" className="w-full text-[hsl(var(--lv2-slate-400))] hover:text-[hsl(var(--lv2-slate-600))] hover:bg-[hsl(var(--lv2-slate-50))]" asChild>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Falar com consultor
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
