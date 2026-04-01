import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CTAFinal() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-24 lg:py-28 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2rem] overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 hero-mesh" />
          <div className="absolute inset-0 grain" />

          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-emerald)/0.12)] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-[hsl(var(--lv2-amber)/0.08)] rounded-full blur-[80px]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--lv2-slate-400)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--lv2-slate-400)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          <div className="relative p-14 sm:p-24 text-center">
            <img src={logoFull} alt="DeclaraIR" className="h-12 sm:h-14 mx-auto mb-10 brightness-0 invert" />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] max-w-3xl mx-auto">
              Pare de operar no caos.
            </h2>
            <p className="mt-6 text-white/60 max-w-xl mx-auto text-xl font-medium leading-relaxed">
              Transforme seu IR em um processo simples, previsível e lucrativo.
            </p>
            <p className="mt-8 text-white/30 text-base italic max-w-md mx-auto">
              "Você não precisa trabalhar mais. Precisa trabalhar organizado."
            </p>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="glow-btn mt-12 text-lg px-14 h-16 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
              >
                Começar agora <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {['Teste grátis', '3 declarações no Pro', 'Cancele quando quiser'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/35">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.5)]" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
