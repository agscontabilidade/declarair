import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { Section } from './LandingSection';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';

export const LandingPricing = () => (
  <Section id="pricing" className="py-20 lg:py-28 dot-grid">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="mb-2 text-xs px-3 py-1 font-medium">
          <DollarSign className="h-3 w-3 mr-1.5" /> Preços
        </Badge>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto italic">
          "Um único erro no IR pode custar mais que um ano inteiro do sistema."
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Comece grátis. Escale quando quiser.
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Dois planos. Sem contrato. Sem surpresas. Sem letras miúdas.
        </p>
      </div>
      <PlanosCardsPublic />
      <TabelaAvulso />
    </div>
  </Section>
);
