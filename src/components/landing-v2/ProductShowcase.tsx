import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function ProductShowcase() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="solucao" className="v2-reveal relative overflow-hidden bg-[hsl(var(--lv2-slate-950))] grain">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[hsl(var(--lv2-emerald)/0.08)] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-amber)/0.05)] rounded-full blur-[100px]" />

      <div className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-emerald)/0.3)] bg-[hsl(var(--lv2-emerald)/0.08)] text-[hsl(var(--lv2-emerald))] text-xs font-semibold uppercase tracking-wide">
                <Zap className="h-3.5 w-3.5" /> Conheça o DeclaraIR
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                O sistema que transforma o caos do IR em um{' '}
                <span className="gradient-text">processo previsível e lucrativo</span>.
              </h2>
              <p className="text-white/40 text-lg leading-relaxed">
                Você não precisa trabalhar mais. Precisa trabalhar organizado.
              </p>
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="mt-2 text-base px-8 h-13 font-bold bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-full"
                >
                  Começar agora <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="absolute inset-0 bg-[hsl(var(--lv2-emerald)/0.06)] rounded-2xl blur-3xl scale-105" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
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
