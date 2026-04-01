import { Star } from 'lucide-react';
import avatarCarlos from '@/assets/avatar-carlos.jpg';
import avatarAna from '@/assets/avatar-ana.jpg';
import avatarRoberto from '@/assets/avatar-roberto.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useEffect, useRef, useState } from 'react';

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Minha vida mudou. Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', avatar: avatarRoberto },
];

function AnimatedNumber({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        let cur = 0;
        const step = end / 40;
        const timer = setInterval(() => {
          cur += step;
          if (cur >= end) { setVal(end); clearInterval(timer); }
          else setVal(Math.floor(cur));
        }, 35);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return <span ref={ref} className="font-mono text-4xl sm:text-5xl font-bold text-white">{val.toLocaleString('pt-BR')}{suffix}</span>;
}

export default function TestimonialsSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Quem já usa, não volta
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Resultados reais de contadores reais
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bento-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--lv2-emerald)/0.04)] rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[hsl(var(--lv2-amber))] text-[hsl(var(--lv2-amber))]" />
                  ))}
                </div>
                <p className="text-[15px] text-[hsl(var(--lv2-slate-800))] leading-relaxed mb-6 font-medium">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--lv2-slate-100))]">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-[hsl(var(--lv2-slate-100))]" loading="lazy" width={48} height={48} />
                  <div>
                    <p className="font-semibold text-[hsl(var(--lv2-slate-950))] text-sm">{t.name}</p>
                    <p className="text-xs text-[hsl(var(--lv2-slate-400))]">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="mt-16 rounded-2xl bg-[hsl(var(--lv2-slate-950))] p-10 sm:p-14 relative overflow-hidden grain">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-emerald)/0.08)] to-transparent" />
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-10">
            {[
              { end: 500, suffix: '+', label: 'Escritórios ativos' },
              { end: 1200, suffix: '+', label: 'Declarações processadas' },
              { end: 85, suffix: '%', label: 'Menos tempo de coleta' },
              { end: 98, suffix: '%', label: 'Satisfação dos contadores' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <AnimatedNumber end={m.end} suffix={m.suffix} />
                <p className="mt-2 text-sm text-white/40">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
