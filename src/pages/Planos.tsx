import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ArrowRight, Zap, Crown, Lock } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return <section ref={ref} className={`scroll-reveal ${className}`}>{children}</section>;
}

export default function Planos() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <Link to="/#como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
            <Link to="/#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
            <Link to="/planos" className="text-foreground font-semibold">Preços</Link>
            <Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-lg shadow-accent/20">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main>
        {/* Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed pointer-events-none" />

        {/* Hero */}
        <Section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-6xl mx-auto text-center space-y-6">
            <div className="inline-block">
             <span className="bg-accent/10 text-accent text-sm font-medium px-4 py-1.5 rounded-full">
                🎉 Teste grátis com 1 declaração
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display">
              Simplifique seu IR com
              <span className="text-accent block mt-2">Planos que crescem com você</span>
            </h1>

             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis com 1 declaração. Desbloqueie o sistema completo por apenas R$ 29,90/mês.
              Sem cartão de crédito. Sem pegadinhas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/cadastro">
                <Button size="lg" className="text-lg px-8 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/#como-funciona">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✓ Sem cartão de crédito  ✓ 1 declaração grátis  ✓ Pro por R$ 29,90/mês
            </p>
          </div>
        </Section>

        {/* Comparação de Planos */}
        <Section className="py-20 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                Escolha seu plano
              </h2>
              <p className="text-xl text-muted-foreground">
                2 opções simples. Recursos extras sob demanda.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* FREE */}
              <Card className="p-8 relative shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="space-y-6">
                  <div>
                    <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-muted-foreground" />
                    </div>
                     <h3 className="text-2xl font-bold font-display">Free</h3>
                    <p className="text-muted-foreground mt-2">
                      Para conhecer a plataforma
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">R$ 0</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <Link to="/cadastro" className="block">
                    <Button className="w-full" variant="outline" size="lg">
                      Começar Grátis
                    </Button>
                  </Link>

                  <div className="space-y-3 pt-4 border-t">
                     {[
                      { bold: true, text: '1 declaração ativa', extra: '' },
                      { bold: false, text: '500 MB de armazenamento' },
                      { bold: false, text: 'Chat com clientes' },
                      { bold: false, text: 'Kanban de declarações' },
                      { bold: false, text: 'Suporte por chat' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {item.bold ? <strong>{item.text}</strong> : item.text}
                          {item.extra}
                        </span>
                      </div>
                    ))}
                  </div>

                   <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      💡 Faça upgrade para desbloquear malha fina, calculadora IR e mais
                    </p>
                  </div>
                </div>
              </Card>

              {/* PRO */}
              <Card className="p-8 relative ring-2 ring-accent shadow-xl scale-[1.02]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs font-medium px-4 py-1 rounded-full">
                    Mais escolhido
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="h-12 w-12 bg-accent/15 rounded-xl flex items-center justify-center mb-4">
                      <Crown className="h-6 w-6 text-accent" />
                    </div>
                     <h3 className="text-2xl font-bold font-display">Pro</h3>
                    <p className="text-muted-foreground mt-2">
                      Sistema completo para seu escritório
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-bold">R$ 29,90</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <Link to="/cadastro" className="block">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                      Começar Agora
                    </Button>
                  </Link>

                  <div className="space-y-3 pt-4 border-t">
                    {[
                      { bold: true, text: 'Declarações ILIMITADAS', extra: ' ✨' },
                      { bold: false, text: 'Até 5 usuários simultâneos' },
                      { bold: false, text: 'Storage ilimitado' },
                      { bold: false, text: 'Tudo do Free incluído' },
                      { bold: false, text: 'Suporte prioritário' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {item.bold ? <strong>{item.text}</strong> : item.text}
                          {item.extra}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                     <p className="text-sm text-muted-foreground">
                      💡 Usuários extras: <strong>R$ 9,90/usuário</strong> (6º+)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Section>

        {/* Addons */}
        <Section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                Recursos Adicionais
              </h2>
              <p className="text-xl text-muted-foreground">
                Ative apenas o que você precisa. Pague somente por isso.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { emoji: '💬', nome: 'WhatsApp', desc: 'Mensagens automáticas', preco: '19,90' },
                { emoji: '👤', nome: 'Portal Cliente', desc: 'Área exclusiva', preco: '14,90' },
                { emoji: '🔌', nome: 'API Pública', desc: 'Integrações', preco: '29,90' },
                { emoji: '🎨', nome: 'Whitelabel', desc: 'Sua marca', preco: '9,90' },
              ].map((addon) => (
                <Card key={addon.nome} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="text-center space-y-3">
                    <div className="h-10 w-10 mx-auto bg-accent/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{addon.emoji}</span>
                    </div>
                    <h3 className="font-semibold">{addon.nome}</h3>
                    <p className="text-sm text-muted-foreground">{addon.desc}</p>
                    <p className="text-2xl font-bold">R$ {addon.preco}</p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        {/* Comparação Detalhada */}
        <Section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-display">
                Comparação Detalhada
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-4 px-4 font-semibold">Recurso</th>
                    <th className="text-center py-4 px-4 font-semibold">Free</th>
                    <th className="text-center py-4 px-4 bg-accent/5 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { recurso: 'Declarações ativas', free: '3 CPFs', pro: 'Ilimitadas ✨' },
                    { recurso: 'Usuários simultâneos', free: '1', pro: '5' },
                    { recurso: 'Storage', free: '5 GB', pro: 'Ilimitado' },
                    { recurso: 'Malha fina', free: '✓', pro: '✓' },
                    { recurso: 'Calculadora IR', free: '✓', pro: '✓' },
                    { recurso: 'Chat clientes', free: '✓', pro: '✓' },
                    { recurso: 'Suporte', free: 'Email', pro: 'Prioritário' },
                    { recurso: 'Declarações extras', free: 'R$ 9,90/cada', pro: 'Inclusas' },
                  ].map((row) => (
                    <tr key={row.recurso}>
                      <td className="py-3 px-4 font-medium text-sm">{row.recurso}</td>
                      <td className="text-center py-3 px-4 text-sm">{row.free}</td>
                      <td className="text-center py-3 px-4 bg-accent/5 text-sm font-medium">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* CTA Final */}
        <Section className="py-20 px-4 bg-accent text-accent-foreground">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-display">
              Pronto para simplificar seu IR?
            </h2>
            <p className="text-xl opacity-90">
              Comece grátis agora. Sem cartão de crédito.
            </p>
            <Link to="/cadastro">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg">
                Começar Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Section>
      </main>

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
                <li><Link to="/#features" className="hover:text-foreground transition-colors">Funcionalidades</Link></li>
                <li><Link to="/planos" className="hover:text-foreground transition-colors">Preços</Link></li>
                <li><Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
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
