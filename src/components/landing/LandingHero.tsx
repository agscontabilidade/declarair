import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Flame, CheckCircle2 } from 'lucide-react';
import heroStressed from '@/assets/hero-stressed-person.jpg';

export function LandingHero() {
  return (
    <section className="relative dot-grid bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 lg:pt-28 lg:pb-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <Badge variant="outline" className="mb-2 text-xs px-4 py-1.5 font-medium border-accent/30 text-accent bg-accent/5 rounded-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Flame className="h-3.5 w-3.5 mr-1.5" /> A solução definitiva para o seu IRPF
            </Badge>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-bold text-foreground leading-[1.05] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              Dobre sua produtividade no IRPF{' '}
              <br />
              <span className="bg-gradient-to-r from-accent to-[hsl(170,60%,50%)] bg-clip-text text-transparent">sem contratar ninguém.</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              Elimine o caos do WhatsApp, automatize a coleta de documentos e organize seu Drive sozinho. O DeclaraIR faz o trabalho pesado para você focar no que importa: <span className="text-foreground font-bold border-b-2 border-accent/30">lucrar mais</span>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-4 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button size="lg" variant="gradient" className="w-full text-base px-10 h-14 font-bold uppercase tracking-wide shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
                  Cadastrar Grátis Agora <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#precos" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base px-8 h-14 font-semibold hover:bg-secondary/50 transition-colors">
                  Ver Planos e Preços
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center lg:justify-start justify-center gap-x-6 gap-y-3 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
              {[
                { label: 'Garantia de Organização', icon: CheckCircle2 },
                { label: '100% focado em IRPF', icon: CheckCircle2 },
                { label: 'Comece em 2 minutos', icon: CheckCircle2 }
              ].map(t => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs font-medium">
                  <t.icon className="h-4 w-4 text-success" /> {t.label}
                </div>
              ))}
            </div>

            {/* Social Proof Summary */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-bold">500+ contadores</span> já estão escalando hoje.
              </p>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-xl animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                <img
                  src={heroStressed}
                  alt="Gestão de IRPF automatizada"
                  className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                  width={1024}
                  height={1024}
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-background/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-success animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground italic">"Antes eu perdia 3 dias organizando. Agora leva 15 minutos."</p>
                      <p className="text-[10px] text-muted-foreground">— Carlos S., Contador em SP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
