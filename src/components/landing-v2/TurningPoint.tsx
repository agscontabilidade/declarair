import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function TurningPoint() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal relative py-28 lg:py-36 overflow-hidden bg-white">
      <div className="section-divider absolute top-0 left-0 right-0" />

      {/* Subtle bg pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--lv2-slate-950)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="h-20 w-20 rounded-3xl bg-[hsl(var(--lv2-emerald)/0.08)] border border-[hsl(var(--lv2-emerald)/0.2)] flex items-center justify-center mx-auto">
          <Target className="h-9 w-9 text-[hsl(var(--lv2-emerald))]" />
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">
          O problema nunca foi o volume de declarações.
        </h2>
        <p className="text-xl lg:text-2xl text-[hsl(var(--lv2-slate-500))] leading-relaxed max-w-xl mx-auto">
          É a falta de um sistema que{' '}
          <span className="gradient-text font-semibold">organize o jogo pra você</span>.
        </p>
        <p className="text-[hsl(var(--lv2-slate-950))] font-bold text-2xl">
          IR não é difícil. Difícil é trabalhar no caos.
        </p>
        <Link to="/cadastro">
          <Button
            size="lg"
            className="glow-btn mt-4 text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
          >
            Testar grátis agora <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
