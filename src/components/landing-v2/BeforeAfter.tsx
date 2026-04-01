import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const items = [
  { before: 'Caos no WhatsApp', after: 'Fluxo organizado e automático' },
  { before: 'Cliente perdido sem saber o que enviar', after: 'Cliente guiado com checklist inteligente' },
  { before: 'Retrabalho a cada declaração', after: 'Processo previsível e escalável' },
  { before: 'Correria desesperada no prazo', after: 'Controle total — sem surpresas' },
  { before: 'Trabalhar mais, faturar igual', after: 'Trabalhar menos, faturar mais' },
];

export default function BeforeAfter() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))] relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Transformação
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Veja a diferença com os próprios olhos
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Before */}
          <div className="rounded-2xl border-2 border-[hsl(var(--lv2-red)/0.15)] bg-white p-7 space-y-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--lv2-red)/0.08)] flex items-center justify-center">
                <XCircle className="h-5 w-5 text-[hsl(var(--lv2-red))]" />
              </div>
              <h3 className="font-bold text-lg text-[hsl(var(--lv2-red))]">ANTES</h3>
            </div>
            {items.map((item) => (
              <div key={item.before} className="flex items-center gap-3 text-sm">
                <XCircle className="h-4 w-4 text-[hsl(var(--lv2-red)/0.35)] shrink-0" />
                <span className="text-[hsl(var(--lv2-slate-500))]">{item.before}</span>
              </div>
            ))}
          </div>

          {/* After */}
          <div className="rounded-2xl border-2 border-[hsl(var(--lv2-emerald)/0.2)] bg-white p-7 space-y-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-emerald)/0.03)] to-transparent rounded-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-[hsl(var(--lv2-emerald)/0.08)] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <h3 className="font-bold text-lg text-[hsl(var(--lv2-emerald))]">DEPOIS</h3>
              </div>
              {items.map((item) => (
                <div key={item.after} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.5)] shrink-0" />
                  <span className="text-[hsl(var(--lv2-slate-950))] font-medium">{item.after}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-12 text-xl font-bold text-[hsl(var(--lv2-slate-950))]">
          "Você não trabalha mais. Você trabalha melhor — e{' '}
          <span className="gradient-text">fatura mais</span>."
        </p>
        <div className="text-center mt-6">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-13 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Quero essa transformação <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
