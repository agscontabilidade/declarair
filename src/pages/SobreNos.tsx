import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target, Users, Shield, Zap, Heart, Lock } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import logoHero from '@/assets/logo-hero.png';
import GlassCard from '@/components/landing/GlassCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return <section ref={ref} className={`scroll-reveal ${className}`}>{children}</section>;
}

const valores = [
  { icon: Target, title: 'Foco no contador', desc: 'Cada funcionalidade é pensada para resolver problemas reais de quem vive o dia a dia do IR.' },
  { icon: Zap, title: 'Simplicidade radical', desc: 'Tecnologia complexa por trás, experiência simples na frente. Sem curva de aprendizado.' },
  { icon: Shield, title: 'Segurança inegociável', desc: 'Dados fiscais exigem proteção máxima. Criptografia, isolamento e conformidade LGPD.' },
  { icon: Heart, title: 'Empatia com o processo', desc: 'Sabemos que temporada de IR é estressante. Nosso trabalho é reduzir esse peso.' },
];

export default function SobreNos() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="lg" className="text-base">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="lg" className="shadow-lg shadow-accent/20 text-base rounded-lg px-6">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-accent/10 text-accent border-accent/20 text-sm px-5 py-2">
            <Users className="h-4 w-4 mr-2" /> Sobre nós
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
            Nascemos de uma dor <span className="text-accent">que todo contador conhece</span>.
          </h1>
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Cansamos de ver escritórios contábeis desperdiçando talento em processos manuais, 
            perdendo tempo com organização e brigando com WhatsApp na temporada de IR.
          </p>
        </div>
      </section>

      {/* Missão */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">Nossa missão</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Devolver ao contador o que é dele: <span className="text-accent">tempo e lucro</span>.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                O DeclaraIR existe para transformar o caos da temporada de IR em um processo 
                organizado, previsível e escalável. Para que o contador pare de ser operacional 
                e volte a ser estratégico.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Acreditamos que tecnologia bem feita não complica — simplifica. Não substitui o 
                contador — potencializa.
              </p>
            </div>
            <div className="relative">
              <div className="glass-card-strong rounded-2xl p-10 text-center">
                <img src={logoHero} alt="DeclaraIR" className="h-24 mx-auto mb-6" />
                <p className="text-2xl font-display font-bold text-foreground">
                  +500 escritórios
                </p>
                <p className="text-muted-foreground mt-1">já organizaram seu IR conosco</p>
              </div>
              <div className="absolute -top-4 -right-4 glass-card-strong rounded-xl mockup-shadow animate-float p-3 z-10">
                <p className="font-display font-bold text-accent text-lg">98%</p>
                <p className="text-xs text-muted-foreground">satisfação</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Valores */}
      <Section className="py-20 lg:py-28 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-sm px-5 py-2">Nossos valores</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              O que guia cada decisão que tomamos
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {valores.map((v) => (
              <GlassCard key={v.title} className="p-8 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5">
                  <v.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground text-xl">{v.title}</h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">{v.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Pronto para organizar seu IR?
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece grátis, sem cartão, sem compromisso.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-lg px-12 h-14 shadow-xl font-bold uppercase tracking-wide rounded-lg">
              Começar agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Dados protegidos com criptografia
          </div>
        </div>
      </footer>
    </div>
  );
}
