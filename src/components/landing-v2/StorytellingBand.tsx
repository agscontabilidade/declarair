import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function StorytellingBand() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal bg-[hsl(var(--lv2-slate-950))]">
      <div className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/40 leading-relaxed italic font-heading">
            Todo ano começa igual.
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/55 leading-relaxed italic font-heading">
            Cliente mandando documento no WhatsApp. Informação incompleta.
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white leading-relaxed font-heading">
            Prazo chegando. E você… tentando dar conta do caos.
          </p>
          <div className="pt-8">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="text-base px-8 h-12 font-bold uppercase tracking-wide bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-lg"
              >
                Chega de caos <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
