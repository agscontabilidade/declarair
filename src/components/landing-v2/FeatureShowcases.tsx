import { CheckCircle2 } from 'lucide-react';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const showcases = [
  {
    title: 'Pare de adivinhar. Veja o que está travado.',
    description: 'O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto.',
    bullets: ['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'],
    image: featureDashboard,
    alt: 'Dashboard de gestão de IR',
  },
  {
    title: 'Seu cliente manda tudo certo. Sem te incomodar.',
    description: 'Chega de "manda de novo", "faltou esse". O portal guia o cliente, e você recebe tudo organizado.',
    bullets: ['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Cliente acompanha o status em tempo real'],
    image: featureMobile,
    alt: 'Cliente enviando documentos pelo celular',
  },
];

export default function FeatureShowcases() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal relative overflow-hidden bg-[hsl(var(--lv2-slate-950))] grain">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--lv2-emerald)/0.05)] rounded-full blur-[120px]" />

      <div className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
          {showcases.map((s, i) => (
            <div
              key={s.title}
              className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
            >
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="absolute inset-0 bg-[hsl(var(--lv2-emerald)/0.05)] rounded-2xl blur-2xl scale-105" />
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                  <img src={s.image} alt={s.alt} className="w-full h-[300px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left space-y-5">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">{s.title}</h3>
                <p className="text-base text-white/40 leading-relaxed">{s.description}</p>
                <ul className="space-y-3 pt-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-white/60">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald))] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
