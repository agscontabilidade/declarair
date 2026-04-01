import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UrgencyBand() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--lv2-amber)/0.15)] via-[hsl(var(--lv2-slate-950))] to-[hsl(var(--lv2-slate-950))]" />
      <div className="absolute inset-0 grain" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[hsl(var(--lv2-amber)/0.08)] animate-ping" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[hsl(var(--lv2-amber)/0.05)] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />

      <div className="relative py-28 lg:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--lv2-amber)/0.15)] border border-[hsl(var(--lv2-amber)/0.25)] flex items-center justify-center">
              <Clock className="h-5 w-5 text-[hsl(var(--lv2-amber))]" />
            </div>
            <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--lv2-amber)/0.2)] border border-[hsl(var(--lv2-amber)/0.3)] flex items-center justify-center">
              <Flame className="h-8 w-8 text-[hsl(var(--lv2-amber))]" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--lv2-amber)/0.15)] border border-[hsl(var(--lv2-amber)/0.25)] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--lv2-amber))]" />
            </div>
          </motion.div>

          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            A temporada de IR<br />
            <span className="text-[hsl(var(--lv2-amber))]">não espera.</span>
          </motion.h2>
          <motion.p
            className="text-xl text-white/50 leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            Quem se organiza antes, <span className="font-bold text-white">lucra mais</span>.
            <br />
            Quem deixa pra depois… entra em modo sobrevivência.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                className="mt-4 text-lg px-12 h-16 font-bold bg-[hsl(var(--lv2-amber))] hover:bg-[hsl(var(--lv2-amber)/0.9)] text-[hsl(var(--lv2-slate-950))] rounded-full shadow-2xl shadow-[hsl(var(--lv2-amber)/0.3)]"
              >
                Começar agora — é grátis <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
