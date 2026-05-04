import { ArrowRight, ShieldCheck, Headphones, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import logoFull from '@/assets/logo-full.png';
import ctaPerson from '@/assets/cta-person.jpg';

export const LandingCTA = () => (
  <Section className="py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute inset-0 gradient-brand opacity-95" />
        <div className="absolute inset-0">
          <img src={ctaPerson} alt="" className="w-full h-full object-cover opacity-10 mix-blend-luminosity" loading="lazy" width={1280} height={640} />
        </div>

        <div className="relative p-10 sm:p-20 text-center flex flex-col items-center">
          <img src={logoFull} alt="DeclaraIR" className="h-14 sm:h-16 mx-auto mb-8 brightness-0 invert" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-[1.1] tracking-tight max-w-2xl">
            Pare de operar no caos e comece a escalar seu IR.
          </h2>
          <p className="mt-4 text-primary-foreground/90 max-w-xl mx-auto text-lg sm:text-xl font-medium">
            Transforme seu escritório em um processo simples, previsível e altamente lucrativo com automação real.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 w-full sm:w-auto">
            <Link to="/cadastro" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full text-lg px-12 h-16 font-bold uppercase tracking-wider shadow-xl hover:scale-105 transition-transform group">
                Criar minha conta grátis <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-widest">
              Teste agora • Sem cartão de crédito • Comece em 2 min
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full pt-10 border-t border-white/10">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <span className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wide">100% Seguro (LGPD)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <span className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wide">Setup Instantâneo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Headphones className="h-6 w-6 text-accent" />
              <span className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wide">Suporte Humano</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Lock className="h-6 w-6 text-accent" />
              <span className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wide">Sem Fidelidade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>
);
