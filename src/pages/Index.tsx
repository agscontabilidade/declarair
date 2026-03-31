import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, CheckCircle2,
  ArrowRight, Star, Layout, Smartphone, Lock,
  BarChart3, FolderCheck, Receipt, Palette,
  DollarSign, Flame, Target, XCircle, AlertTriangle,
} from 'lucide-react';
import LottieIcon from '@/components/landing/LottieIcon';
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
  { lottie: 'https://lottie.host/a3a14b8e-862c-4e42-808a-2f4e0e9c3b5e/JmGJWMrykF.json', text: 'Cliente mandando documento solto no WhatsApp' },
  { lottie: 'https://lottie.host/35b1a78e-3b6f-4a0e-bf5a-5cedf70e4c1c/k0gOlVPqoH.json', text: 'Informações incompletas toda vez' },
  { lottie: 'https://lottie.host/d5921d47-067f-4e3f-8056-a3f0e4a05f71/7YlVQmBQs2.json', text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { lottie: 'https://lottie.host/8e98a4a4-3eb6-4e4c-8e9c-7e2b4a4b6c5a/ZpBr1Yw8Ey.json', text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { lottie: 'https://lottie.host/d946cc4e-4880-4767-b2a9-3f7a57d0f5c9/y6Y1LPxGmY.json', text: 'Baixa lucratividade pelo esforço absurdo' },
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
          <nav className="hidden md:flex items-center gap-8 text-base text-muted-foreground font-medium">
            <a href="#dor" className="hover:text-foreground transition-colors">A Dor</a>
            <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="lg" className="text-base">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="lg" className="shadow-lg shadow-accent/20 text-base rounded-lg px-6">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* ══════════════════════════════════════════════════════
          1. HERO — CENTERED STORYTELLING + MOCKUPS
         ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-destructive/4 blur-3xl animate-blob" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-8 space-y-1.5">
                <p className="text-muted-foreground text-base sm:text-lg italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Todo ano começa igual.
                </p>
                <p className="text-muted-foreground text-base sm:text-lg italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  Cliente mandando documento no WhatsApp. Informação incompleta.
                </p>
                <p className="text-muted-foreground text-base sm:text-lg italic leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  Prazo chegando. E você… tentando dar conta do caos.
                </p>
              </div>

              <Badge variant="secondary" className="mb-6 text-sm px-5 py-2 glass-card border-destructive/20 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <Flame className="h-4 w-4 mr-2 text-destructive" /> A temporada de IR não espera
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.08] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                O problema não é o IR.{' '}
                <span className="relative inline-block">
                  <span className="text-accent">É a desorganização do seu processo.</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M1 5.5Q75 1 150 4T299 3" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-8 text-xl sm:text-2xl font-medium text-foreground/80 leading-relaxed animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                Organize tudo, elimine retrabalho e entregue declarações em <span className="text-accent font-bold">metade do tempo</span>.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
                <Link to="/cadastro">
                  <Button size="lg" className="text-lg px-10 h-14 shadow-xl shadow-primary/25 font-bold uppercase tracking-wide rounded-lg">
                    Quero organizar meu IR agora <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <a href="#solucao">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-lg font-semibold">
                    Ver como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center lg:justify-start justify-center gap-x-8 gap-y-2 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Plano Free disponível
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Começa em 2 minutos
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Cancele quando quiser
                </div>
              </div>
            </div>

            {/* Right — Mockups */}
            <div className="flex-1 w-full animate-fade-in-up" style={{ animationDelay: '1.7s' }}>
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. AMPLIFICAÇÃO DA DOR — LION BACKGROUND
         ══════════════════════════════════════════════════════ */}
      <Section id="dor" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} style={{ transform: 'translateZ(0)' }} />
          <div className="absolute inset-0 bg-primary/90" />
        </div>

        <div className="relative py-24 lg:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-8 bg-destructive/20 text-destructive-foreground border-destructive/30 hover:bg-destructive/30 text-sm px-5 py-2">
              <AlertTriangle className="h-4 w-4 mr-2" /> Isso é familiar?
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-tight mb-12">
              Se você não resolver isso,<br />
              <span className="text-warning">todo ano será a mesma guerra.</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
              {painPoints.map((p) => (
                <div key={p.text} className="flex items-start gap-4 glass-card-strong rounded-xl p-5 hover:scale-[1.03] transition-transform backdrop-blur-xl">
                  <div className="h-12 w-12 shrink-0 mt-0.5">
                    <LottieIcon url={p.lottie} className="h-12 w-12" />
                  </div>
                  <p className="text-base text-foreground font-medium leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-14 text-primary-foreground/70 text-xl italic max-w-2xl mx-auto font-medium">
              "Enquanto você organiza documento, outro contador está faturando."
            </p>

            <div className="mt-10">
              <Link to="/cadastro">
                <Button size="lg" className="text-lg px-10 h-14 shadow-xl shadow-accent/30 font-bold uppercase tracking-wide rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                  Resolver isso agora <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3. VIRADA / INSIGHT
         ══════════════════════════════════════════════════════ */}
      <Section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <Target className="h-10 w-10 text-accent" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            O problema nunca foi o volume de declarações.
          </h2>
          <p className="text-2xl text-muted-foreground leading-relaxed">
            É a falta de um sistema que <span className="text-accent font-bold">organize o jogo pra você</span>.
          </p>
          <p className="text-foreground font-bold text-xl">
            IR não é difícil. Difícil é trabalhar no caos.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="mt-4 text-lg px-10 h-14 shadow-xl shadow-primary/25 font-bold uppercase tracking-wide rounded-lg">
              Testar grátis agora <ArrowRight className="h-5 w-5 ml-2" />
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

        <div className="relative py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
              <div className="flex-1 text-center lg:text-left">
                <Badge className="mb-8 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 text-sm px-5 py-2">
                  <Zap className="h-4 w-4 mr-2" /> Conheça o DeclaraIR
                </Badge>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-tight">
                  O sistema que transforma o caos do IR em um{' '}
                  <span className="text-accent">processo previsível e lucrativo</span>.
                </h2>
                <p className="mt-6 text-primary-foreground/70 text-xl leading-relaxed max-w-lg">
                  Você não precisa trabalhar mais. Precisa trabalhar organizado.
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-10 text-lg px-10 h-14 shadow-xl font-bold uppercase tracking-wide rounded-lg">
                    Começar agora <ArrowRight className="h-5 w-5 ml-2" />
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
      <Section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">Transformação</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Veja a diferença com os próprios olhos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-8 space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-display font-bold text-destructive text-xl">ANTES</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.before} className="flex items-center gap-3 text-base">
                  <XCircle className="h-5 w-5 text-destructive/60 shrink-0" />
                  <span className="text-foreground/70">{item.before}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-8 space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <h3 className="font-display font-bold text-success text-xl">DEPOIS</h3>
              </div>
              {beforeAfter.map((item) => (
                <div key={item.after} className="flex items-center gap-3 text-base">
                  <CheckCircle2 className="h-5 w-5 text-success/70 shrink-0" />
                  <span className="text-foreground font-medium">{item.after}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center mt-12 text-xl font-bold text-foreground">
            "Você não trabalha mais. Você trabalha melhor — e <span className="text-accent">fatura mais</span>."
          </p>
          <div className="text-center mt-8">
            <Link to="/cadastro">
              <Button size="lg" className="text-lg px-10 h-14 shadow-xl shadow-primary/25 font-bold uppercase tracking-wide rounded-lg">
                Quero essa transformação <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          6. FUNCIONALIDADES
         ══════════════════════════════════════════════════════ */}
      <Section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">Na prática</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Cada funcionalidade é um problema a menos
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresTranslated.map((f) => (
              <GlassCard key={f.title} className="p-8 group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5 group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground text-xl">{f.title}</h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link to="/cadastro">
              <Button size="lg" className="text-lg px-10 h-14 shadow-xl shadow-primary/25 font-bold uppercase tracking-wide rounded-lg">
                Começar grátis agora <ArrowRight className="h-5 w-5 ml-2" />
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

        <div className="relative py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
            {/* Feature 1 — Dashboard */}
            <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={featureDashboard} alt="Dashboard de gestão de IR" className="w-full h-[360px] lg:h-[420px] object-cover" loading="lazy" width={960} height={640} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                  Pare de adivinhar. Veja o que está travado.
                </h3>
                <p className="mt-5 text-lg text-primary-foreground/70 leading-relaxed">
                  O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto. Sem ligar pro cliente pra perguntar.
                </p>
                <ul className="mt-8 space-y-4">
                  {['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'].map(b => (
                    <li key={b} className="flex items-start gap-3 text-base text-primary-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 2 — Portal */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-14 lg:gap-20">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={featureMobile} alt="Cliente enviando documentos pelo celular" className="w-full h-[360px] lg:h-[420px] object-cover" loading="lazy" width={960} height={640} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                  Seu cliente manda tudo certo. Sem te incomodar.
                </h3>
                <p className="mt-5 text-lg text-primary-foreground/70 leading-relaxed">
                  Chega de "manda de novo", "faltou esse", "mandou no grupo errado". O portal guia o cliente, e você recebe tudo organizado.
                </p>
                <ul className="mt-8 space-y-4">
                  {['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Cliente acompanha o status em tempo real'].map(b => (
                    <li key={b} className="flex items-start gap-3 text-base text-primary-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
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
      <Section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">Quem já usa, não volta</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Resultados reais de contadores reais
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <GlassCard key={t.name} className="p-8 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-base text-foreground leading-relaxed mb-6 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-accent/20" loading="lazy" width={48} height={48} />
                  <div>
                    <p className="font-medium text-foreground text-base">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-20 bg-primary rounded-2xl p-10 sm:p-12 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
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

        <div className="relative py-24 lg:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-5 bg-white/10 text-primary-foreground border-white/20 text-sm px-5 py-2">Sem desculpa</Badge>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground">
                "Mas eu já…" — Calma. Lê isso aqui.
              </h2>
            </div>
            <div className="space-y-5">
              {objections.map((obj) => (
                <div key={obj.objection} className="glass-card-strong rounded-2xl p-7 hover:shadow-xl transition-all hover:scale-[1.01] backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="shrink-0">
                      <span className="inline-block px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-base font-bold">
                        {obj.objection}
                      </span>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{obj.answer}</p>
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
      <Section id="pricing" className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-accent/[0.04] to-primary/[0.03]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-5">
            <Badge className="mb-3 bg-accent/10 text-accent border-accent/20 text-sm px-5 py-2">
              <DollarSign className="h-4 w-4 mr-2" /> Preços
            </Badge>
            <p className="text-muted-foreground text-base max-w-lg mx-auto italic">
              "Um único erro no IR pode custar mais que um ano inteiro do sistema."
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Comece grátis. Escale quando quiser.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
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
      <Section className="py-20 lg:py-24 bg-warning/5 border-y border-warning/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="h-16 w-16 rounded-full bg-warning/15 flex items-center justify-center mx-auto animate-float">
            <Flame className="h-8 w-8 text-warning" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            A temporada de IR não espera.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Quem se organiza antes, <span className="font-bold text-foreground">lucra mais</span>.
            <br />
            Quem deixa pra depois… entra em modo sobrevivência.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-lg px-12 h-14 shadow-xl font-bold uppercase tracking-wide rounded-lg mt-4">
              Começar agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">FAQ</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Perguntas diretas, respostas diretas</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl px-6 border-0">
                <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          11. CTA FINAL
         ══════════════════════════════════════════════════════ */}
      <Section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0">
              <img src={ctaPerson} alt="" className="w-full h-full object-cover" loading="lazy" width={1280} height={640} />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/70" />
            </div>

            <div className="relative p-12 sm:p-20 text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

              <div className="relative">
                <img src={logoHero} alt="DeclaraIR" className="h-20 sm:h-24 mx-auto mb-8 drop-shadow-2xl" />
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-tight">
                  Pare de operar no caos.
                </h2>
                <p className="mt-4 text-primary-foreground/90 max-w-xl mx-auto text-2xl font-medium">
                  Transforme seu IR em um processo simples, previsível e lucrativo.
                </p>
                <p className="mt-8 text-primary-foreground/60 text-base italic">
                  "Você não precisa trabalhar mais. Precisa trabalhar organizado."
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-10 text-lg px-12 h-14 shadow-xl font-bold uppercase tracking-wide rounded-lg">
                    Começar agora <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <p className="mt-4 text-primary-foreground/50 text-sm">
                  Teste grátis • 3 declarações no Pro • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoFull} alt="DeclaraIR" className="h-9" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema que organiza o IR do seu escritório.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-base mb-4">Produto</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-base mb-4">Empresa</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/sobre" className="hover:text-foreground transition-colors">Sobre nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-base mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
                <li><Link to="/politica-lgpd" className="hover:text-foreground transition-colors">LGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Dados protegidos com criptografia
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
