import { DollarSign, Sparkles } from 'lucide-react';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function PricingSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="pricing" className="v2-reveal relative overflow-hidden py-28 lg:py-36">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[hsl(var(--lv2-slate-50))] to-white" />
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-[hsl(var(--lv2-emerald)/0.04)] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-amber)/0.03)] rounded-full blur-[100px]" />
      
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-emerald)/0.2)] bg-[hsl(var(--lv2-emerald)/0.06)] text-[hsl(var(--lv2-emerald))] text-xs font-semibold uppercase tracking-wide">
            <DollarSign className="h-3.5 w-3.5" /> Preços transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Comece grátis. Escale quando quiser.
          </h2>
          <p className="text-lg text-[hsl(var(--lv2-slate-500))] max-w-xl mx-auto">
            Dois planos. Sem contrato. Sem surpresas. Sem letras miúdas.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--lv2-amber)/0.08)] border border-[hsl(var(--lv2-amber)/0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--lv2-amber))]" />
            <span className="text-sm text-[hsl(var(--lv2-slate-700))] font-medium italic">
              "Um único erro no IR pode custar mais que um ano inteiro do sistema."
            </span>
          </div>
        </div>
        <PlanosCardsPublic />
        <TabelaAvulso />
      </div>
    </section>
  );
}
