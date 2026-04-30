import { Badge } from '@/components/ui/badge';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import { beforeAfter } from './LandingData';

export const LandingBeforeAfter = () => (
  <Section className="py-20 lg:py-28">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium">Transformação</Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Veja a diferença com os próprios olhos
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <h3 className="font-display font-bold text-destructive">ANTES</h3>
          </div>
          {beforeAfter.map((item) => (
            <div key={item.before} className="flex items-center gap-2.5 text-sm">
              <XCircle className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
              <span className="text-muted-foreground">{item.before}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-success/20 bg-success/5 p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <h3 className="font-display font-bold text-success">DEPOIS</h3>
          </div>
          {beforeAfter.map((item) => (
            <div key={item.after} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-success/60 shrink-0" />
              <span className="text-foreground font-medium">{item.after}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center mt-10 text-lg font-bold text-foreground">
        "Você não trabalha mais. Você trabalha melhor — e <span className="text-accent">fatura mais</span>."
      </p>
      <div className="text-center mt-6">
        <Link to="/cadastro">
          <Button size="lg" variant="gradient" className="text-base px-8 h-12 font-bold uppercase tracking-wide">
            Quero essa transformação <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  </Section>
);
