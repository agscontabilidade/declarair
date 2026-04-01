import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function StorytellingBand() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal relative overflow-hidden">
      {/* Gradient transition from dark hero to light */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--lv2-slate-950))] via-[hsl(var(--lv2-slate-900))] to-[hsl(var(--lv2-slate-50))]" />

      <div className="relative py-28 lg:py-36">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/30 leading-relaxed italic">
            Todo ano começa igual.
          </p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/45 leading-relaxed italic">
            Cliente mandando documento no WhatsApp. Informação incompleta.
          </p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-relaxed">
            Prazo chegando. E você… tentando dar conta do caos.
          </p>
          <div className="pt-10">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="text-base px-8 h-13 font-bold uppercase tracking-wide bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-full"
              >
                Chega de caos <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
