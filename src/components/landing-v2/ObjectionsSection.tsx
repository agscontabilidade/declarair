import { ArrowRight, MessageCircleQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

const objections = [
  { objection: '"Já uso planilha"', answer: 'Planilha organiza dados. Não organiza processo. E muito menos cliente. Quando o WhatsApp toca pela 30ª vez pedindo a mesma coisa, a planilha não te salva.' },
  { objection: '"Não tenho tempo de aprender sistema novo"', answer: 'Se você tem tempo de reorganizar documento que o cliente mandou errado, tem tempo de apertar 3 botões. Sério: são 2 minutos pra configurar.' },
  { objection: '"É caro demais"', answer: 'Um único erro no IR pode custar mais que um ano inteiro do sistema. R$ 49,90 por mês é menos que o valor de UMA declaração. A matemática é simples.' },
  { objection: '"Meu escritório é pequeno demais"', answer: 'Comece grátis com 1 declaração. Sem contrato. Se não servir, você não gastou nada. Se servir, desbloqueie tudo por R$ 49,90/mês.' },
];

export default function ObjectionsSection() {
  return (
    <section className="py-28 lg:py-36 bg-[hsl(var(--lv2-slate-50))] relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-amber)/0.3)] bg-[hsl(var(--lv2-amber)/0.08)] text-[hsl(var(--lv2-amber))] text-xs font-semibold uppercase tracking-wide mb-6">
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            Sem desculpa
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            "Mas eu já…" — Calma. Lê isso aqui.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {objections.map((obj, i) => (
            <motion.div
              key={obj.objection}
              className="group relative rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-8 transition-colors duration-300 hover:border-[hsl(var(--lv2-emerald)/0.3)] hover:shadow-xl hover:shadow-[hsl(var(--lv2-emerald)/0.06)] overflow-hidden"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <span className="absolute -top-4 -right-2 font-mono text-[120px] font-bold leading-none text-[hsl(var(--lv2-slate-100))] select-none group-hover:text-[hsl(var(--lv2-emerald)/0.06)] transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="relative space-y-4">
                <span className="inline-block px-4 py-2 rounded-full bg-[hsl(var(--lv2-red)/0.06)] text-[hsl(var(--lv2-red))] text-sm font-bold border border-[hsl(var(--lv2-red)/0.12)]">
                  {obj.objection}
                </span>
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--lv2-emerald))] shrink-0 mt-1" />
                  <p className="text-[15px] text-[hsl(var(--lv2-slate-600))] leading-relaxed">{obj.answer}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
