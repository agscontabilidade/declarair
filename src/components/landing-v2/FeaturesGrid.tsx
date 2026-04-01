import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Layout, Smartphone, Shield, Zap, Palette, Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Layout, title: 'Veja quem está pendente agora', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real.', span: 'lg:col-span-2', accent: 'emerald' },
  { icon: Smartphone, title: 'Cliente envia tudo certo, no lugar certo', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, automaticamente.', span: '', accent: 'amber' },
  { icon: Shield, title: 'Evite malha fina antes de transmitir', desc: 'O verificador cruza dados automaticamente e avisa antes de dar problema. Disponível no plano Pro.', span: '', accent: 'emerald' },
  { icon: Zap, title: 'Simule o resultado do IR em segundos', desc: 'Compare Simplificada vs Completa instantaneamente. Mostre pro cliente o cenário ideal e feche o serviço mais rápido.', span: 'lg:col-span-2', accent: 'amber' },
  { icon: Palette, title: 'Whitelabel com sua marca', desc: 'Seu cliente vê o seu nome, não o nosso. Isso é percepção de valor — e valor se cobra.', span: '', accent: 'emerald' },
  { icon: Receipt, title: 'Cobranças integradas', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente.', span: 'lg:col-span-3', accent: 'emerald' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-28 lg:py-36 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Na prática
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Cada funcionalidade é um<br />
            <span className="gradient-text">problema a menos</span>
          </h2>
          <p className="mt-6 text-lg text-[hsl(var(--lv2-slate-500))] max-w-lg mx-auto">
            Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const accentVar = f.accent === 'amber' ? '--lv2-amber' : '--lv2-emerald';
            return (
              <motion.div
                key={f.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={`group relative rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-8 transition-colors duration-300 hover:border-[hsl(var(${accentVar})/0.3)] hover:shadow-xl hover:shadow-[hsl(var(${accentVar})/0.08)] overflow-hidden ${f.span}`}
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 bg-[hsl(var(${accentVar})/0.06)] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`h-13 w-13 rounded-2xl bg-[hsl(var(${accentVar})/0.08)] flex items-center justify-center mb-6 group-hover:bg-[hsl(var(${accentVar})/0.15)] transition-colors`}>
                    <f.icon className={`h-6 w-6 text-[hsl(var(${accentVar}))]`} />
                  </div>
                  <h3 className="font-bold text-xl text-[hsl(var(--lv2-slate-950))] mb-3">{f.title}</h3>
                  <p className="text-[15px] text-[hsl(var(--lv2-slate-500))] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-10 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Começar grátis agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
