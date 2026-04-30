import { Badge } from '@/components/ui/badge';
import { Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';

export const LandingUrgency = () => (
  <Section className="py-16 lg:py-20 border-y border-border">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
      <div className="h-12 w-12 rounded-2xl border border-warning/20 bg-warning/5 flex items-center justify-center mx-auto">
        <Flame className="h-5 w-5 text-warning" />
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
        A temporada de IR não espera.
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
        Quem se organiza antes, <span className="font-semibold text-foreground">lucra mais</span>.
        <br />
        Quem deixa pra depois… entra em modo sobrevivência.
      </p>
      <Link to="/cadastro">
        <Button size="lg" variant="gradient" className="text-base px-10 h-12 font-bold uppercase tracking-wide mt-2">
          Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </Link>
    </div>
  </Section>
);
