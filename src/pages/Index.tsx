import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, CheckCircle2,
  ArrowRight, Star, Layout, Smartphone, Lock,
  BarChart3, FolderCheck, Receipt, Palette,
  DollarSign, Flame, Target, XCircle, AlertTriangle,
  MessageSquareWarning, FileQuestion, Clock, RotateCcw, TrendingDown,
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import logoHero from '@/assets/logo-hero.png';
import ctaPerson from '@/assets/cta-person.jpg';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';
import lionBrave from '@/assets/lion-brave.jpg';
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
const painPoints = [
  { icon: MessageSquareWarning, text: 'Cliente mandando documento solto no WhatsApp' },
  { icon: FileQuestion, text: 'Informações incompletas toda vez' },
  { icon: Clock, text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { icon: RotateCcw, text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { icon: TrendingDown, text: 'Baixa lucratividade pelo esforço absurdo' },
];

const beforeAfter = [
  { before: 'Caos no WhatsApp', after: 'Fluxo organizado e automático' },
  { before: 'Cliente perdido sem saber o que enviar', after: 'Cliente guiado com checklist inteligente' },
  { before: 'Retrabalho a cada declaração', after: 'Processo previsível e escalável' },
  { before: 'Correria desesperada no prazo', after: 'Controle total — sem surpresas' },
  { before: 'Trabalhar mais, faturar igual', after: 'Trabalhar menos, faturar mais' },
];

const featuresTranslated = [
  { icon: Layout, title: 'Veja quem está pendente agora', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real.' },
  { icon: Smartphone, title: 'Cliente envia tudo certo, no lugar certo', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, automaticamente.' },
  { icon: Shield, title: 'Evite malha fina antes de transmitir', desc: 'O verificador cruza dados automaticamente e avisa antes de dar problema. Incluso em todos os planos — sem custo extra.' },
  { icon: Zap, title: 'Simule o resultado do IR em segundos', desc: 'Compare Simplificada vs Completa instantaneamente. Mostre pro cliente o cenário ideal e feche o serviço mais rápido.' },
  { icon: Palette, title: 'Cobre mais com uma experiência profissional', desc: 'Whitelabel com sua marca no portal. Seu cliente vê o seu nome, não o nosso. Isso é percepção de valor — e valor se cobra.' },
  { icon: Receipt, title: 'Cobre via Pix e cartão sem sair da plataforma', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente. Tudo integrado.' },
];

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', stars: 5, avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', stars: 5, avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Minha vida mudou. Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', stars: 5, avatar: avatarRoberto },
];

const objections = [
  { objection: '"Já uso planilha"', answer: 'Planilha organiza dados. Não organiza processo. E muito menos cliente. Quando o WhatsApp toca pela 30ª vez pedindo a mesma coisa, a planilha não te salva.' },
  { objection: '"Não tenho tempo de aprender sistema novo"', answer: 'Se você tem tempo de reorganizar documento que o cliente mandou errado, tem tempo de apertar 3 botões. Sério: são 2 minutos pra configurar.' },
  { objection: '"É caro demais"', answer: 'Um único erro no IR pode custar mais que um ano inteiro do sistema. R$ 29,90 por mês é menos que o valor de UMA declaração. A matemática é simples.' },
  { objection: '"Meu escritório é pequeno demais"', answer: 'Comece grátis com 1 declaração. Sem contrato. Se não servir, você não gastou nada. Se servir, desbloqueie tudo por R$ 29,90/mês.' },
];

const faqs = [
  { q: 'Como funciona o plano gratuito?', a: 'O plano Free libera 1 declaração completa, chat, kanban e 500 MB de armazenamento. Perfeito para testar o sistema.' },
  { q: 'Como funciona a malha fina?', a: 'Disponível no plano Pro. Cruzamos dados automaticamente via BrasilAPI antes da transmissão. Se tiver inconsistência, você é alertado antes de dar problema.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'Free: 1 declaração, 1 usuário, 500 MB, chat e kanban. Pro (R$ 29,90/mês): 3 declarações inclusas + extras por R$ 9,90, até 5 usuários, storage ilimitado, malha fina, calculadora IR e suporte prioritário.' },
  { q: 'O que são Recursos Extras?', a: 'Módulos opcionais: WhatsApp (R$ 19,90/mês), API Pública (R$ 29,90/mês), Whitelabel (R$ 49,90/mês).' },
  { q: 'Meus clientes precisam instalar algo?', a: 'Não. Portal 100% web. Funciona no celular e computador. Basta enviar o link.' },
  { q: 'Os dados estão seguros?', a: 'Criptografia de ponta a ponta, isolamento por escritório e políticas de acesso em nível de linha em todas as tabelas.' },
  { q: 'Existe contrato de fidelidade?', a: 'Zero. Mensal. Cancele quando quiser. Sem multa, sem burocracia.' },
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
      {/* ── HEADER — sticky overlay ── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-navbar shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoFull} alt="DeclaraIR" className="h-12 sm:h-14 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground font-medium tracking-wide">
            <a href="#dor" className="hover:text-foreground transition-colors">A Dor</a>
            <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-sm font-medium">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-md shadow-accent/15 text-sm rounded-lg px-5 font-semibold">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* ══════════════════════════════════════════════════════
          1. HERO
         ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-destructive/4 blur-3xl animate-blob" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-5 text-xs px-4 py-1.5 glass-card border-destructive/20 animate-fade-in-up font-medium" style={{ animationDelay: '0.3s' }}>
                <Flame className="h-3.5 w-3.5 mr-1.5 text-destructive" /> A temporada de IR não espera
              </Badge>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold text-foreground leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                O problema não é IRPF.{' '}
                <span className="relative inline-block">
                  <span className="text-accent">É o seu processo desorganizado!</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M1 5.5Q75 1 150 4T299 3" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl font-medium text-foreground/75 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                Organize tudo, elimine retrabalho e entregue declarações em <span className="text-accent font-bold">metade do tempo</span>.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                <Link to="/cadastro">
                  <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20 font-bold uppercase tracking-wide rounded-xl">
                    Quero organizar meu IR agora <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#solucao">
                  <Button size="lg" variant="outline" className="text-base px-6 h-12 rounded-xl font-semibold">
                    Ver como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center lg:justify-start justify-center gap-x-6 gap-y-1.5 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Plano Free disponível
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Começa em 2 minutos
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Cancele quando quiser
                </div>
              </div>
            </div>

            {/* Right — Mockups */}
            <div className="flex-1 w-full animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          1.5. STORYTELLING — FRASE DE IMPACTO
         ══════════════════════════════════════════════════════ */}
      <Section className="relative bg-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-primary/80" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="relative py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/55 leading-relaxed italic">
              Todo ano começa igual.
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/65 leading-relaxed italic">
              Cliente mandando documento no WhatsApp. Informação incompleta.
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white leading-relaxed">
              Prazo chegando. E você… tentando dar conta do caos.
            </p>
            <div className="pt-6">
              <Link to="/cadastro">
                <Button size="lg" className="text-base px-10 h-13 shadow-2xl shadow-accent/25 font-black uppercase tracking-widest rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground border-0">
                  Chega de caos <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          2. AMPLIFICAÇÃO DA DOR
         ══════════════════════════════════════════════════════ */}
      <Section id="dor" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} style={{ transform: 'translateZ(0)' }} />
          <div className="absolute inset-0 bg-primary/90" />
        </div>

        <div className="relative py-20 lg:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-6 bg-destructive/20 text-destructive-foreground border-destructive/30 hover:bg-destructive/30 text-xs px-4 py-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Isso é familiar?
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight mb-10">
              Se você não resolver isso,<br />
              <span className="text-warning">todo ano será a mesma guerra.</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
              {painPoints.map((p) => (
                <div key={p.text} className="flex items-start gap-3 glass-card-strong rounded-xl p-4 hover:scale-[1.02] transition-transform backdrop-blur-xl">
                  <div className="h-10 w-10 shrink-0 mt-0.5 rounded-lg bg-destructive/15 flex items-center justify-center">
                    <p.icon className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-12 text-primary-foreground/65 text-lg italic max-w-2xl mx-auto">
              "Enquanto você organiza documento, outro contador está faturando."
            </p>

            <div className="mt-8">
              <Link to="/cadastro">
                <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-accent/25 font-bold uppercase tracking-wide rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                  Resolver isso agora <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3. VIRADA / INSIGHT
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
            <Target className="h-8 w-8 text-accent" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            O problema nunca foi o volume de declarações.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            É a falta de um sistema que <span className="text-accent font-bold">organize o jogo pra você</span>.
          </p>
          <p className="text-foreground font-bold text-lg">
            IR não é difícil. Difícil é trabalhar no caos.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="mt-3 text-base px-8 h-12 shadow-lg shadow-primary/20 font-bold uppercase tracking-wide rounded-xl">
              Testar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          4. APRESENTAÇÃO DO PRODUTO
         ══════════════════════════════════════════════════════ */}
      <Section id="solucao" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 text-xs px-4 py-1.5 font-medium">
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Conheça o DeclaraIR
                </Badge>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
                  O sistema que transforma o caos do IR em um{' '}
                  <span className="text-accent">processo previsível e lucrativo</span>.
                </h2>
                <p className="mt-5 text-primary-foreground/65 text-lg leading-relaxed max-w-lg">
                  Você não precisa trabalhar mais. Precisa trabalhar organizado.
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-8 text-base px-8 h-12 shadow-lg font-bold uppercase tracking-wide rounded-xl">
                    Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={mockupDashboard} alt="Dashboard DeclaraIR" className="w-full h-auto object-cover" loading="lazy" width={1280} height={800} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          5. TRANSFORMAÇÃO — ANTES vs DEPOIS
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 font-medium">Transformação</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Veja a diferença com os próprios olhos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-7 space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-9 w-9 rounded-lg bg-destructive/15 flex items-center justify-center">
                  <XCircle className="h-4.5 w-4.5 text-destructive" />
                </div>
                <h3 className="font-display font-bold text-destructive text-lg">ANTES</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.before} className="flex items-center gap-2.5 text-sm">
                  <XCircle className="h-4 w-4 text-destructive/60 shrink-0" />
                  <span className="text-foreground/70">{item.before}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-success/25 bg-success/5 p-7 space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5 text-success" />
                </div>
                <h3 className="font-display font-bold text-success text-lg">DEPOIS</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.after} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success/70 shrink-0" />
                  <span className="text-foreground font-medium">{item.after}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center mt-10 text-lg font-bold text-foreground">
            "Você não trabalha mais. Você trabalha melhor — e <span className="text-accent">fatura mais</span>."
          </p>
          <div className="text-center mt-6">
            <Link to="/cadastro">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20 font-bold uppercase tracking-wide rounded-xl">
                Quero essa transformação <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          6. FUNCIONALIDADES
         ══════════════════════════════════════════════════════ */}
      <Section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 font-medium">Na prática</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Cada funcionalidade é um problema a menos
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto">
              Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresTranslated.map((f) => (
              <GlassCard key={f.title} className="p-6 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg">{f.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/cadastro">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20 font-bold uppercase tracking-wide rounded-xl">
                Começar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          FEATURE SHOWCASES
         ══════════════════════════════════════════════════════ */}
      <Section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute top-[-50%] left-[20%] w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50%] right-[10%] w-72 h-72 bg-accent/8 rounded-full blur-3xl" />

        <div className="relative py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {/* Feature 1 — Dashboard */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={featureDashboard} alt="Dashboard de gestão de IR" className="w-full h-[320px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                  Pare de adivinhar. Veja o que está travado.
                </h3>
                <p className="mt-4 text-base text-primary-foreground/65 leading-relaxed">
                  O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto. Sem ligar pro cliente pra perguntar.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-primary-foreground/75">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 2 — Portal */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={featureMobile} alt="Cliente enviando documentos pelo celular" className="w-full h-[320px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                  Seu cliente manda tudo certo. Sem te incomodar.
                </h3>
                <p className="mt-4 text-base text-primary-foreground/65 leading-relaxed">
                  Chega de "manda de novo", "faltou esse", "mandou no grupo errado". O portal guia o cliente, e você recebe tudo organizado.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Cliente acompanha o status em tempo real'].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-primary-foreground/75">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          7. PROVA SOCIAL
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 font-medium">Quem já usa, não volta</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Resultados reais de contadores reais
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <GlassCard key={t.name} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/15" loading="lazy" width={48} height={48} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-16 bg-primary rounded-2xl p-8 sm:p-10 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <MetricCounter end="500" suffix="+" label="Escritórios ativos" />
              <MetricCounter end="1200" suffix="+" label="Declarações processadas" />
              <MetricCounter end="85" suffix="%" label="Menos tempo de coleta" />
              <MetricCounter end="98" suffix="%" label="Satisfação dos contadores" />
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          8. QUEBRA DE OBJEÇÃO
         ══════════════════════════════════════════════════════ */}
      <Section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={lionBrave} alt="" className="w-full h-full object-cover object-center" loading="lazy" width={1920} height={800} style={{ filter: 'grayscale(0.3) brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/85 to-primary/90" />
        </div>

        <div className="relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-white/10 text-primary-foreground border-white/20 text-xs px-4 py-1.5 font-medium">Sem desculpa</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                "Mas eu já…" — Calma. Lê isso aqui.
              </h2>
            </div>
            <div className="space-y-4">
              {objections.map((obj) => (
                <div key={obj.objection} className="glass-card-strong rounded-xl p-5 hover:shadow-lg transition-all hover:scale-[1.01] backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="shrink-0">
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-bold">
                        {obj.objection}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{obj.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          9. PRICING
         ══════════════════════════════════════════════════════ */}
      <Section id="pricing" className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-accent/[0.04] to-primary/[0.03]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-4">
            <Badge className="mb-2 bg-accent/10 text-accent border-accent/20 text-xs px-4 py-1.5 font-medium">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Preços
            </Badge>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto italic">
              "Um único erro no IR pode custar mais que um ano inteiro do sistema."
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Comece grátis. Escale quando quiser.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Dois planos. Sem contrato. Sem surpresas. Sem letras miúdas.
            </p>
          </div>
          <PlanosCardsPublic />
          <TabelaAvulso />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          10. URGÊNCIA
         ══════════════════════════════════════════════════════ */}
      <Section className="py-16 lg:py-20 bg-warning/5 border-y border-warning/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 flex items-center justify-center mx-auto animate-float">
            <Flame className="h-7 w-7 text-warning" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            A temporada de IR não espera.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Quem se organiza antes, <span className="font-bold text-foreground">lucra mais</span>.
            <br />
            Quem deixa pra depois… entra em modo sobrevivência.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-10 h-12 shadow-lg font-bold uppercase tracking-wide rounded-xl mt-3">
              Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 font-medium">FAQ</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Perguntas diretas, respostas diretas</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl px-5 border-0">
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          11. CTA FINAL
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0">
              <img src={ctaPerson} alt="" className="w-full h-full object-cover" loading="lazy" width={1280} height={640} />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/70" />
            </div>

            <div className="relative p-10 sm:p-16 text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

              <div className="relative">
                <img src={logoHero} alt="DeclaraIR" className="h-16 sm:h-20 mx-auto mb-6 drop-shadow-2xl brightness-0 invert" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
                  Pare de operar no caos.
                </h2>
                <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto text-xl font-medium">
                  Transforme seu IR em um processo simples, previsível e lucrativo.
                </p>
                <p className="mt-6 text-primary-foreground/55 text-sm italic">
                  "Você não precisa trabalhar mais. Precisa trabalhar organizado."
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-8 text-base px-10 h-12 shadow-lg font-bold uppercase tracking-wide rounded-xl">
                    Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <p className="mt-3 text-primary-foreground/45 text-xs">
                  Teste grátis • 3 declarações no Pro • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logoFull} alt="DeclaraIR" className="h-8" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O sistema que organiza o IR do seu escritório.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
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
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
