import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, FileCheck, BarChart3, Send } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  {
    num: '01',
    icon: UserPlus,
    title: 'Cadastre seu escritório',
    desc: 'Em 2 minutos você configura tudo. Sem instalação, sem cartão.',
  },
  {
    num: '02',
    icon: FileCheck,
    title: 'Convide seus clientes',
    desc: 'Envie o link do portal. O cliente envia documentos no lugar certo, sem WhatsApp.',
  },
  {
    num: '03',
    icon: BarChart3,
    title: 'Gerencie no Kanban',
    desc: 'Visualize todas as declarações em um fluxo organizado. Saiba exatamente o status de cada uma.',
  },
  {
    num: '04',
    icon: Send,
    title: 'Transmita e fature',
    desc: 'Finalize, transmita e cobre — tudo na mesma plataforma. Sem retrabalho.',
  },
];

export default function HowItWorks() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-24 lg:py-32 bg-white relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Como funciona
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            4 passos para sair do caos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative group">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-32px)] h-px bg-gradient-to-r from-[hsl(var(--lv2-emerald)/0.3)] to-[hsl(var(--lv2-emerald)/0.05)]" />
              )}

              <div className="text-center space-y-4">
                <span className="step-number">{step.num}</span>
                <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--lv2-emerald)/0.08)] border border-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center mx-auto group-hover:bg-[hsl(var(--lv2-emerald)/0.15)] transition-colors">
                  <step.icon className="h-6 w-6 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <h3 className="font-bold text-lg text-[hsl(var(--lv2-slate-950))]">{step.title}</h3>
                <p className="text-sm text-[hsl(var(--lv2-slate-500))] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-13 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Começar agora — leva 2 minutos <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
