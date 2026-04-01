import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TurningPoint() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden bg-white">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--lv2-slate-950)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <motion.div
          className="h-20 w-20 rounded-3xl bg-[hsl(var(--lv2-emerald)/0.08)] border border-[hsl(var(--lv2-emerald)/0.2)] flex items-center justify-center mx-auto"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        >
          <Target className="h-9 w-9 text-[hsl(var(--lv2-emerald))]" />
        </motion.div>
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          O problema nunca foi o volume de declarações.
        </motion.h2>
        <motion.p
          className="text-xl lg:text-2xl text-[hsl(var(--lv2-slate-500))] leading-relaxed max-w-xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          É a falta de um sistema que{' '}
          <span className="gradient-text font-semibold">organize o jogo pra você</span>.
        </motion.p>
        <motion.p
          className="text-[hsl(var(--lv2-slate-950))] font-bold text-2xl"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          IR não é difícil. Difícil é trabalhar no caos.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn mt-4 text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Testar grátis agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
