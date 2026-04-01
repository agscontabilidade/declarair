import { useScrollReveal } from '@/hooks/useScrollReveal';

const objections = [
  { objection: '"Já uso planilha"', answer: 'Planilha organiza dados. Não organiza processo. E muito menos cliente. Quando o WhatsApp toca pela 30ª vez pedindo a mesma coisa, a planilha não te salva.' },
  { objection: '"Não tenho tempo de aprender sistema novo"', answer: 'Se você tem tempo de reorganizar documento que o cliente mandou errado, tem tempo de apertar 3 botões. Sério: são 2 minutos pra configurar.' },
  { objection: '"É caro demais"', answer: 'Um único erro no IR pode custar mais que um ano inteiro do sistema. R$ 29,90 por mês é menos que o valor de UMA declaração. A matemática é simples.' },
  { objection: '"Meu escritório é pequeno demais"', answer: 'Comece grátis com 1 declaração. Sem contrato. Se não servir, você não gastou nada. Se servir, desbloqueie tudo por R$ 29,90/mês.' },
];

export default function ObjectionsSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="v2-reveal py-24 lg:py-32 bg-white relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Sem desculpa
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">
            "Mas eu já…" — Calma. Lê isso aqui.
          </h2>
        </div>
        <div className="space-y-4">
          {objections.map((obj) => (
            <div
              key={obj.objection}
              className="bento-card flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <span className="inline-block shrink-0 px-4 py-1.5 rounded-full bg-[hsl(var(--lv2-red)/0.06)] text-[hsl(var(--lv2-red))] text-sm font-bold border border-[hsl(var(--lv2-red)/0.15)]">
                {obj.objection}
              </span>
              <p className="text-sm text-[hsl(var(--lv2-slate-500))] leading-relaxed">{obj.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
