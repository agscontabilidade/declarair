import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, Bell, CheckCircle2,
  ArrowRight, Star, Layout, MessageSquare, Send, Monitor, Smartphone, Lock,
  Clock, Briefcase, TrendingUp,
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import logoHero from '@/assets/logo-hero.png';
import ctaPerson from '@/assets/cta-person.jpg';
import avatarCarlos from '@/assets/avatar-carlos.jpg';
import avatarAna from '@/assets/avatar-ana.jpg';
import avatarRoberto from '@/assets/avatar-roberto.jpg';
import HeroMockup from '@/components/landing/HeroMockup';
import GlassCard from '@/components/landing/GlassCard';
import MetricCounter from '@/components/landing/MetricCounter';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ── Data ── */
const features = [
  { icon: Layout, title: 'Dashboard Kanban', desc: 'Visualize todas as declarações em um quadro intuitivo com drag & drop e KPIs em tempo real.' },
  { icon: FileText, title: 'Checklist Inteligente', desc: 'Documentos exigidos gerados automaticamente com base no perfil fiscal do cliente.' },
  { icon: Zap, title: 'Cálculo Automático IR', desc: 'Compare Simplificada vs Completa com tabela 2026 atualizada e recomendação automática.' },
  { icon: Shield, title: 'Monitoramento Malha Fina', desc: 'Acompanhe o status de cada declaração na Receita Federal com alertas automáticos.' },
  { icon: MessageSquare, title: 'Chat Integrado', desc: 'Comunicação em tempo real com o cliente, direto na declaração. Sem WhatsApp paralelo.' },
  { icon: Bell, title: 'Notificações Automáticas', desc: 'Emails e alertas disparados automaticamente a cada mudança de status.' },
];

const metrics = [
  { value: '85', suffix: '%', label: 'Redução no tempo de coleta de documentos' },
  { value: '3', suffix: 'x', label: 'Mais declarações processadas por contador' },
  { value: '0', suffix: '', label: 'Declarações perdidas em malha fina sem aviso' },
  { value: '100', suffix: '%', label: 'Whitelabel — sua marca, seu portal' },
];

const plans = [
  { name: 'Gratuito', price: 'R$ 0', period: '/mês', declaracoes: '10', usuarios: '1', features: ['Dashboard Kanban', 'Portal do Cliente', 'Checklist Dinâmico'], cta: 'Começar Grátis', popular: false },
  { name: 'Starter', price: 'R$ 97', period: '/mês', declaracoes: '50', usuarios: '2', features: ['Tudo do Gratuito', 'Chat Integrado', 'Cobranças via Pix/Boleto', 'Templates de Email'], cta: 'Assinar Starter', popular: false },
  { name: 'Profissional', price: 'R$ 197', period: '/mês', declaracoes: '200', usuarios: '5', features: ['Tudo do Starter', 'Whitelabel Completo', 'Malha Fina', 'Relatório PDF', 'Drive do Contador'], cta: 'Assinar Profissional', popular: true },
  { name: 'Enterprise', price: 'R$ 397', period: '/mês', declaracoes: 'Ilimitadas', usuarios: 'Ilimitados', features: ['Tudo do Profissional', 'API Personalizada', 'Suporte Prioritário', 'Multi-escritório'], cta: 'Falar com Vendas', popular: false },
];

const faqs = [
  { q: 'O DeclaraIR substitui meu sistema contábil?', a: 'Não. O DeclaraIR é focado exclusivamente na gestão de declarações de IRPF. Ele complementa seu sistema contábil, cuidando do fluxo de documentos, comunicação com clientes e acompanhamento de cada declaração.' },
  { q: 'Meus clientes precisam instalar algum aplicativo?', a: 'Não. O Portal do Cliente é 100% web, acessível pelo navegador do celular ou computador. Basta enviar o link de convite.' },
  { q: 'Como funciona o Whitelabel?', a: 'Você personaliza cores, logo e nome do portal. Seus clientes acessam um portal com a identidade visual do seu escritório, sem ver a marca DeclaraIR.' },
  { q: 'Os dados dos meus clientes estão seguros?', a: 'Sim. Utilizamos criptografia de ponta a ponta, isolamento por escritório (multi-tenant) e políticas de acesso em nível de linha (RLS) em todas as tabelas.' },
  { q: 'Posso migrar do plano gratuito para o pago?', a: 'Sim, a qualquer momento. Seus dados são preservados e o upgrade é imediato.' },
  { q: 'O que acontece se eu ultrapassar o limite de declarações?', a: 'Você pode comprar declarações avulsas a partir de R$ 4,90 cada, ou fazer upgrade de plano.' },
  { q: 'O monitoramento de malha fina é automático?', a: 'Sim. Após a transmissão, o sistema consulta periodicamente o status na Receita Federal e alerta caso alguma declaração entre em malha.' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. Todos os planos são mensais e você pode cancelar a qualquer momento sem multa.' },
];

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi de 3 dias para 4 horas o tempo de coleta de documentos por cliente. O checklist inteligente é genial.', stars: 5, avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'O portal whitelabel deu outra cara pro meu escritório. Meus clientes acham que é um sistema próprio.', stars: 5, avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'O monitoramento de malha fina me salvou de uma dor de cabeça enorme. Fui alertado antes do cliente.', stars: 5, avatar: avatarRoberto },
];

/* ── Showcase Mockups ── */
function KanbanMockup() {
  const cols = [
    { title: 'Aguardando Docs', color: 'bg-warning', items: ['Ana Paula C.', 'José M.'] },
    { title: 'Doc. Recebida', color: 'bg-accent', items: ['Maria S.'] },
    { title: 'Pronta', color: 'bg-success', items: ['Carlos R.', 'Fernanda L.'] },
  ];
  return (
    <div className="glass-card rounded-2xl mockup-shadow overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium ml-2">Kanban — Declarações</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {cols.map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${col.color}`} />
              <span className="text-[9px] font-semibold text-foreground">{col.title}</span>
            </div>
            {col.items.map((item) => (
              <div key={item} className="bg-background/70 rounded-md p-2">
                <p className="text-[9px] font-medium text-foreground">{item}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">IRPF 2025</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PortalMockup() {
  return (
    <div className="glass-card rounded-2xl mockup-shadow overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium ml-2">Portal do Cliente</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="bg-background/70 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-foreground mb-2">Sua Declaração IRPF 2025</p>
          <div className="flex items-center gap-1">
            {['Docs', 'Recebido', 'Pronta', 'Enviada'].map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i <= 1 ? 'bg-accent' : 'bg-muted'} mb-0.5`} />
                <span className="text-[7px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-background/70 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-semibold text-foreground">Documentos pendentes</p>
          {['Informe de Rendimentos', 'Comprovante de Residência'].map((doc) => (
            <div key={doc} className="flex items-center justify-between">
              <span className="text-[9px] text-foreground">{doc}</span>
              <span className="text-[8px] text-warning font-medium">Pendente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      {/* ── HEADER (glassmorphism) ── */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-lg shadow-accent/20">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-success/5 blur-3xl animate-blob" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none">
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5 glass-card border-accent/20">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-accent" /> Temporada IRPF 2026
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight">
                Gerencie declarações{' '}
                <span className="relative">
                  <span className="text-accent">IRPF</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5Q50 1 100 4T199 3" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                como nunca antes
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Plataforma completa para escritórios de contabilidade: do checklist inteligente à transmissão, com portal do cliente whitelabel e monitoramento de malha fina.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 lg:justify-start justify-center">
                <Link to="/cadastro">
                  <Button size="lg" className="text-base px-8 h-12 shadow-xl shadow-primary/20">
                    Começar Grátis <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button variant="outline" size="lg" className="text-base px-8 h-12 glass-card">
                    Ver como funciona
                  </Button>
                </a>
              </div>
              {/* Trust badges */}
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5" /> Dados criptografados
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Monitor className="h-3.5 w-3.5" /> 100% Web
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Smartphone className="h-3.5 w-3.5" /> Responsivo
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

      {/* ── SOCIAL PROOF BAR ── */}
      <Section className="border-y bg-gradient-to-r from-primary/[0.03] to-accent/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wider mb-6">
            Utilizado por escritórios de contabilidade em todo o Brasil
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-accent">{m.value}{m.suffix}</p>
                <p className="mt-2 text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-4 text-xs">Como funciona</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Do documento à transmissão,{' '}
              <span className="text-accent">tudo em um só lugar</span>
            </h2>
          </div>

          <FeatureShowcase
            title="Organize todas as declarações visualmente"
            description="Visualize cada declaração como um card em um board Kanban. Arraste entre colunas, filtre por status e nunca perca prazos."
            bullets={[
              'Drag & drop entre status',
              'KPIs em tempo real no topo',
              'Filtro por contador responsável',
              'Cores por urgência e prazo',
            ]}
            mockup={<KanbanMockup />}
          />

          <FeatureShowcase
            title="Seu cliente envia tudo pelo portal"
            description="Cada cliente acessa um portal personalizado com a sua marca, envia documentos, preenche o formulário e acompanha o status em tempo real."
            bullets={[
              'Portal 100% whitelabel',
              'Upload de documentos com checklist',
              'Formulário guiado de IRPF',
              'Acompanhamento por etapas',
            ]}
            mockup={<PortalMockup />}
            reversed
          />
        </div>
      </section>

      {/* ── DEIXE A BUROCRACIA CONOSCO — Split Section ── */}
      <Section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30">
                <Briefcase className="h-3 w-3 mr-1.5" /> Foque no que importa
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
                Deixe a burocracia{' '}
                <span className="text-accent">conosco</span>
              </h2>
              <p className="mt-5 text-primary-foreground/70 text-lg leading-relaxed max-w-md">
                Enquanto o DeclaraIR cuida do fluxo de documentos, cobranças e comunicação, você se concentra em entregar o melhor serviço aos seus clientes.
              </p>
              <Link to="/cadastro">
                <Button size="lg" variant="secondary" className="mt-8 text-base px-8 h-12 shadow-xl">
                  Experimentar Grátis <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Right — Person with floating cards */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src={ctaPerson}
                  alt="Profissional usando celular"
                  className="w-full h-[400px] lg:h-[460px] object-cover object-top"
                  loading="lazy"
                  width={1280}
                  height={640}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
              </div>

              {/* Floating benefit cards */}
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

      {/* ── FEATURES GRID ── */}
      <Section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Funcionalidades</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Tudo que seu escritório precisa
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Cada funcionalidade foi pensada para eliminar gargalos reais da temporada de IRPF.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
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

      {/* ── METRICS ── */}
      <Section className="py-20 bg-gradient-to-br from-primary to-primary/90 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="font-display text-3xl font-bold text-primary-foreground text-center mb-14">
            Resultados que falam por si
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m) => (
              <MetricCounter key={m.label} end={m.value} suffix={m.suffix} label={m.label} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Depoimentos</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">O que nossos usuários dizem</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <GlassCard key={t.name} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/20"
                    loading="lazy"
                    width={40}
                    height={40}
                  />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section id="pricing" className="py-20 lg:py-28 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Planos</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Planos para cada tamanho de escritório</h2>
            <p className="mt-4 text-muted-foreground">Comece grátis. Escale quando precisar.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <GlassCard
                key={p.name}
                strong={p.popular}
                className={`relative p-6 pt-8 hover:shadow-xl transition-shadow ${
                  p.popular ? 'ring-2 ring-accent/30 shadow-lg' : ''
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground shadow-lg">Mais popular</Badge>
                  </div>
                )}
                <h3 className="font-display font-bold text-foreground text-lg">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <p>{p.declaracoes} declarações</p>
                  <p>{p.usuarios} usuário(s)</p>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/cadastro" className="block mt-6">
                  <Button className="w-full" variant={p.popular ? 'default' : 'outline'}>{p.cta}</Button>
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">FAQ</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground">Perguntas Frequentes</h2>
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

      {/* ── CTA FINAL ── */}
      <Section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={ctaPerson}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                width={1280}
                height={640}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/70" />
            </div>

            <div className="relative p-10 sm:p-16 text-center">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

              <div className="relative">
                <img src={logoHero} alt="DeclaraIR" className="h-16 sm:h-20 mx-auto mb-6 drop-shadow-2xl" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                  Pronto para transformar sua temporada de IRPF?
                </h2>
                <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto text-lg">
                  Crie sua conta gratuita em 30 segundos. Sem cartão de crédito.
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-8 text-base px-10 h-13 shadow-xl">
                    Começar Agora <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
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
                A plataforma completa para gestão de declarações IRPF.
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
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
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
