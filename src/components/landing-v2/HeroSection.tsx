import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardMockup from './DashboardMockup';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection() {
  return (
    <section className="relative hero-mesh grain overflow-hidden min-h-screen flex items-center">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--lv2-slate-400)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--lv2-slate-400)) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Decorative orbs */}
      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--lv2-emerald)/0.06)] blur-[100px]" />
      <div className="absolute bottom-10 right-[5%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--lv2-amber)/0.04)] blur-[80px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 lg:pt-40 lg:pb-28 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-16">
          {/* Text — 55% */}
          <motion.div
            className="flex-[1.2] text-center lg:text-left space-y-8 max-w-2xl"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(var(--lv2-amber)/0.3)] bg-[hsl(var(--lv2-amber)/0.08)] text-[hsl(var(--lv2-amber))] text-xs font-semibold tracking-wide uppercase">
              <Flame className="h-3.5 w-3.5" />
              A temporada de IR não espera
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.06] tracking-tight text-white">
              O problema não é IRPF.
              <br />
              <span className="gradient-text">
                É o seu processo desorganizado!
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg lg:text-xl text-white/50 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Organize tudo, elimine retrabalho e entregue declarações em{' '}
              <span className="text-white font-semibold">metade do tempo</span>.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-2">
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="glow-btn text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
                >
                  Quero organizar meu IR agora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <a href="#solucao">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-14 font-semibold rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
                >
                  Ver como funciona
                </Button>
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center lg:justify-start justify-center gap-x-8 gap-y-3 pt-4">
              {['Plano Free disponível', 'Começa em 2 minutos', 'Cancele quando quiser'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/40">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.7)]" />
                  {t}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Mockup — 45% */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative">
            <DashboardMockup />
          </div>
        </div>

        {/* Trusted by bar */}
        <motion.div
          className="mt-20 lg:mt-28 pt-10 border-t border-white/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.7 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">
            {[
              { value: '500+', label: 'Escritórios ativos' },
              { value: '1.200+', label: 'Declarações processadas' },
              { value: '85%', label: 'Menos tempo de coleta' },
              { value: '98%', label: 'Satisfação' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-white/30 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
