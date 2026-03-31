import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, CheckCircle2,
  ArrowRight, Star, Layout, Smartphone, Lock,
  BarChart3, FolderCheck, Receipt, Palette,
  ChevronRight, DollarSign,
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import logoHero from '@/assets/logo-hero.png';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';
import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import avatarCarlos from '@/assets/avatar-carlos.jpg';
import avatarAna from '@/assets/avatar-ana.jpg';
import avatarRoberto from '@/assets/avatar-roberto.jpg';
import HeroMockup from '@/components/landing/HeroMockup';
import GlassCard from '@/components/landing/GlassCard';
import MetricCounter from '@/components/landing/MetricCounter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';

/* ── Data ── */
const features = [
  { icon: Layout, title: 'Kanban inteligente', desc: 'Visualize todas as declarações por etapa. Saiba exatamente quem está pendente, quem já enviou e quem precisa de atenção — sem planilhas.' },
  { icon: Smartphone, title: 'Portal do contribuinte', desc: 'Seu cliente envia documentos pelo celular ou computador, com checklist guiado. Tudo organizado automaticamente para você.' },
  { icon: Shield, title: 'Verificação de malha fina', desc: 'Consulta automática à base da Receita Federal antes da transmissão. Identifique inconsistências e proteja seu cliente.' },
  { icon: Zap, title: 'Simulador de IR', desc: 'Compare Simplificada vs. Completa instantaneamente. Apresente o melhor cenário ao cliente com dados reais.' },
  { icon: Palette, title: 'Whitelabel', desc: 'Personalize o portal com a marca do seu escritório. Seu cliente vê seu nome, sua cor, sua identidade — não a nossa.' },
  { icon: Receipt, title: 'Cobranças integradas', desc: 'Gere cobranças via Pix e cartão de crédito sem sair da plataforma. Acompanhe pagamentos em tempo real.' },
];

const steps = [
  { num: '01', title: 'Cadastre seu escritório', desc: 'Crie sua conta em menos de 2 minutos. Sem burocracia.' },
  { num: '02', title: 'Convide seus clientes', desc: 'Envie o link do portal. Seu cliente preenche dados e envia documentos sozinho.' },
  { num: '03', title: 'Gerencie pelo Kanban', desc: 'Acompanhe cada declaração do início à transmissão, com total controle.' },
];

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', stars: 5, avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', stars: 5, avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', stars: 5, avatar: avatarRoberto },
];

const faqs = [
  { q: 'Como funciona o plano gratuito?', a: 'O plano Free libera 1 declaração completa, chat, kanban e 500 MB de armazenamento. Perfeito para testar o sistema sem compromisso.' },
  { q: 'Como funciona a verificação de malha fina?', a: 'Disponível no plano Pro. Consultamos a base da Receita Federal automaticamente antes da transmissão. Se houver inconsistência, você é alertado preventivamente.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'Free: 1 declaração, 1 usuário, 500 MB. Pro (R$ 29,90/mês): 3 declarações inclusas + extras por R$ 9,90, até 5 usuários, storage ilimitado, malha fina, calculadora IR e suporte prioritário.' },
  { q: 'O que são Recursos Extras?', a: 'Módulos opcionais que você ativa conforme sua necessidade: WhatsApp (R$ 19,90/mês), API Pública (R$ 29,90/mês), Whitelabel (R$ 49,90/mês).' },
  { q: 'Meus clientes precisam instalar algo?', a: 'Não. O portal é 100% web. Funciona no celular e computador. Basta enviar o link de convite.' },
  { q: 'Os dados estão seguros?', a: 'Sim. Criptografia de ponta a ponta, isolamento por escritório (multi-tenancy) e políticas de acesso em nível de linha em todas as tabelas.' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. Plano mensal. Cancele quando quiser, sem multa e sem burocracia.' },
];

/* ── Scroll Section Wrapper ── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useScrollReveal();
  return (
    <section ref={ref} id={id} className={`scroll-reveal ${className}`}>
      {children}
    </section>
  );
}

/* ── Page ── */
export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-lg shadow-accent/20 text-sm rounded-lg px-5">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          1. HERO
         ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/6 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/4 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 text-xs px-4 py-1.5 font-medium">
                Plataforma para escritórios de contabilidade
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight">
                Gestão de IRPF{' '}
                <span className="text-accent">simplificada</span>{' '}
                para o seu escritório.
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Organize declarações, receba documentos dos seus clientes e acompanhe cada etapa do processo — tudo em um só lugar.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3">
                <Link to="/cadastro">
                  <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/15 font-semibold rounded-lg">
                    Criar conta grátis <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-lg font-medium">
                    Ver como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center lg:justify-start justify-center gap-x-6 gap-y-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Plano Free disponível
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Setup em 2 minutos
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Cancele quando quiser
                </div>
              </div>
            </div>

            {/* Right — Mockup */}
            <div className="flex-1 w-full">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. LOGOS / SOCIAL PROOF BAR
         ══════════════════════════════════════════════════════ */}
      <Section className="py-12 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-3xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground mt-1">Escritórios ativos</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">1.200+</p>
              <p className="text-sm text-muted-foreground mt-1">Declarações processadas</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">85%</p>
              <p className="text-sm text-muted-foreground mt-1">Redução no tempo de coleta</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground mt-1">Satisfação dos contadores</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3. COMO FUNCIONA
         ══════════════════════════════════════════════════════ */}
      <Section id="como-funciona" className="py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5">Como funciona</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Três passos para organizar seu IR
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Da criação da conta à transmissão da declaração, tudo em um fluxo simples e intuitivo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
                <span className="font-display text-5xl font-extrabold text-accent/15">{s.num}</span>
                <h3 className="font-display font-bold text-foreground text-lg mt-3">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          4. FUNCIONALIDADES
         ══════════════════════════════════════════════════════ */}
      <Section id="funcionalidades" className="py-24 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5">Funcionalidades</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Tudo que seu escritório precisa para o IR
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Ferramentas projetadas para contadores que querem produtividade sem complexidade.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-7 rounded-2xl border border-border bg-card hover:shadow-md transition-all group"
              >
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-base">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          5. SHOWCASE — Dashboard
         ══════════════════════════════════════════════════════ */}
      <Section className="py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
                <img src={featureDashboard} alt="Dashboard de gestão de IR" className="w-full h-auto object-cover" loading="lazy" width={960} height={640} />
              </div>
            </div>
            <div className="flex-1 space-y-5">
              <Badge variant="secondary" className="text-xs px-4 py-1.5">Visão geral</Badge>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Controle total sobre cada declaração
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O Kanban mostra cada declaração como um card. Veja quem está pendente, quem já enviou documentos e quem está pronto para transmitir — tudo em tempo real.
              </p>
              <ul className="space-y-3">
                {['Arraste e solte entre etapas', 'KPIs em tempo real', 'Filtre por responsável e urgência'].map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Showcase — Portal */}
      <Section className="py-24 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-14 lg:gap-20">
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
                <img src={featureMobile} alt="Portal do contribuinte no celular" className="w-full h-auto object-cover" loading="lazy" width={960} height={640} />
              </div>
            </div>
            <div className="flex-1 space-y-5">
              <Badge variant="secondary" className="text-xs px-4 py-1.5">Portal do contribuinte</Badge>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Seu cliente envia tudo certo, sem te incomodar
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O portal guia o contribuinte com um checklist inteligente. Ele envia cada documento no lugar certo, e você recebe tudo organizado.
              </p>
              <ul className="space-y-3">
                {['Upload direto pelo celular', 'Checklist gerado por perfil fiscal', 'Acompanhamento de status em tempo real'].map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          6. DEPOIMENTOS
         ══════════════════════════════════════════════════════ */}
      <Section className="py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5">Depoimentos</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              O que contadores dizem sobre o DeclaraIR
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-7 rounded-2xl border border-border bg-card">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" width={40} height={40} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          7. PRICING
         ══════════════════════════════════════════════════════ */}
      <Section id="pricing" className="py-24 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-2 text-xs px-4 py-1.5">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Preços
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comece grátis e evolua conforme seu escritório cresce. Sem contrato e sem surpresas.
            </p>
          </div>
          <PlanosCardsPublic />
          <TabelaAvulso />
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-24 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5">Perguntas frequentes</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Tire suas dúvidas</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-5 data-[state=open]:shadow-sm">
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          8. CTA FINAL
         ══════════════════════════════════════════════════════ */}
      <Section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <img src={logoHero} alt="DeclaraIR" className="h-20 mx-auto" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Pronto para organizar o IR do seu escritório?
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Crie sua conta gratuita e comece a usar hoje mesmo. Sem compromisso.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-10 h-12 shadow-lg font-semibold rounded-lg mt-2">
              Criar conta grátis <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Plano Free disponível • Cancele quando quiser
          </p>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logoIcon} alt="DeclaraIR" className="h-8 w-8" />
                <img src={logoFull} alt="DeclaraIR" className="h-6" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gestão de Imposto de Renda para escritórios de contabilidade.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Empresa</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/sobre" className="hover:text-foreground transition-colors">Sobre nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
                <li><Link to="/politica-lgpd" className="hover:text-foreground transition-colors">LGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Dados protegidos com criptografia
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
