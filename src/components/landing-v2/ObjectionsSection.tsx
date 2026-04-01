import { Badge } from '@/components/ui/badge';
import lionBrave from '@/assets/lion-brave.jpg';
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
    <section ref={ref} className="v2-reveal relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={lionBrave} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={800} style={{ filter: 'grayscale(0.3) brightness(0.25)' }} />
        <div className="absolute inset-0 bg-[hsl(var(--lv2-slate-950)/0.88)]" />
      </div>

      <div className="relative py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 border-white/20 bg-white/5 text-white text-xs px-3 py-1 font-medium">
              Sem desculpa
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              "Mas eu já…" — Calma. Lê isso aqui.
            </h2>
          </div>
          <div className="space-y-3">
            {objections.map((obj) => (
              <div key={obj.objection} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className="inline-block shrink-0 px-3 py-1 rounded-lg bg-[hsl(var(--lv2-red)/0.15)] text-white text-sm font-bold border border-[hsl(var(--lv2-red)/0.2)]">
                    {obj.objection}
                  </span>
                  <p className="text-sm text-white/70 leading-relaxed">{obj.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
