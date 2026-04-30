import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Section } from './LandingSection';
import { testimonials } from './LandingData';
import MetricCounter from './MetricCounter';

export const LandingTestimonials = () => (
  <Section className="py-20 lg:py-28">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium">Quem já usa, não volta</Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Resultados reais de contadores reais
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border bg-card p-6 hover:border-accent/20 transition-colors">
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.stars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-5 font-medium">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border-2 border-border" loading="lazy" width={48} height={48} />
              <div>
                <p className="font-medium text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl gradient-brand p-8 sm:p-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <MetricCounter end="500" suffix="+" label="Escritórios ativos" />
          <MetricCounter end="1200" suffix="+" label="Declarações processadas" />
          <MetricCounter end="85" suffix="%" label="Menos tempo de coleta" />
          <MetricCounter end="98" suffix="%" label="Satisfação dos contadores" />
        </div>
      </div>
    </div>
  </Section>
);
