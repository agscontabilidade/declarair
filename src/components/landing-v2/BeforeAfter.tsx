import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const beforeAfter = [
  { before: 'Caos no WhatsApp', after: 'Fluxo organizado e automático' },
  { before: 'Cliente perdido sem saber o que enviar', after: 'Cliente guiado com checklist inteligente' },
  { before: 'Retrabalho a cada declaração', after: 'Processo previsível e escalável' },
  { before: 'Correria desesperada no prazo', after: 'Controle total — sem surpresas' },
  { before: 'Trabalhar mais, faturar igual', after: 'Trabalhar menos, faturar mais' },
];

export default function BeforeAfter() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-20 lg:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium border-[hsl(var(--lv2-slate-200))]">
            Transformação
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Veja a diferença com os próprios olhos
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="rounded-xl border border-[hsl(var(--lv2-red)/0.2)] bg-[hsl(var(--lv2-red)/0.04)] p-6 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--lv2-red)/0.1)] flex items-center justify-center">
                <XCircle className="h-4 w-4 text-[hsl(var(--lv2-red))]" />
              </div>
              <h3 className="font-heading font-bold text-[hsl(var(--lv2-red))]">ANTES</h3>
            </div>
            {beforeAfter.map((item) => (
              <div key={item.before} className="flex items-center gap-2.5 text-sm">
                <XCircle className="h-3.5 w-3.5 text-[hsl(var(--lv2-red)/0.4)] shrink-0" />
                <span className="text-[hsl(var(--lv2-slate-500))]">{item.before}</span>
              </div>
            ))}
          </div>

          {/* After */}
          <div className="rounded-xl border border-[hsl(var(--lv2-emerald)/0.2)] bg-[hsl(var(--lv2-emerald)/0.04)] p-6 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--lv2-emerald)/0.1)] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald))]" />
              </div>
              <h3 className="font-heading font-bold text-[hsl(var(--lv2-emerald))]">DEPOIS</h3>
            </div>
            {beforeAfter.map((item) => (
              <div key={item.after} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--lv2-emerald)/0.6)] shrink-0" />
                <span className="text-[hsl(var(--lv2-slate-950))] font-medium">{item.after}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center mt-10 text-lg font-bold text-[hsl(var(--lv2-slate-950))]">
          "Você não trabalha mais. Você trabalha melhor — e{' '}
          <span className="text-[hsl(var(--lv2-emerald))]">fatura mais</span>."
        </p>
        <div className="text-center mt-6">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-12 font-bold uppercase tracking-wide bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
            >
              Quero essa transformação <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
