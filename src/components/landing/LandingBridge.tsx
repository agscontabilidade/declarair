import { Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';

export const LandingBridge = () => (
  <Section className="py-20 lg:py-28 dot-grid">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
      <div className="h-14 w-14 rounded-2xl border border-border bg-background flex items-center justify-center mx-auto">
        <Target className="h-6 w-6 text-accent" />
      </div>
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
        O problema nunca foi o volume de declarações.
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed">
        É a falta de um sistema que <span className="text-accent font-semibold">organize o jogo pra você</span>.
      </p>
      <p className="text-foreground font-bold text-lg">
        IR não é difícil. Difícil é trabalhar no caos.
      </p>
      <Link to="/cadastro">
        <Button size="lg" variant="gradient" className="mt-4 text-base px-8 h-12 font-bold uppercase tracking-wide">
          Testar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </Link>
    </div>
  </Section>
);
