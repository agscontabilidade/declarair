import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap } from 'lucide-react';
import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function ProductShowcase() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="solucao" className="v2-reveal bg-gradient-to-br from-[hsl(var(--lv2-slate-950))] to-[hsl(217,33%,20%)]">
      <div className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-6">
              <Badge className="border-[hsl(var(--lv2-emerald)/0.3)] bg-[hsl(var(--lv2-emerald)/0.1)] text-[hsl(var(--lv2-emerald))] text-xs px-4 py-1.5 font-medium rounded-full">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Conheça o DeclaraIR
              </Badge>
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.15] tracking-tight">
                O sistema que transforma o caos do IR em um{' '}
                <span className="bg-gradient-to-r from-[hsl(var(--lv2-emerald))] to-[hsl(170,60%,50%)] bg-clip-text text-transparent">
                  processo previsível e lucrativo
                </span>
                .
              </h2>
              <p className="text-white/50 text-lg leading-relaxed max-w-lg">
                Você não precisa trabalhar mais. Precisa trabalhar organizado.
              </p>
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="mt-2 text-base px-8 h-12 font-bold uppercase tracking-wide bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-lg"
                >
                  Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={mockupDashboard}
                  alt="Dashboard DeclaraIR"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  width={1280}
                  height={800}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
