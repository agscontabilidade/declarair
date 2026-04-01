import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Flame } from 'lucide-react';
import mockupHero from '@/assets/mockup-dashboard-hero.png';

export default function HeroSection() {
  return (
    <section className="relative grain overflow-hidden">
      {/* Gradient mesh bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-slate-50))] via-[hsl(var(--lv2-slate-100))] to-[hsl(160,30%,95%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text */}
          <div className="flex-[1.15] text-center lg:text-left space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-red)/0.2)] bg-[hsl(var(--lv2-red)/0.06)] text-[hsl(var(--lv2-red))] text-xs font-medium v2-reveal revealed"
            >
              <Flame className="h-3.5 w-3.5" />
              A temporada de IR não espera
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-[hsl(var(--lv2-slate-950))]">
              O problema não é IRPF.
              <br />
              <span className="bg-gradient-to-r from-[hsl(var(--lv2-emerald))] to-[hsl(170,60%,45%)] bg-clip-text text-transparent">
                É o seu processo desorganizado!
              </span>
            </h1>

            <p className="text-lg text-[hsl(var(--lv2-slate-500))] leading-relaxed max-w-md mx-auto lg:mx-0">
              Organize tudo, elimine retrabalho e entregue declarações em{' '}
              <span className="text-[hsl(var(--lv2-slate-950))] font-semibold">metade do tempo</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 pt-2">
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="glow-btn text-base px-8 h-12 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
                >
                  Quero organizar meu IR agora
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#solucao">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-6 h-12 font-semibold rounded-lg border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-800))] hover:bg-[hsl(var(--lv2-slate-100))]"
                >
                  Ver como funciona
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center lg:justify-start justify-center gap-x-5 gap-y-2 pt-2">
              {['Plano Free disponível', 'Começa em 2 minutos', 'Cancele quando quiser'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-[hsl(var(--lv2-slate-400))]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--lv2-emerald))]" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="flex-1 w-full max-w-xl relative">
            <div className="rounded-xl overflow-hidden shadow-[0_30px_80px_-20px_hsl(var(--lv2-slate-950)/0.2)] border border-[hsl(var(--lv2-slate-200))]">
              <div className="bg-[hsl(var(--lv2-slate-900))] h-7 flex items-center gap-1.5 px-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-red)/0.8)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-amber)/0.8)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-emerald)/0.8)]" />
              </div>
              <img
                src={mockupHero}
                alt="Dashboard DeclaraIR com Kanban e KPIs"
                className="w-full h-auto"
                width={1480}
                height={800}
              />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 bg-white rounded-lg px-3 py-2 shadow-lg border border-[hsl(var(--lv2-slate-200))] animate-float z-10">
              <p className="font-heading font-bold text-[hsl(var(--lv2-slate-950))] text-xs whitespace-nowrap flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--lv2-emerald))] animate-pulse" />
                12 declarações hoje
              </p>
            </div>
            <div className="absolute -bottom-3 left-4 bg-white rounded-lg px-3 py-2 shadow-lg border border-[hsl(var(--lv2-slate-200))] animate-float z-10" style={{ animationDelay: '1s' }}>
              <p className="font-heading font-bold text-[hsl(var(--lv2-slate-950))] text-xs whitespace-nowrap">
                ✨ +34% produtividade
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
