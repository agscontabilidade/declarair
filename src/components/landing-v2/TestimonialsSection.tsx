import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import avatarCarlos from '@/assets/avatar-carlos.jpg';
import avatarAna from '@/assets/avatar-ana.jpg';
import avatarRoberto from '@/assets/avatar-roberto.jpg';
import MetricCounter from '@/components/landing/MetricCounter';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', stars: 5, avatar: avatarCarlos },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', stars: 5, avatar: avatarAna },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Minha vida mudou. Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', stars: 5, avatar: avatarRoberto },
];

export default function TestimonialsSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium border-[hsl(var(--lv2-slate-200))]">
            Quem já usa, não volta
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Resultados reais de contadores reais
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card-lift rounded-xl border border-[hsl(var(--lv2-slate-200))] bg-[hsl(var(--lv2-slate-50))] p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[hsl(var(--lv2-amber))] text-[hsl(var(--lv2-amber))]" />
                ))}
              </div>
              <p className="text-sm text-[hsl(var(--lv2-slate-950))] leading-relaxed mb-5 font-medium">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border-2 border-[hsl(var(--lv2-slate-200))]" loading="lazy" width={48} height={48} />
                <div>
                  <p className="font-medium text-[hsl(var(--lv2-slate-950))] text-sm">{t.name}</p>
                  <p className="text-xs text-[hsl(var(--lv2-slate-500))]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="mt-14 rounded-xl bg-gradient-to-r from-[hsl(var(--lv2-slate-950))] to-[hsl(217,33%,20%)] p-8 sm:p-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <MetricCounter end="500" suffix="+" label="Escritórios ativos" />
            <MetricCounter end="1200" suffix="+" label="Declarações processadas" />
            <MetricCounter end="85" suffix="%" label="Menos tempo de coleta" />
            <MetricCounter end="98" suffix="%" label="Satisfação dos contadores" />
          </div>
        </div>
      </div>
    </section>
  );
}
