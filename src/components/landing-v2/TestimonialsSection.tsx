import { Star, Quote } from 'lucide-react';
import avatarCarlos from '@/assets/avatar-carlos.jpg';
import avatarAna from '@/assets/avatar-ana.jpg';
import avatarRoberto from '@/assets/avatar-roberto.jpg';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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

  return <span ref={ref} className="font-mono text-5xl sm:text-6xl font-bold text-white">{val.toLocaleString('pt-BR')}{suffix}</span>;
}

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 grain" />
      
      <div className="relative py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-emerald)/0.3)] bg-[hsl(var(--lv2-emerald)/0.08)] text-[hsl(var(--lv2-emerald))] text-xs font-semibold uppercase tracking-wide mb-6">
              Quem já usa, não volta
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Resultados reais de contadores reais
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 transition-all duration-300 hover:border-[hsl(var(--lv2-emerald)/0.3)] hover:bg-white/[0.08] ${i === 1 ? 'md:-translate-y-4' : ''}`}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: i === 1 ? -16 : 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: i === 1 ? -24 : -8, transition: { duration: 0.25 } }}
              >
                <Quote className="absolute top-6 right-6 h-8 w-8 text-[hsl(var(--lv2-emerald)/0.15)]" />
                <div className="flex gap-0.5 mb-6">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-[hsl(var(--lv2-amber))] text-[hsl(var(--lv2-amber))]" />
                  ))}
                </div>
                <p className="text-base text-white/80 leading-relaxed mb-8 font-medium">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10" loading="lazy" width={48} height={48} />
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Giant metrics */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {[
              { end: 500, suffix: '+', label: 'Escritórios ativos' },
              { end: 1200, suffix: '+', label: 'Declarações processadas' },
              { end: 85, suffix: '%', label: 'Menos tempo de coleta' },
              { end: 98, suffix: '%', label: 'Satisfação dos contadores' },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <AnimatedNumber end={m.end} suffix={m.suffix} />
                <div className="h-1 w-12 mx-auto mt-4 mb-3 rounded-full bg-gradient-to-r from-[hsl(var(--lv2-emerald))] to-[hsl(var(--lv2-emerald)/0.2)]" />
                <p className="text-sm text-white/40 font-medium">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
