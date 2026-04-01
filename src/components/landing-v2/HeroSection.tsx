import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Flame, TrendingUp, Users, Shield } from 'lucide-react';
import mockupHero from '@/assets/mockup-dashboard-hero.png';

export default function HeroSection() {
  return (
    <section className="relative hero-mesh grain overflow-hidden min-h-screen flex items-center">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--lv2-slate-400)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--lv2-slate-400)) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Decorative orbs */}
      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--lv2-emerald)/0.06)] blur-[100px]" />
      <div className="absolute bottom-10 right-[5%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--lv2-amber)/0.04)] blur-[80px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-16 lg:pb-24 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-16">
          {/* Text — 55% */}
          <div className="flex-[1.2] text-center lg:text-left space-y-8 max-w-2xl">
            <div className="stagger-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(var(--lv2-amber)/0.3)] bg-[hsl(var(--lv2-amber)/0.08)] text-[hsl(var(--lv2-amber))] text-xs font-semibold tracking-wide uppercase">
              <Flame className="h-3.5 w-3.5" />
              A temporada de IR não espera
            </div>

            <h1 className="stagger-2 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.06] tracking-tight text-white">
              O problema não é IRPF.
              <br />
              <span className="gradient-text">
                É o seu processo desorganizado!
              </span>
            </h1>

            <p className="stagger-3 text-lg lg:text-xl text-white/50 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Organize tudo, elimine retrabalho e entregue declarações em{' '}
              <span className="text-white font-semibold">metade do tempo</span>.
            </p>

            <div className="stagger-4 flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-2">
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="glow-btn text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
                >
                  Quero organizar meu IR agora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <a href="#solucao">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-14 font-semibold rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
                >
                  Ver como funciona
                </Button>
              </a>
            </div>

            <div className="stagger-5 flex flex-wrap items-center lg:justify-start justify-center gap-x-8 gap-y-3 pt-4">
              {['Plano Free disponível', 'Começa em 2 minutos', 'Cancele quando quiser'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/40">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.7)]" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup — 45% */}
          <div className="stagger-6 flex-1 w-full max-w-xl lg:max-w-none relative">
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-[hsl(var(--lv2-emerald)/0.08)] rounded-2xl blur-3xl scale-110" />

            <div className="relative border-glow rounded-2xl">
              <div className="rounded-2xl overflow-hidden bg-[hsl(var(--lv2-slate-900))]">
                <div className="h-9 flex items-center gap-1.5 px-4 bg-[hsl(var(--lv2-slate-900))] border-b border-white/5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-red)/0.7)]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-amber)/0.7)]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-emerald)/0.7)]" />
                  <span className="ml-auto text-[10px] text-white/20 font-mono">declarair.app</span>
                </div>
                <img
                  src={mockupHero}
                  alt="Dashboard DeclaraIR com Kanban e KPIs"
                  className="w-full h-auto"
                  width={1480}
                  height={800}
                />
              </div>
            </div>

            {/* Floating metric cards */}
            <div className="absolute -top-5 -right-3 sm:-right-8 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 animate-float z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">+34%</p>
                  <p className="text-[11px] text-white/40">produtividade</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 left-3 sm:left-8 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 animate-float z-10" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-amber)/0.15)] flex items-center justify-center">
                  <Users className="h-5 w-5 text-[hsl(var(--lv2-amber))]" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">500+</p>
                  <p className="text-[11px] text-white/40">escritórios</p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -left-3 sm:-left-6 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 animate-float z-10" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">LGPD</p>
                  <p className="text-[11px] text-white/40">compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted by bar */}
        <div className="stagger-6 mt-20 lg:mt-28 pt-10 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">
            {[
              { value: '500+', label: 'Escritórios ativos' },
              { value: '1.200+', label: 'Declarações processadas' },
              { value: '85%', label: 'Menos tempo de coleta' },
              { value: '98%', label: 'Satisfação' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-white/30 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
