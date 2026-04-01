import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
    <section ref={ref} className="v2-reveal py-28 lg:py-36 bg-white relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {showcases.map((s, i) => (
          <div
            key={s.title}
            className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24`}
          >
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="absolute inset-0 bg-[hsl(var(--lv2-emerald)/0.04)] rounded-3xl blur-2xl scale-105" />
              <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--lv2-slate-200))] shadow-2xl shadow-[hsl(var(--lv2-slate-950)/0.1)]">
                <img src={s.image} alt={s.alt} className="w-full h-[320px] lg:h-[420px] object-cover" loading="lazy" width={960} height={640} />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left space-y-6">
              <h3 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">{s.title}</h3>
              <p className="text-lg text-[hsl(var(--lv2-slate-500))] leading-relaxed">{s.description}</p>
              <ul className="space-y-4 pt-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-base text-[hsl(var(--lv2-slate-700))]">
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lv2-emerald))] shrink-0 mt-0.5" />
                    <span className="font-medium">{b}</span>
                  </li>
                ))}
              </ul>
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="glow-btn mt-2 text-base px-8 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
                >
                  Testar grátis <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
