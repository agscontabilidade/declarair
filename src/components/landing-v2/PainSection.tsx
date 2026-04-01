import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, AlertTriangle,
  MessageSquareWarning, FileQuestion, Clock, RotateCcw, TrendingDown,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const painPoints = [
  { icon: MessageSquareWarning, text: 'Cliente mandando documento solto no WhatsApp' },
  { icon: FileQuestion, text: 'Informações incompletas toda vez' },
  { icon: Clock, text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { icon: RotateCcw, text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { icon: TrendingDown, text: 'Baixa lucratividade pelo esforço absurdo' },
];

export default function PainSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="dor" className="v2-reveal py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-red)/0.2)] bg-[hsl(var(--lv2-red)/0.05)] text-[hsl(var(--lv2-red))] text-xs font-semibold uppercase tracking-wide mb-6">
            <AlertTriangle className="h-3 w-3" /> Isso é familiar?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">
            Se você não resolver isso,<br />
            <span className="text-[hsl(var(--lv2-red))]">todo ano será a mesma guerra.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {painPoints.map((p, i) => (
            <div
              key={p.text}
              className={`bento-card flex items-start gap-4 ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[hsl(var(--lv2-red)/0.08)] flex items-center justify-center">
                <p.icon className="h-5 w-5 text-[hsl(var(--lv2-red))]" />
              </div>
              <p className="text-sm text-[hsl(var(--lv2-slate-700))] font-medium leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <p className="text-[hsl(var(--lv2-slate-400))] text-lg italic mb-8 max-w-xl mx-auto">
            "Enquanto você organiza documento, outro contador está faturando."
          </p>
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-13 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Resolver isso agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
