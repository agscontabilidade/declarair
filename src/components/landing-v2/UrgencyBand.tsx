import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function UrgencyBand() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal relative overflow-hidden bg-[hsl(var(--lv2-slate-950))] grain">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--lv2-amber)/0.08)] via-transparent to-[hsl(var(--lv2-emerald)/0.06)]" />

      <div className="relative py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--lv2-amber)/0.1)] border border-[hsl(var(--lv2-amber)/0.2)] flex items-center justify-center mx-auto">
            <Flame className="h-6 w-6 text-[hsl(var(--lv2-amber))]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            A temporada de IR não espera.
          </h2>
          <p className="text-lg text-white/50 leading-relaxed max-w-lg mx-auto">
            Quem se organiza antes, <span className="font-semibold text-white">lucra mais</span>.
            <br />
            Quem deixa pra depois… entra em modo sobrevivência.
          </p>
          <Link to="/cadastro">
            <Button
              size="lg"
              className="mt-2 text-base px-10 h-13 font-bold bg-[hsl(var(--lv2-amber))] hover:bg-[hsl(var(--lv2-amber)/0.9)] text-[hsl(var(--lv2-slate-950))] rounded-full"
            >
              Começar agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
