import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import { motion } from 'framer-motion';

export default function CTAFinal() {
  return (
    <section className="py-24 lg:py-28 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative rounded-[2rem] overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background */}
          <div className="absolute inset-0 hero-mesh" />
          <div className="absolute inset-0 grain" />

          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-emerald)/0.12)] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-[hsl(var(--lv2-amber)/0.08)] rounded-full blur-[80px]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--lv2-slate-400)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--lv2-slate-400)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          <div className="relative p-14 sm:p-24 text-center">
            <motion.img
              src={logoFull}
              alt="DeclaraIR"
              className="h-12 sm:h-14 mx-auto mb-10 brightness-0 invert"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring' }}
            />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] max-w-3xl mx-auto">
              Pare de operar no caos.
            </h2>
            <p className="mt-6 text-white/60 max-w-xl mx-auto text-xl font-medium leading-relaxed">
              Transforme seu IR em um processo simples, previsível e lucrativo.
            </p>
            <p className="mt-8 text-white/30 text-base italic max-w-md mx-auto">
              "Você não precisa trabalhar mais. Precisa trabalhar organizado."
            </p>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="glow-btn mt-12 text-base px-14 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
              >
                Começar agora <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {['Teste grátis', 'Declarações por R$ 9,90', 'Cancele quando quiser'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/35">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.5)]" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
