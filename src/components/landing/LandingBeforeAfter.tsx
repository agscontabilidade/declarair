import { Badge } from '@/components/ui/badge';
import { XCircle, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import { beforeAfter } from './LandingData';

export const LandingBeforeAfter = () => (
  <Section className="py-20 lg:py-28 bg-background/50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium bg-accent/10 text-accent border-accent/20">Estudo de Caso</Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          A transformação real de um escritório
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Veja como a <span className="text-foreground font-bold">Mendes Contabilidade</span> saiu do caos manual para a escala automática em apenas 1 temporada.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-2xl border border-destructive/20 bg-card p-8 space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <XCircle className="h-20 w-20 text-destructive" />
          </div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="font-display font-bold text-destructive text-xl tracking-tight">Cenário Arcaico</h3>
          </div>
          <div className="space-y-4 relative">
            {beforeAfter.map((item) => (
              <div key={item.before} className="flex items-start gap-3 text-sm">
                <XCircle className="h-4 w-4 text-destructive/40 shrink-0 mt-0.5" />
                <span className="text-muted-foreground/80 italic line-through">{item.before}</span>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-destructive/10">
            <p className="text-xs font-medium text-destructive/60 uppercase tracking-widest">Resultado: Perda de 40% do tempo</p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-accent/30 bg-card p-8 space-y-4 relative overflow-hidden group shadow-xl shadow-accent/5">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-20 w-20 text-accent" />
          </div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-display font-bold text-accent text-xl tracking-tight">Com DeclaraIR</h3>
          </div>
          <div className="space-y-4 relative">
            {beforeAfter.map((item) => (
              <div key={item.after} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-foreground font-semibold">{item.after}</span>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-accent/20">
            <p className="text-xs font-bold text-accent uppercase tracking-widest">Ganhos: +120 horas livres / mês</p>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="flex-1 space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
          </div>
          <blockquote className="text-xl font-display font-medium text-foreground italic leading-relaxed">
            "O ganho de tempo foi brutal. O que levava 3 dias de organização manual agora é resolvido em minutos pelo WhatsApp automático e Drive organizado. Consegui faturar 50% mais sem suar."
          </blockquote>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden border-2 border-accent/20">
               <img src="https://i.pravatar.cc/150?u=mendes" alt="Roberto Mendes" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-foreground">Roberto Mendes</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sócio-Fundador da Mendes Contabilidade</p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto text-center">
          <Link to="/cadastro">
            <Button size="lg" variant="gradient" className="text-base px-10 h-14 font-bold uppercase tracking-wide group">
              Quero esse resultado <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">Junte-se a +500 escritórios lucrativos</p>
        </div>
      </div>
    </div>
  </Section>
);
