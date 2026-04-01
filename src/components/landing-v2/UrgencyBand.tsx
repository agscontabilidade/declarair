import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function UrgencyBand() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-16 lg:py-20 border-y border-[hsl(var(--lv2-slate-200))] bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        <div className="h-12 w-12 rounded-2xl border border-[hsl(var(--lv2-amber)/0.2)] bg-[hsl(var(--lv2-amber)/0.06)] flex items-center justify-center mx-auto">
          <Flame className="h-5 w-5 text-[hsl(var(--lv2-amber))]" />
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[hsl(var(--lv2-slate-950))]">
          A temporada de IR não espera.
        </h2>
        <p className="text-base text-[hsl(var(--lv2-slate-500))] leading-relaxed max-w-lg mx-auto">
          Quem se organiza antes, <span className="font-semibold text-[hsl(var(--lv2-slate-950))]">lucra mais</span>.
          <br />
          Quem deixa pra depois… entra em modo sobrevivência.
        </p>
        <Link to="/cadastro">
          <Button
            size="lg"
            className="glow-btn text-base px-10 h-12 font-bold uppercase tracking-wide mt-2 bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
          >
            Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
