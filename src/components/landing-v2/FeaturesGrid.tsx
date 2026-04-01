import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Layout, Smartphone, Shield, Zap, Palette, Receipt,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  { icon: Layout, title: 'Veja quem está pendente agora', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real.' },
  { icon: Smartphone, title: 'Cliente envia tudo certo, no lugar certo', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, automaticamente.' },
  { icon: Shield, title: 'Evite malha fina antes de transmitir', desc: 'O verificador cruza dados automaticamente e avisa antes de dar problema. Disponível no plano Pro.' },
  { icon: Zap, title: 'Simule o resultado do IR em segundos', desc: 'Compare Simplificada vs Completa instantaneamente. Mostre pro cliente o cenário ideal e feche o serviço mais rápido.' },
  { icon: Palette, title: 'Cobre mais com uma experiência profissional', desc: 'Whitelabel com sua marca no portal. Seu cliente vê o seu nome, não o nosso. Isso é percepção de valor — e valor se cobra.' },
  { icon: Receipt, title: 'Cobre via Pix e cartão sem sair da plataforma', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente. Tudo integrado.' },
];

export default function FeaturesGrid() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="features" className="v2-reveal py-20 lg:py-28 bg-[hsl(var(--lv2-slate-100))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium border-[hsl(var(--lv2-slate-200))]">
            Na prática
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Cada funcionalidade é um problema a menos
          </h2>
          <p className="mt-4 text-base text-[hsl(var(--lv2-slate-500))] max-w-lg mx-auto">
            Nada de feature bonita que não resolve. Aqui cada botão economiza tempo ou gera dinheiro.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card-lift rounded-xl border border-[hsl(var(--lv2-slate-200))] bg-white p-6 group"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-emerald)/0.1)] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--lv2-emerald)/0.15)] transition-colors">
                <f.icon className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
              </div>
              <h3 className="font-heading font-bold text-[hsl(var(--lv2-slate-950))]">{f.title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--lv2-slate-500))] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="glow-btn text-base px-8 h-12 font-bold uppercase tracking-wide bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
            >
              Começar grátis agora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
