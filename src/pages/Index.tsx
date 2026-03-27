import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, Bell, CheckCircle2,
  ArrowRight, Star, Layout, MessageSquare, Send, Monitor, Smartphone, Lock,
  Clock, Briefcase, TrendingUp, BarChart3, FolderCheck, Receipt, Palette,
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
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';

/* ── Data ── */
const features = [
  { icon: Layout, title: 'Dashboard Kanban', desc: 'Visualize todas as declarações em um quadro intuitivo com drag & drop e KPIs em tempo real.' },
  { icon: Shield, title: 'Malha Fina Gratuita', desc: 'Análise automatizada via BrasilAPI. Evite problemas antes de enviar para a Receita. Incluso em todos os planos.' },
  { icon: Zap, title: 'Calculadora IR Integrada', desc: 'Simule cenários em segundos. Tabela 2026 atualizada. Compare Simplificada vs Completa automaticamente.' },
  { icon: MessageSquare, title: 'Chat em Tempo Real', desc: 'Converse com seus clientes sem sair da plataforma. Integração com WhatsApp disponível como Recurso Extra.' },
  { icon: FileText, title: 'Checklist Inteligente', desc: 'Documentos exigidos gerados automaticamente com base no perfil fiscal do cliente.' },
  { icon: Bell, title: 'Notificações Automáticas', desc: 'Emails e alertas disparados automaticamente a cada mudança de status da declaração.' },
];



const faqs = [
  { q: 'Preciso de cartão de crédito para começar?', a: 'Não! O plano Free é totalmente gratuito e não exige cartão de crédito. Você pode testar a plataforma completa com até 3 declarações ativas.' },
  { q: 'Como funciona a malha fina gratuita?', a: 'Nossa malha fina usa a BrasilAPI para validar CPFs, cruzar dados e identificar inconsistências antes de enviar para a Receita. Funciona em todos os planos, inclusive Free.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'O Free permite 3 declarações, 1 usuário e 5GB. O Pro (R$ 49,90/mês) oferece declarações ilimitadas, até 5 usuários, storage ilimitado e acesso a Recursos Extras como WhatsApp, Portal do Cliente, API e Whitelabel.' },
  { q: 'O que são Recursos Extras?', a: 'São módulos opcionais que você ativa conforme sua necessidade: WhatsApp (R$ 19,90/mês), Portal do Cliente (R$ 14,90/mês), API Pública (R$ 29,90/mês), Whitelabel (R$ 9,90/mês) e Usuário Extra (R$ 9,90/mês).' },
  { q: 'Meus clientes precisam instalar algum aplicativo?', a: 'Não. O Portal do Cliente é 100% web, acessível pelo navegador do celular ou computador. Basta enviar o link de convite.' },
  { q: 'Os dados dos meus clientes estão seguros?', a: 'Sim. Utilizamos criptografia de ponta a ponta, isolamento por escritório (multi-tenant) e políticas de acesso em nível de linha (RLS) em todas as tabelas.' },
  { q: 'Posso comprar declarações avulsas no plano Free?', a: 'Sim! Você pode adquirir declarações extras por R$ 9,90 cada, sem precisar fazer upgrade de plano.' },
  { q: 'O monitoramento de malha fina é automático?', a: 'Sim. Após a transmissão, o sistema consulta periodicamente o status na Receita Federal e alerta caso alguma declaração entre em malha.' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. Todos os planos são mensais e você pode cancelar a qualquer momento sem multa.' },
  { q: 'Como funciona o Whitelabel?', a: 'Disponível como Recurso Extra (R$ 9,90/mês), permite personalizar cores, logo e nome do portal. Seus clientes acessam um portal com a identidade visual do seu escritório.' },
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
                <Zap className="h-3.5 w-3.5 mr-1.5 text-accent" /> 🎉 Teste grátis com 3 declarações completas
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight">
                Simplifique o IR do seu{' '}
                <span className="relative">
                  <span className="text-accent">Escritório Contábil</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5Q50 1 100 4T199 3" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Plataforma completa para gestão de Imposto de Renda.
                Malha fina gratuita, calculadora integrada, chat com clientes
                e muito mais. Comece grátis hoje.
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
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Sem cartão de crédito
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 3 declarações grátis
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

      {/* ── BENEFIT SHOWCASES — Rich visual feature sections ── */}
      <Section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute top-[-50%] left-[20%] w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50%] right-[10%] w-72 h-72 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 text-xs">
              Por que o DeclaraIR?
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
              Cada detalhe pensado para{' '}
              <span className="text-accent">você produzir mais</span>
            </h2>
          </div>

          {/* Feature 1 — Dashboard */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20">
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={featureDashboard} alt="Contadora usando dashboard" className="w-full h-[360px] lg:h-[400px] object-cover" loading="lazy" width={960} height={640} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
              </div>
              {/* Floating card */}
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
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">Dashboard inteligente com KPIs em tempo real</h3>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                Visualize a operação inteira em um único quadro Kanban. Acompanhe prazos, identifique gargalos e tome decisões baseadas em dados reais.
              </p>
              <ul className="mt-6 space-y-3">
                {['KPIs atualizados automaticamente', 'Filtro por contador, status e urgência', 'Drag & drop entre etapas da declaração'].map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 — Mobile / Portal */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16 mb-20">
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
              <div className="absolute bottom-10 right-4 glass-card-strong rounded-xl mockup-shadow animate-float-delayed p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">-85%</p>
                    <p className="text-[9px] text-muted-foreground">tempo de coleta</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">Seu cliente envia tudo pelo celular</h3>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                Chega de WhatsApp e e-mail para pedir documentos. O portal do cliente é 100% mobile, guiado e com checklist inteligente.
              </p>
              <ul className="mt-6 space-y-3">
                {['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Notificações automáticas de pendência'].map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 — Team / Whitelabel */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={featureTeam} alt="Equipe de contadores colaborando" className="w-full h-[360px] lg:h-[400px] object-cover" loading="lazy" width={960} height={640} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
              </div>
              <div className="absolute top-5 right-4 glass-card-strong rounded-xl mockup-shadow animate-float p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">100%</p>
                    <p className="text-[9px] text-muted-foreground">sua marca</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 left-4 glass-card-strong rounded-xl mockup-shadow animate-float-delayed p-3 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">Pix/Boleto</p>
                    <p className="text-[9px] text-muted-foreground">cobranças integradas</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">Whitelabel + cobranças em um só lugar</h3>
              <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                Personalize o portal com sua marca, gere cobranças via Pix e boleto e gerencie a equipe inteira com permissões granulares.
              </p>
              <ul className="mt-6 space-y-3">
                {['Portal com logo, cores e nome do escritório', 'Cobranças via Pix e boleto integradas', 'Gestão de equipe com papéis e permissões'].map(b => (
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
         <div className="text-center">
            <Badge variant="secondary" className="mb-4 text-xs">Planos</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Comece grátis, escale com o Pro
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Apenas 2 planos: Free com 3 declarações ou Pro ilimitado por R$ 49,90/mês.
              Adicione Recursos Extras conforme sua necessidade.
            </p>
          </div>
          <PlanosCardsPublic />
          <TabelaAvulso />
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
                  Pronto para modernizar seu escritório?
                </h2>
                <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto text-lg">
                  Junte-se a mais de 500 escritórios que já simplificaram a gestão de IR com DeclaraIR. Comece grátis em 30 segundos.
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
