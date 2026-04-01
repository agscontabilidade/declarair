import { CheckCircle2 } from 'lucide-react';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const showcases = [
  {
    title: 'Pare de adivinhar. Veja o que está travado.',
    description: 'O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto. Sem ligar pro cliente pra perguntar.',
    bullets: ['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'],
    image: featureDashboard,
    alt: 'Dashboard de gestão de IR',
    reversed: false,
  },
  {
    title: 'Seu cliente manda tudo certo. Sem te incomodar.',
    description: 'Chega de "manda de novo", "faltou esse", "mandou no grupo errado". O portal guia o cliente, e você recebe tudo organizado.',
    bullets: ['Upload direto pelo celular com câmera', 'Checklist gerado pelo perfil fiscal', 'Cliente acompanha o status em tempo real'],
    image: featureMobile,
    alt: 'Cliente enviando documentos pelo celular',
    reversed: true,
  },
];

export default function FeatureShowcases() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal bg-gradient-to-br from-[hsl(var(--lv2-slate-950))] to-[hsl(217,33%,20%)]">
      <div className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {showcases.map((s) => (
            <div
              key={s.title}
              className={`flex flex-col ${s.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
            >
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={s.image} alt={s.alt} className="w-full h-[320px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">{s.title}</h3>
                <p className="mt-4 text-base text-white/50 leading-relaxed">{s.description}</p>
                <ul className="mt-6 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/70">
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
