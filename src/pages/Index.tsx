import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText, Shield, Zap, Users, BarChart3, Bell, CheckCircle2,
  ArrowRight, Star, ChevronRight, Layout, MessageSquare, Clock,
} from 'lucide-react';

const features = [
  { icon: Layout, title: 'Dashboard Kanban', desc: 'Visualize todas as declarações em um quadro intuitivo com drag & drop e KPIs em tempo real.' },
  { icon: FileText, title: 'Checklist Inteligente', desc: 'Documentos exigidos gerados automaticamente com base no perfil fiscal do cliente.' },
  { icon: Zap, title: 'Cálculo Automático IR', desc: 'Compare Simplificada vs Completa com tabela 2026 atualizada e recomendação automática.' },
  { icon: Shield, title: 'Monitoramento Malha Fina', desc: 'Acompanhe o status de cada declaração na Receita Federal com alertas automáticos.' },
  { icon: MessageSquare, title: 'Chat Integrado', desc: 'Comunicação em tempo real com o cliente, direto na declaração. Sem WhatsApp paralelo.' },
  { icon: Bell, title: 'Notificações Automáticas', desc: 'Emails e alertas disparados automaticamente a cada mudança de status.' },
];

const metrics = [
  { value: '85%', label: 'Redução no tempo de coleta de documentos' },
  { value: '3x', label: 'Mais declarações processadas por contador' },
  { value: '0', label: 'Declarações perdidas em malha fina sem aviso' },
  { value: '100%', label: 'Whitelabel — sua marca, seu portal' },
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
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi de 3 dias para 4 horas o tempo de coleta de documentos por cliente. O checklist inteligente é genial.', stars: 5 },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'O portal whitelabel deu outra cara pro meu escritório. Meus clientes acham que é um sistema próprio.', stars: 5 },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'O monitoramento de malha fina me salvou de uma dor de cabeça enorme. Fui alertado antes do cliente.', stars: 5 },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">DI</div>
            <span className="font-display text-xl font-bold text-foreground">DeclaraIR</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 mr-1.5" /> Temporada IRPF 2026
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Gerencie declarações IRPF como{' '}
              <span className="text-accent">nunca antes</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para escritórios de contabilidade: do checklist inteligente à transmissão, com portal do cliente whitelabel e monitoramento de malha fina.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/cadastro">
                <Button size="lg" className="text-base px-8 h-12">
                  Começar Grátis <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  Ver Funcionalidades
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-accent">{m.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground">Tudo que seu escritório precisa</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Cada funcionalidade foi pensada para eliminar gargalos reais da temporada de IRPF.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">O que nossos usuários dizem</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground">Planos para cada tamanho de escritório</h2>
            <p className="mt-4 text-muted-foreground">Comece grátis. Escale quando precisar.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <Card key={p.name} className={`relative ${p.popular ? 'border-accent shadow-lg ring-2 ring-accent/20' : 'border-border/50'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground">Mais popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
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
                  <Link to="/login" className="block mt-6">
                    <Button className="w-full" variant={p.popular ? 'default' : 'outline'}>{p.cta}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-card border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">Perguntas Frequentes</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl p-10 sm:p-14 text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground">Pronto para transformar sua temporada de IRPF?</h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">Crie sua conta gratuita em 30 segundos. Sem cartão de crédito.</p>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="mt-8 text-base px-8 h-12">
                Começar Agora <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-accent flex items-center justify-center text-accent-foreground text-[10px] font-bold">DI</div>
              <span className="font-display text-sm font-bold text-foreground">DeclaraIR</span>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
