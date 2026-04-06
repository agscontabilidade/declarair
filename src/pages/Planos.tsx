import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Zap, Crown, Lock, MessageCircle } from 'lucide-react';
import NavBar from '@/components/landing-v2/NavBar';
import Footer from '@/components/landing-v2/Footer';
import { PRECOS } from '@/lib/constants/planos';

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=5511998755782&text=Ol%C3%A1%2C+quero+saber+mais+sobre+o+DeclaraIR&type=phone_number&app_absent=0';

const PLANOS_DATA = [
  {
    id: 'free',
    nome: 'Free',
    subtitulo: 'Para conhecer a plataforma',
    preco: 'R$ 0',
    periodo: '/mês',
    icon: Zap,
    badge: null,
    destaque: false,
    cta: 'Começar Grátis',
    beneficios: [
      { texto: '1 declaração para teste (inclusa)', disponivel: true, bold: true },
      { texto: '1 usuário', disponivel: true },
      { texto: '500 MB de armazenamento', disponivel: true },
      { texto: 'Gestão básica de declarações', disponivel: true },
      { texto: 'Portal do Contribuinte básico', disponivel: true },
      { texto: 'Suporte por chat', disponivel: true },
      { texto: 'Kanban e chat avançado', disponivel: false },
      { texto: 'Verificador de malha fina', disponivel: false },
      { texto: 'Calculadora IR integrada', disponivel: false },
      { texto: 'Múltiplos usuários', disponivel: false },
    ],
    nota: '💡 Faça upgrade para desbloquear malha fina, calculadora IR e mais',
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
    cta: 'Começar Agora',
    beneficios: [
      { texto: '0 declarações inclusas — compre sob demanda', disponivel: true, bold: true },
      { texto: `R$ ${PRECOS.DECLARACAO_EXTRA.preco.toFixed(2).replace('.', ',')} por declaração avulsa`, disponivel: true, bold: true },
      { texto: 'Até 5 usuários simultâneos', disponivel: true },
      { texto: 'Armazenamento ilimitado', disponivel: true },
      { texto: 'Verificador de malha fina', disponivel: true },
      { texto: 'Calculadora IR integrada', disponivel: true },
      { texto: 'Chat com clientes', disponivel: true },
      { texto: 'Kanban de declarações', disponivel: true },
      { texto: 'Cobranças automáticas', disponivel: true },
      { texto: 'Suporte prioritário', disponivel: true },
    ],
    nota: '💡 Usuários extras: R$ 9,90/usuário (6º+)',
  },
];

const COMPARISON = [
  { recurso: 'Declarações inclusas', free: '1 (teste)', pro: '0 (sob demanda)' },
  { recurso: 'Declarações avulsas', free: '—', pro: 'R$ 9,90/cada' },
  { recurso: 'Usuários simultâneos', free: '1', pro: '5' },
  { recurso: 'Storage', free: '500 MB', pro: 'Ilimitado' },
  { recurso: 'Malha fina', free: '✗', pro: '✓' },
  { recurso: 'Calculadora IR', free: '✗', pro: '✓' },
  { recurso: 'Chat clientes', free: '✓', pro: '✓' },
  { recurso: 'Kanban avançado', free: '✗', pro: '✓' },
  { recurso: 'Suporte', free: 'Chat', pro: 'Prioritário' },
];

const ADDONS = [
  { emoji: '💬', nome: 'WhatsApp', desc: 'Mensagens automáticas', preco: '19,90' },
  { emoji: '👤', nome: 'Portal Cliente', desc: 'Área exclusiva completa', preco: '14,90' },
  { emoji: '🔌', nome: 'API Pública', desc: 'Integrações externas', preco: '29,90' },
  { emoji: '🎨', nome: 'Whitelabel', desc: 'Sua marca no sistema', preco: '9,90' },
];

export default function Planos() {
  return (
    <div className="landing-v2 min-h-screen overflow-x-hidden">
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-4 bg-[hsl(var(--lv2-slate-950))]">
        {/* Blobs */}
        <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--lv2-emerald)/0.06)] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--lv2-emerald)/0.04)] blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-block bg-[hsl(var(--lv2-emerald)/0.1)] text-[hsl(var(--lv2-emerald))] text-sm font-medium px-4 py-1.5 rounded-full border border-[hsl(var(--lv2-emerald)/0.2)]">
            🎉 Teste grátis com 1 declaração
          </span>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display text-white">
            Simplifique seu IR com
            <span className="block mt-2 bg-gradient-to-r from-[hsl(var(--lv2-emerald))] to-[hsl(170_60%_50%)] bg-clip-text text-transparent">
              Planos que crescem com você
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Comece grátis com 1 declaração. Desbloqueie o sistema completo por apenas R$ 29,90/mês.
            Sem contrato. Sem pegadinhas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/cadastro">
              <Button size="lg" className="text-lg px-8 glow-btn bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full h-13">
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/#como-funciona">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10 rounded-full h-13">
                Ver Demonstração
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/30">
            ✓ Teste grátis com 1 declaração  ✓ Pro por R$ 29,90/mês  ✓ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── PLANOS CARDS ── */}
      <section className="py-24 px-4 bg-[hsl(var(--lv2-slate-50))]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-[hsl(var(--lv2-slate-950))]">
              Escolha seu plano
            </h2>
            <p className="text-lg text-[hsl(var(--lv2-slate-500))]">
              2 opções simples. Recursos extras sob demanda.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PLANOS_DATA.map((plano) => {
              const Icon = plano.icon;
              return (
                <div
                  key={plano.id}
                  className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                    plano.destaque
                      ? 'lv2-card-pro border-2 border-[hsl(var(--lv2-emerald)/0.4)] bg-white shadow-2xl shadow-[hsl(var(--lv2-emerald)/0.08)] scale-[1.02]'
                      : 'lv2-card border border-[hsl(var(--lv2-slate-200))] bg-white shadow-md hover:shadow-xl hover:-translate-y-1'
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
                    <h3 className="text-2xl font-bold text-[hsl(var(--lv2-slate-950))] font-display">{plano.nome}</h3>
                    <p className="text-sm text-[hsl(var(--lv2-slate-500))] mt-1">{plano.subtitulo}</p>
                    <div className="mt-4">
                      <span className="text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">{plano.preco}</span>
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
                        <span className={b.disponivel
                          ? `text-[hsl(var(--lv2-slate-700))] ${b.bold ? 'font-bold' : 'font-medium'}`
                          : 'text-[hsl(var(--lv2-slate-300))]'
                        }>
                          {b.texto}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[hsl(var(--lv2-slate-100))]">
                    <p className="text-sm text-[hsl(var(--lv2-slate-500))]">{plano.nota}</p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Link to="/cadastro" className="block">
                      <Button
                        size="lg"
                        className={`w-full h-13 text-base font-bold rounded-full ${
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
        </div>
      </section>

      {/* ── ADDONS ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-[hsl(var(--lv2-slate-950))]">
              Recursos Adicionais
            </h2>
            <p className="text-lg text-[hsl(var(--lv2-slate-500))]">
              Ative apenas o que você precisa. Pague somente por isso.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {ADDONS.map((addon) => (
              <div key={addon.nome} className="lv2-card rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto bg-[hsl(var(--lv2-emerald)/0.08)] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{addon.emoji}</span>
                </div>
                <h3 className="font-semibold text-[hsl(var(--lv2-slate-950))]">{addon.nome}</h3>
                <p className="text-sm text-[hsl(var(--lv2-slate-500))]">{addon.desc}</p>
                <p className="text-2xl font-bold text-[hsl(var(--lv2-slate-950))]">R$ {addon.preco}</p>
                <p className="text-xs text-[hsl(var(--lv2-slate-400))]">/mês</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-24 px-4 bg-[hsl(var(--lv2-slate-50))]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4 font-display text-[hsl(var(--lv2-slate-950))]">
              Comparação Detalhada
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[hsl(var(--lv2-slate-100))]">
                  <th className="text-left py-4 px-6 font-semibold text-[hsl(var(--lv2-slate-950))] text-sm">Recurso</th>
                  <th className="text-center py-4 px-6 font-semibold text-[hsl(var(--lv2-slate-950))] text-sm">Free</th>
                  <th className="text-center py-4 px-6 bg-[hsl(var(--lv2-emerald)/0.05)] font-semibold text-[hsl(var(--lv2-slate-950))] text-sm">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--lv2-slate-100))]">
                {COMPARISON.map((row) => (
                  <tr key={row.recurso} className="hover:bg-[hsl(var(--lv2-slate-50))]">
                    <td className="py-3 px-6 font-medium text-sm text-[hsl(var(--lv2-slate-700))]">{row.recurso}</td>
                    <td className="text-center py-3 px-6 text-sm text-[hsl(var(--lv2-slate-500))]">{row.free}</td>
                    <td className="text-center py-3 px-6 bg-[hsl(var(--lv2-emerald)/0.05)] text-sm font-medium text-[hsl(var(--lv2-slate-700))]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-4 bg-[hsl(var(--lv2-slate-950))]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
            Pronto para simplificar seu IR?
          </h2>
          <p className="text-xl text-white/50">
            Comece grátis agora. Sem contrato, sem compromisso.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-lg px-8 glow-btn bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full h-13 mt-4">
              Começar Grátis Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
