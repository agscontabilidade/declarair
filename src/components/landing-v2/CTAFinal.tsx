import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import ctaPerson from '@/assets/cta-person.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CTAFinal() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-slate-950))] to-[hsl(217,33%,20%)]" />
          <div className="absolute inset-0">
            <img src={ctaPerson} alt="" className="w-full h-full object-cover opacity-15 mix-blend-overlay" loading="lazy" width={1280} height={640} />
          </div>

          <div className="relative p-10 sm:p-16 text-center">
            <img src={logoFull} alt="DeclaraIR" className="h-12 sm:h-14 mx-auto mb-6 brightness-0 invert" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
              Pare de operar no caos.
            </h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto text-xl font-medium">
              Transforme seu IR em um processo simples, previsível e lucrativo.
            </p>
            <p className="mt-5 text-white/40 text-sm italic">
              "Você não precisa trabalhar mais. Precisa trabalhar organizado."
            </p>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="mt-8 text-base px-10 h-12 font-bold uppercase tracking-wide bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-lg"
              >
                Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <p className="mt-3 text-white/35 text-xs">
              Teste grátis • 3 declarações no Pro • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
