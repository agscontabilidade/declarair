import { DollarSign } from 'lucide-react';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function PricingSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="pricing" className="v2-reveal py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))] relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide">
            <DollarSign className="h-3 w-3" /> Preços
          </div>
          <p className="text-[hsl(var(--lv2-slate-400))] text-base max-w-lg mx-auto italic">
            "Um único erro no IR pode custar mais que um ano inteiro do sistema."
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Comece grátis. Escale quando quiser.
          </h2>
          <p className="text-lg text-[hsl(var(--lv2-slate-500))] max-w-xl mx-auto">
            Dois planos. Sem contrato. Sem surpresas. Sem letras miúdas.
          </p>
        </div>
        <PlanosCardsPublic />
        <TabelaAvulso />
      </div>
    </section>
  );
}
