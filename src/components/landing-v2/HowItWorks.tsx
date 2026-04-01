import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, FileCheck, BarChart3, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', icon: UserPlus, title: 'Cadastre seu escritório', desc: 'Em 2 minutos você configura tudo. Sem instalação, sem cartão.' },
  { num: '02', icon: FileCheck, title: 'Convide seus clientes', desc: 'Envie o link do portal. O cliente envia documentos no lugar certo, sem WhatsApp.' },
  { num: '03', icon: BarChart3, title: 'Gerencie no Kanban', desc: 'Visualize todas as declarações em um fluxo organizado. Saiba exatamente o status de cada uma.' },
  { num: '04', icon: Send, title: 'Transmita e fature', desc: 'Finalize, transmita e cobre — tudo na mesma plataforma. Sem retrabalho.' },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--lv2-slate-950))] grain">
      <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-[hsl(var(--lv2-emerald)/0.06)] rounded-full blur-[120px]" />

      <div className="relative py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-emerald)/0.3)] bg-[hsl(var(--lv2-emerald)/0.08)] text-[hsl(var(--lv2-emerald))] text-xs font-semibold uppercase tracking-wide mb-6">
              Como funciona
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              4 passos para sair do caos
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="relative group text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-48px)] h-px bg-gradient-to-r from-[hsl(var(--lv2-emerald)/0.4)] to-[hsl(var(--lv2-emerald)/0.05)]" />
                )}

                <span className="step-number block mb-4">{step.num}</span>
                <motion.div
                  className="h-16 w-16 rounded-2xl bg-[hsl(var(--lv2-emerald)/0.1)] border border-[hsl(var(--lv2-emerald)/0.2)] flex items-center justify-center mx-auto mb-5 group-hover:bg-[hsl(var(--lv2-emerald)/0.2)] group-hover:border-[hsl(var(--lv2-emerald)/0.4)] transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <step.icon className="h-7 w-7 text-[hsl(var(--lv2-emerald))]" />
                </motion.div>
                <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                className="text-base px-10 h-14 font-bold bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-full"
              >
                Começar agora — leva 2 minutos <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
