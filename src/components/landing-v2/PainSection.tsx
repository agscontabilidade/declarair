import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, AlertTriangle,
  MessageSquareWarning, FileQuestion, Clock, RotateCcw, TrendingDown,
} from 'lucide-react';
import lionBrave from '@/assets/lion-brave.jpg';
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
    <section ref={ref} id="dor" className="v2-reveal relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} />
        <div className="absolute inset-0 bg-[hsl(var(--lv2-slate-950)/0.92)]" />
      </div>

      <div className="relative py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 border-[hsl(var(--lv2-red)/0.3)] bg-[hsl(var(--lv2-red)/0.1)] text-white text-xs px-3 py-1 font-medium">
            <AlertTriangle className="h-3 w-3 mr-1.5" /> Isso é familiar?
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight mb-12">
            Se você não resolver isso,<br />
            <span className="text-[hsl(var(--lv2-amber))]">todo ano será a mesma guerra.</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-left">
            {painPoints.map((p, i) => (
              <div
                key={p.text}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="h-9 w-9 shrink-0 rounded-lg bg-[hsl(var(--lv2-red)/0.15)] flex items-center justify-center">
                  <p.icon className="h-4 w-4 text-[hsl(var(--lv2-red))]" />
                </div>
                <p className="text-sm text-white/80 font-medium leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-white/40 text-lg italic max-w-xl mx-auto">
            "Enquanto você organiza documento, outro contador está faturando."
          </p>

          <div className="mt-8">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="glow-btn text-base px-8 h-12 font-bold uppercase tracking-wide bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
              >
                Resolver isso agora <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
