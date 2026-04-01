import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const items = [
  { before: 'Caos no WhatsApp', after: 'Fluxo organizado e automático' },
  { before: 'Cliente perdido sem saber o que enviar', after: 'Cliente guiado com checklist inteligente' },
  { before: 'Retrabalho a cada declaração', after: 'Processo previsível e escalável' },
  { before: 'Correria desesperada no prazo', after: 'Controle total — sem surpresas' },
  { before: 'Trabalhar mais, faturar igual', after: 'Trabalhar menos, faturar mais' },
];

export default function BeforeAfter() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Transformação
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Veja a diferença com os próprios olhos
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            className="rounded-2xl border-2 border-[hsl(var(--lv2-red)/0.15)] bg-white p-8 lg:p-10 space-y-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-[hsl(var(--lv2-red)/0.08)] flex items-center justify-center">
                <XCircle className="h-6 w-6 text-[hsl(var(--lv2-red))]" />
              </div>
              <h3 className="font-bold text-xl text-[hsl(var(--lv2-red))]">ANTES</h3>
            </div>
            {items.map((item, i) => (
              <motion.div
                key={item.before}
                className="flex items-center gap-4 text-base"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              >
                <XCircle className="h-5 w-5 text-[hsl(var(--lv2-red)/0.35)] shrink-0" />
                <span className="text-[hsl(var(--lv2-slate-500))]">{item.before}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* After */}
          <motion.div
            className="rounded-2xl border-2 border-[hsl(var(--lv2-emerald)/0.25)] bg-white p-8 lg:p-10 space-y-5 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-emerald)/0.04)] to-transparent rounded-2xl" />
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[hsl(var(--lv2-emerald)/0.08)] rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-xl bg-[hsl(var(--lv2-emerald)/0.1)] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <h3 className="font-bold text-xl text-[hsl(var(--lv2-emerald))]">DEPOIS</h3>
              </div>
              {items.map((item, i) => (
                <motion.div
                  key={item.after}
                  className="flex items-center gap-4 text-base"
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lv2-emerald)/0.5)] shrink-0" />
                  <span className="text-[hsl(var(--lv2-slate-950))] font-medium">{item.after}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-2xl font-bold text-[hsl(var(--lv2-slate-950))]">
            "Você não trabalha mais. Você trabalha melhor — e{' '}
            <span className="gradient-text">fatura mais</span>."
          </p>
          <div className="mt-8">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="glow-btn text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
              >
                Quero essa transformação <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
