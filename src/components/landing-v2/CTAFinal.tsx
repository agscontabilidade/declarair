import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CTAFinal() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-20 lg:py-24 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 hero-mesh" />
          <div className="absolute inset-0 grain" />

          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-emerald)/0.1)] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-[hsl(var(--lv2-amber)/0.06)] rounded-full blur-[80px]" />

          <div className="relative p-12 sm:p-20 text-center">
            <img src={logoFull} alt="DeclaraIR" className="h-10 sm:h-12 mx-auto mb-8 brightness-0 invert" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
              Pare de operar no caos.
            </h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto text-xl font-medium">
              Transforme seu IR em um processo simples, previsível e lucrativo.
            </p>
            <p className="mt-6 text-white/30 text-sm italic">
              "Você não precisa trabalhar mais. Precisa trabalhar organizado."
            </p>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="glow-btn mt-10 text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full text-lg"
              >
                Começar agora <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-white/25 text-xs">
              Teste grátis • 3 declarações no Pro • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
