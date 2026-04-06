import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Users, Shield, Zap, Heart, CheckCircle2 } from 'lucide-react';
import logoHero from '@/assets/logo-hero.png';
import logoFull from '@/assets/logo-full.png';
import NavBar from '@/components/landing-v2/NavBar';
import Footer from '@/components/landing-v2/Footer';
import { motion } from 'framer-motion';

const valores = [
  { icon: Target, title: 'Foco no contador', desc: 'Cada funcionalidade é pensada para resolver problemas reais de quem vive o dia a dia do IR.' },
  { icon: Zap, title: 'Simplicidade radical', desc: 'Tecnologia complexa por trás, experiência simples na frente. Sem curva de aprendizado.' },
  { icon: Shield, title: 'Segurança inegociável', desc: 'Dados fiscais exigem proteção máxima. Criptografia, isolamento e conformidade LGPD.' },
  { icon: Heart, title: 'Empatia com o processo', desc: 'Sabemos que temporada de IR é estressante. Nosso trabalho é reduzir esse peso.' },
];

export default function SobreNos() {
  return (
    <div className="landing-v2 min-h-screen overflow-x-hidden">
      <NavBar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 bg-[hsl(var(--lv2-slate-950))] overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--lv2-emerald)/0.06)] blur-[100px]" />
        <div className="absolute bottom-0 right-[5%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--lv2-amber)/0.04)] blur-[80px]" />
        <div className="absolute inset-0 grain" />

        <motion.div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-semibold uppercase tracking-wide">
            <Users className="h-3.5 w-3.5" /> Sobre nós
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] font-display">
            Nascemos de uma dor{' '}
            <span className="gradient-text">que todo contador conhece</span>.
          </h1>
          <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto">
            Cansamos de ver escritórios contábeis desperdiçando talento em processos manuais,
            perdendo tempo com organização e brigando com WhatsApp na temporada de IR.
          </p>
        </motion.div>
      </section>

      {/* Missão */}
      <section className="py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
                Nossa missão
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight font-display">
                Devolver ao contador o que é dele:{' '}
                <span className="gradient-text">tempo e lucro</span>.
              </h2>
              <p className="mt-6 text-lg text-[hsl(var(--lv2-slate-500))] leading-relaxed">
                O DeclaraIR existe para transformar o caos da temporada de IR em um processo
                organizado, previsível e escalável. Para que o contador pare de ser operacional
                e volte a ser estratégico.
              </p>
              <p className="mt-4 text-lg text-[hsl(var(--lv2-slate-500))] leading-relaxed">
                Acreditamos que tecnologia bem feita não complica — simplifica. Não substitui o
                contador — potencializa.
              </p>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-10 text-center shadow-lg">
                <img src={logoHero} alt="DeclaraIR" className="h-24 mx-auto mb-6" />
                <p className="text-2xl font-bold text-[hsl(var(--lv2-slate-950))] font-display">+500 escritórios</p>
                <p className="text-[hsl(var(--lv2-slate-500))] mt-1">já organizaram seu IR conosco</p>
              </div>
              <div className="absolute -top-4 -right-4 rounded-xl bg-white border border-[hsl(var(--lv2-emerald)/0.2)] shadow-lg p-3 z-10">
                <p className="font-bold text-[hsl(var(--lv2-emerald))] text-lg font-display">98%</p>
                <p className="text-xs text-[hsl(var(--lv2-slate-500))]">satisfação</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
              Nossos valores
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))] font-display">
              O que guia cada decisão que tomamos
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {valores.map((v, i) => (
              <motion.div
                key={v.title}
                className="lv2-card rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white p-8 transition-all duration-300 hover:border-[hsl(var(--lv2-emerald)/0.3)] hover:shadow-xl hover:shadow-[hsl(var(--lv2-emerald)/0.06)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--lv2-emerald)/0.08)] border border-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center mb-5">
                  <v.icon className="h-6 w-6 text-[hsl(var(--lv2-emerald))]" />
                </div>
                <h3 className="font-bold text-[hsl(var(--lv2-slate-950))] text-xl font-display">{v.title}</h3>
                <p className="mt-3 text-base text-[hsl(var(--lv2-slate-500))] leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[hsl(var(--lv2-slate-950))] relative">
        <div className="absolute inset-0 grain" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[hsl(var(--lv2-emerald)/0.08)] rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.img
            src={logoFull}
            alt="DeclaraIR"
            className="h-12 mx-auto mb-6 brightness-0 invert opacity-70"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          />
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
            Pronto para organizar seu IR?
          </h2>
          <p className="text-lg text-white/50">
            Comece grátis, sem contrato, sem compromisso.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="glow-btn text-base px-12 h-14 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full mt-4">
              Começar agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {['Teste grátis', 'Sem contrato', 'Cancele quando quiser'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/35">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lv2-emerald)/0.5)]" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
