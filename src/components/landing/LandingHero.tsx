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
            <Badge variant="outline" className="mb-2 text-xs px-4 py-1.5 font-medium border-destructive/30 text-destructive bg-destructive/5 rounded-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Flame className="h-3.5 w-3.5 mr-1.5" /> A temporada de IR não espera
            </Badge>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-bold text-foreground leading-[1.05] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              O problema não é o IRPF.
              <br />
              <span className="bg-gradient-to-r from-accent to-[hsl(170,60%,50%)] bg-clip-text text-transparent">É o seu processo arcaico!</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-md animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              Elimine o caos do WhatsApp, automatize a coleta de documentos e entregue declarações em <span className="text-foreground font-bold border-b-2 border-accent/30">metade do tempo</span>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              <Link to="/cadastro">
                <Button size="lg" variant="gradient" className="text-base px-8 h-12 font-bold uppercase tracking-wide">
                  Quero organizar meu IR agora <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#solucao">
                <Button size="lg" variant="outline" className="text-base px-6 h-12 font-semibold">
                  Ver como funciona
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center lg:justify-start justify-center gap-x-5 gap-y-2 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
              {['Plano Free disponível', 'Começa em 2 minutos', 'Cancele quando quiser'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
            <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
              <img
                src={heroStressed}
                alt="Contador estressado com papéis de IRPF"
                className="w-full h-auto object-cover"
                width={1024}
                height={1024}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
