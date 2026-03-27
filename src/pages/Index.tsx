import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, Bell, CheckCircle2,
  ArrowRight, Star, Layout, MessageSquare, Send, Monitor, Smartphone, Lock,
  Clock, Briefcase, TrendingUp, BarChart3, FolderCheck, Receipt, Palette,
  AlertTriangle, XCircle, ChevronRight, Flame, Target, DollarSign, Timer,
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import logoHero from '@/assets/logo-hero.png';
import ctaPerson from '@/assets/cta-person.jpg';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';
import featureTeam from '@/assets/feature-team.jpg';
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
  { icon: MessageSquare, text: 'Cliente mandando documento solto no WhatsApp' },
  { icon: XCircle, text: 'Informações incompletas toda vez' },
  { icon: Timer, text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { icon: AlertTriangle, text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { icon: DollarSign, text: 'Baixa lucratividade pelo esforço absurdo' },
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
  { icon: Receipt, title: 'Cobre via Pix e boleto sem sair da plataforma', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente. Tudo integrado.' },
];

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', stars: 5, avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', stars: 5, avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Minha vida mudou. Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', stars: 5, avatar: avatarRoberto },
];

const objections = [
  {
    objection: '"Já uso planilha"',
    answer: 'Planilha organiza dados. Não organiza processo. E muito menos cliente. Quando o WhatsApp toca pela 30ª vez pedindo a mesma coisa, a planilha não te salva.',
  },
  {
    objection: '"Não tenho tempo de aprender sistema novo"',
    answer: 'Se você tem tempo de reorganizar documento que o cliente mandou errado, tem tempo de apertar 3 botões. Sério: são 2 minutos pra configurar.',
  },
  {
    objection: '"É caro demais"',
    answer: 'Um único erro no IR pode custar mais que um ano inteiro do sistema. R$ 49,90 por mês é menos que o valor de UMA declaração. A matemática é simples.',
  },
  {
    objection: '"Meu escritório é pequeno demais"',
    answer: 'Comece grátis com 3 declarações. Sem cartão. Sem contrato. Se não servir, você não gastou nada. Se servir, acabou de ganhar horas de vida.',
  },
];

const faqs = [
  { q: 'Preciso de cartão de crédito para começar?', a: 'Não. O plano Free é gratuito, sem cartão, sem pegadinha. Teste com 3 declarações completas.' },
  { q: 'Como funciona a malha fina gratuita?', a: 'Cruzamos dados automaticamente via BrasilAPI antes da transmissão. Se tiver inconsistência, você é alertado antes de dar problema.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'Free: 3 declarações, 1 usuário, 5GB. Pro (R$ 49,90/mês): declarações ilimitadas, até 5 usuários, storage ilimitado e acesso a Recursos Extras.' },
  { q: 'O que são Recursos Extras?', a: 'Módulos opcionais: WhatsApp (R$ 19,90), Portal do Cliente (R$ 14,90), API Pública (R$ 29,90), Whitelabel (R$ 9,90), Usuário Extra (R$ 9,90).' },
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
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#dor" className="hover:text-foreground transition-colors">A Dor</a>
            <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-lg shadow-accent/20">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          1. HERO — STORYTELLING + HEADLINE
         ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-destructive/4 blur-3xl animate-blob" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none">
              {/* Storytelling intro */}
              <div className="mb-6 space-y-1">
                <p className="text-muted-foreground text-sm sm:text-base italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Todo ano começa igual.
                </p>
                <p className="text-muted-foreground text-sm sm:text-base italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  Cliente mandando documento no WhatsApp. Informação incompleta.
                </p>
                <p className="text-muted-foreground text-sm sm:text-base italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  Prazo chegando. E você… tentando dar conta do caos.
                </p>
              </div>

              <Badge variant="secondary" className="mb-5 text-sm px-4 py-1.5 glass-card border-destructive/20 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <Flame className="h-3.5 w-3.5 mr-1.5 text-destructive" /> A temporada de IR não espera
              </Badge>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold text-foreground leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                O problema não é o IR.{' '}
                <span className="relative">
                  <span className="text-accent">É a desorganização do seu processo.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M1 5.5Q75 1 150 4T299 3" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-6 text-lg font-medium text-foreground/80 leading-relaxed max-w-lg animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                Organize tudo, elimine retrabalho e entregue declarações em <span className="text-accent font-bold">metade do tempo</span>.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 lg:justify-start justify-center animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
                <Link to="/cadastro">
                  <Button size="lg" className="text-base px-8 h-13 shadow-xl shadow-primary/20 font-bold uppercase tracking-wide">
                    Quero organizar meu IR agora <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              {/* Microcopy */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-muted-foreground animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Sem cartão de crédito
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Começa em 2 minutos
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Cancele quando quiser
                </div>
              </div>
            </div>
            {/* Right — Mockup */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. AMPLIFICAÇÃO DA DOR
         ══════════════════════════════════════════════════════ */}
      <Section id="dor" className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute top-[-50%] left-[20%] w-96 h-96 bg-destructive/8 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50%] right-[10%] w-72 h-72 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <Badge className="mb-6 bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1.5" /> Isso é familiar?
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight mb-10">
            Se você não resolver isso,<br />
            <span className="text-warning">todo ano será a mesma guerra.</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            {painPoints.map((p) => (
              <div key={p.text} className="flex items-start gap-3 glass-card-strong rounded-xl p-4 hover:scale-[1.02] transition-transform">
                <div className="h-9 w-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                  <p.icon className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-sm text-foreground font-medium leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-primary-foreground/60 text-lg italic max-w-2xl mx-auto">
            "Enquanto você organiza documento, outro contador está faturando."
          </p>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3. VIRADA / INSIGHT
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
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
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          4. APRESENTAÇÃO DO PRODUTO
         ══════════════════════════════════════════════════════ */}
      <Section id="solucao" className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30">
                <Zap className="h-3 w-3 mr-1.5" /> Conheça o DeclaraIR
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
                O sistema que transforma o caos do IR em um{' '}
                <span className="text-accent">processo previsível e lucrativo</span>.
              </h2>
              <p className="mt-5 text-primary-foreground/70 text-lg leading-relaxed max-w-md">
                Você não precisa trabalhar mais. Precisa trabalhar organizado.
              </p>
              <Link to="/cadastro">
                <Button size="lg" variant="secondary" className="mt-8 text-base px-8 h-12 shadow-xl font-bold uppercase tracking-wide">
                  Começar agora <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Right — Person with floating cards */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={ctaPerson} alt="Profissional usando DeclaraIR" className="w-full h-[400px] lg:h-[460px] object-cover object-top" loading="lazy" width={1280} height={640} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
              </div>
              <div className="absolute top-6 right-4 glass-card-strong rounded-xl mockup-shadow animate-float p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">-85%</p>
                    <p className="text-[9px] text-muted-foreground">tempo de coleta</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-12 left-4 glass-card-strong rounded-xl mockup-shadow animate-float-delayed p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">3x mais</p>
                    <p className="text-[9px] text-muted-foreground">produtividade</p>
                  </div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Transformação</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Veja a diferença com os próprios olhos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* ANTES */}
            <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-destructive/15 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="font-display font-bold text-destructive text-lg">ANTES</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.before} className="flex items-center gap-3 text-sm">
                  <XCircle className="h-4 w-4 text-destructive/60 shrink-0" />
                  <span className="text-foreground/70">{item.before}</span>
                </div>
              ))}
            </div>

            {/* DEPOIS */}
            <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <h3 className="font-display font-bold text-success text-lg">DEPOIS</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.after} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success/70 shrink-0" />
                  <span className="text-foreground font-medium">{item.after}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center mt-10 text-lg font-bold text-foreground">
            "Você não trabalha mais. Você trabalha melhor — e <span className="text-accent">fatura mais</span>."
          </p>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          6. FUNCIONALIDADES TRADUZIDAS EM BENEFÍCIO
         ══════════════════════════════════════════════════════ */}
      <Section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Na prática</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Cada funcionalidade é um problema a menos
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresTranslated.map((f) => (
              <GlassCard
                key={f.title}
                className="p-6 group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          FEATURE SHOWCASES — Visual deep dives
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute top-[-50%] left-[20%] w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50%] right-[10%] w-72 h-72 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-24">
          {/* Feature 1 — Dashboard */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={featureDashboard} alt="Dashboard de gestão de IR" className="w-full h-[360px] lg:h-[400px] object-cover" loading="lazy" width={960} height={640} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
              </div>
              <div className="absolute top-5 right-4 glass-card-strong rounded-xl mockup-shadow animate-float p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">189</p>
                    <p className="text-[9px] text-muted-foreground">declarações ativas</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 left-4 glass-card-strong rounded-xl mockup-shadow animate-float-delayed p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">+34%</p>
                    <p className="text-[9px] text-muted-foreground">produtividade</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                Pare de adivinhar. Veja o que está travado.
              </h3>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto. Sem ligar pro cliente pra perguntar.
              </p>
              <ul className="mt-6 space-y-3">
                {['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'].map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 — Portal */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={featureMobile} alt="Cliente enviando documentos pelo celular" className="w-full h-[360px] lg:h-[400px] object-cover" loading="lazy" width={960} height={640} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
              </div>
              <div className="absolute top-5 left-4 glass-card-strong rounded-xl mockup-shadow animate-float p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-warning/15 flex items-center justify-center">
                    <FolderCheck className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">12/14</p>
                    <p className="text-[9px] text-muted-foreground">docs recebidos</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                Seu cliente manda tudo certo. Sem te incomodar.
              </h3>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                Chega de "manda de novo", "faltou esse", "mandou no grupo errado". O portal guia o cliente, e você recebe tudo organizado.
              </p>
              <ul className="mt-6 space-y-3">
                {['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Cliente acompanha o status em tempo real'].map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          7. PROVA SOCIAL — Depoimentos
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Quem já usa, não volta</Badge>
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
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/20" loading="lazy" width={40} height={40} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Metrics bar */}
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
      <Section className="py-20 lg:py-28 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Sem desculpa</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              "Mas eu já…" — Calma. Lê isso aqui.
            </h2>
          </div>
          <div className="space-y-4">
            {objections.map((obj) => (
              <GlassCard key={obj.objection} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-bold">
                      {obj.objection}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{obj.answer}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          9. PRICING + ANCORAGEM
         ══════════════════════════════════════════════════════ */}
      <Section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-2 text-xs">Preços</Badge>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto italic">
              "Um único erro no IR pode custar mais que um ano inteiro do sistema."
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Comece grátis. Escale quando quiser.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
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
      <Section className="py-16 lg:py-20 bg-warning/5 border-y border-warning/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-14 w-14 rounded-full bg-warning/15 flex items-center justify-center mx-auto animate-float">
            <Flame className="h-7 w-7 text-warning" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            A temporada de IR não espera.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Quem se organiza antes, <span className="font-bold text-foreground">lucra mais</span>.
            <br />
            Quem deixa pra depois… entra em modo sobrevivência.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-10 h-13 shadow-xl font-bold uppercase tracking-wide mt-2">
              Começar agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">FAQ</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground">Perguntas diretas, respostas diretas</h2>
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
          11. CTA FINAL — FECHAMENTO
         ══════════════════════════════════════════════════════ */}
      <Section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0">
              <img src={ctaPerson} alt="" className="w-full h-full object-cover" loading="lazy" width={1280} height={640} />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/70" />
            </div>

            <div className="relative p-10 sm:p-16 text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

              <div className="relative">
                <img src={logoHero} alt="DeclaraIR" className="h-16 sm:h-20 mx-auto mb-6 drop-shadow-2xl" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
                  Pare de operar no caos.
                </h2>
                <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto text-xl font-medium">
                  Transforme seu IR em um processo simples, previsível e lucrativo.
                </p>
                <p className="mt-6 text-primary-foreground/60 text-sm italic">
                  "Você não precisa trabalhar mais. Precisa trabalhar organizado."
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-8 text-base px-10 h-13 shadow-xl font-bold uppercase tracking-wide">
                    Começar agora <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="mt-3 text-primary-foreground/50 text-xs">
                  Sem cartão • 3 declarações grátis • Cancele quando quiser
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
              <div className="flex items-center gap-2 mb-4">
                <img src={logoIcon} alt="DeclaraIR" className="h-7 w-7" />
                <img src={logoFull} alt="DeclaraIR" className="h-5" />
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
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
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
