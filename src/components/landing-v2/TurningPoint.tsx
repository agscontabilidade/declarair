import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function TurningPoint() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-20 lg:py-28 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        <div className="h-14 w-14 rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white flex items-center justify-center mx-auto shadow-sm">
          <Target className="h-6 w-6 text-[hsl(var(--lv2-emerald))]" />
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">
          O problema nunca foi o volume de declarações.
        </h2>
        <p className="text-lg text-[hsl(var(--lv2-slate-500))] leading-relaxed">
          É a falta de um sistema que{' '}
          <span className="text-[hsl(var(--lv2-emerald))] font-semibold">organize o jogo pra você</span>.
        </p>
        <p className="text-[hsl(var(--lv2-slate-950))] font-bold text-lg">
          IR não é difícil. Difícil é trabalhar no caos.
        </p>
        <Link to="/cadastro">
          <Button
            size="lg"
            className="glow-btn mt-4 text-base px-8 h-12 font-bold uppercase tracking-wide bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
          >
            Testar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
