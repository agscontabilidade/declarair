import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StorytellingBand() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--lv2-slate-950))] via-[hsl(var(--lv2-slate-900))] to-[hsl(var(--lv2-slate-50))]" />

      <div className="relative py-32 lg:py-44">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <motion.p
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/25 leading-relaxed italic"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            Todo ano começa igual.
          </motion.p>
          <motion.p
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/40 leading-relaxed italic"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Cliente mandando documento no WhatsApp. Informação incompleta.
          </motion.p>
          <motion.p
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-snug"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Prazo chegando. E você… tentando dar conta do caos.
          </motion.p>
          <motion.div
            className="pt-12"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link to="/cadastro">
              <Button
                size="lg"
                className="text-base px-10 h-14 font-bold uppercase tracking-wide bg-white text-[hsl(var(--lv2-slate-950))] hover:bg-white/90 rounded-full"
              >
                Chega de caos <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
