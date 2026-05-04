import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import { featuresTranslated } from './LandingData';

export const LandingFeatures = () => (
  <Section id="features" className="py-20 lg:py-28 bg-background dot-grid">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium">Na prática</Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Cada funcionalidade é um problema a menos
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto">
          Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuresTranslated.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-8 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-accent/10 transition-colors" />
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <f.icon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">{f.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link to="/cadastro">
          <Button size="lg" variant="gradient" className="text-base px-8 h-12 font-bold uppercase tracking-wide">
            Começar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  </Section>
);
