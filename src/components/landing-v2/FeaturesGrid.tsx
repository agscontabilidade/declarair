import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Layout, Smartphone, Shield, Zap, Palette, Receipt,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  { icon: Layout, title: 'Veja quem está pendente agora', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real.', span: 'lg:col-span-2' },
  { icon: Smartphone, title: 'Cliente envia tudo certo, no lugar certo', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, automaticamente.', span: '' },
  { icon: Shield, title: 'Evite malha fina antes de transmitir', desc: 'O verificador cruza dados automaticamente e avisa antes de dar problema. Disponível no plano Pro.', span: '' },
  { icon: Zap, title: 'Simule o resultado do IR em segundos', desc: 'Compare Simplificada vs Completa instantaneamente. Mostre pro cliente o cenário ideal e feche o serviço mais rápido.', span: 'lg:col-span-2' },
  { icon: Palette, title: 'Whitelabel com sua marca', desc: 'Seu cliente vê o seu nome, não o nosso. Isso é percepção de valor — e valor se cobra.', span: '' },
  { icon: Receipt, title: 'Cobranças integradas', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente.', span: 'lg:col-span-3' },
];

export default function FeaturesGrid() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="features" className="v2-reveal py-24 lg:py-32 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide mb-6">
            Na prática
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Cada funcionalidade é um<br />
            <span className="gradient-text">problema a menos</span>
          </h2>
          <p className="mt-5 text-lg text-[hsl(var(--lv2-slate-500))] max-w-lg mx-auto">
            Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className={`bento-card group ${f.span}`}>
              <div className="h-11 w-11 rounded-xl bg-[hsl(var(--lv2-emerald)/0.08)] flex items-center justify-center mb-5 group-hover:bg-[hsl(var(--lv2-emerald)/0.15)] transition-colors">
                <f.icon className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
              </div>
              <h3 className="font-bold text-lg text-[hsl(var(--lv2-slate-950))] mb-2">{f.title}</h3>
              <p className="text-sm text-[hsl(var(--lv2-slate-500))] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-13 font-bold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Começar grátis agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
