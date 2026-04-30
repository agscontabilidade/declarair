import { Badge } from '@/components/ui/badge';
import { Section } from './LandingSection';
import { objections } from './LandingData';
import lionBrave from '@/assets/lion-brave.jpg';

export const LandingObjections = () => (
  <Section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} style={{ filter: 'grayscale(0.3) brightness(0.25)' }} />
      <div className="absolute inset-0 bg-foreground/85" />
    </div>

    <div className="relative py-20 lg:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-white/20 text-primary-foreground text-xs px-3 py-1 font-medium">Sem desculpa</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
            "Mas eu já…" — Calma. Lê isso aqui.
          </h2>
        </div>
        <div className="space-y-3">
          {objections.map((obj) => (
            <div key={obj.objection} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <span className="inline-block shrink-0 px-3 py-1 rounded-lg bg-destructive/15 text-destructive-foreground text-sm font-bold border border-destructive/20">
                  {obj.objection}
                </span>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{obj.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Section>
);
