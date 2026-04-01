import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, AlertTriangle,
  MessageSquareWarning, FileQuestion, Clock, RotateCcw, TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

const painPoints = [
  { icon: MessageSquareWarning, text: 'Cliente mandando documento solto no WhatsApp' },
  { icon: FileQuestion, text: 'Informações incompletas toda vez' },
  { icon: Clock, text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { icon: RotateCcw, text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { icon: TrendingDown, text: 'Baixa lucratividade pelo esforço absurdo' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function PainSection() {
  return (
    <section id="dor" className="py-28 lg:py-36 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-red)/0.2)] bg-[hsl(var(--lv2-red)/0.05)] text-[hsl(var(--lv2-red))] text-xs font-semibold uppercase tracking-wide mb-6">
            <AlertTriangle className="h-3.5 w-3.5" /> Isso é familiar?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">
            Se você não resolver isso,<br />
            <span className="text-[hsl(var(--lv2-red))]">todo ano será a mesma guerra.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {painPoints.map((p, i) => (
            <motion.div
              key={p.text}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`group relative rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-7 transition-colors duration-300 hover:border-[hsl(var(--lv2-red)/0.2)] hover:shadow-lg ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-[hsl(var(--lv2-red)/0.08)] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--lv2-red)/0.12)] transition-colors">
                <p.icon className="h-6 w-6 text-[hsl(var(--lv2-red))]" />
              </div>
              <p className="text-[15px] text-[hsl(var(--lv2-slate-700))] font-medium leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-[hsl(var(--lv2-slate-400))] text-xl italic mb-10 max-w-xl mx-auto">
            "Enquanto você organiza documento, outro contador está faturando."
          </p>
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Resolver isso agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
