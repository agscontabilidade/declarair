import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import { painPoints } from './LandingData';
import lionBrave from '@/assets/lion-brave.jpg';

export const LandingPainPoints = () => (
  <Section id="dor" className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} />
      <div className="absolute inset-0 bg-foreground/90" />
    </div>

    <div className="relative py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge variant="outline" className="mb-6 border-destructive/40 bg-destructive/10 text-destructive-foreground text-xs px-3 py-1 font-medium">
          <AlertTriangle className="h-3 w-3 mr-1.5" /> Isso é familiar?
        </Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight mb-12">
          Se você não resolver isso,<br />
          <span className="text-warning">todo ano será a mesma guerra.</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-left">
          {painPoints.map((p) => (
            <div key={p.text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-destructive/15 flex items-center justify-center">
                <p.icon className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-sm text-primary-foreground/80 font-medium leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-primary-foreground/50 text-lg italic max-w-xl mx-auto">
          "Enquanto você organiza documento, outro contador está faturando."
        </p>

        <div className="mt-8">
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-8 h-12 font-bold uppercase tracking-wide bg-accent hover:bg-accent/90 text-accent-foreground">
              Resolver isso agora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </Section>
);
