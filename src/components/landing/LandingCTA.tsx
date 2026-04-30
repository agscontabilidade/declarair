import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';
import logoFull from '@/assets/logo-full.png';
import ctaPerson from '@/assets/cta-person.jpg';

export const LandingCTA = () => (
  <Section className="py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 gradient-brand" />
        <div className="absolute inset-0">
          <img src={ctaPerson} alt="" className="w-full h-full object-cover opacity-20 mix-blend-overlay" loading="lazy" width={1280} height={640} />
        </div>

        <div className="relative p-10 sm:p-16 text-center">
          <img src={logoFull} alt="DeclaraIR" className="h-12 sm:h-14 mx-auto mb-6 brightness-0 invert" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
            Pare de operar no caos.
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto text-xl font-medium">
            Transforme seu IR em um processo simples, previsível e lucrativo.
          </p>
          <p className="mt-5 text-primary-foreground/40 text-sm italic">
            "Você não precisa trabalhar mais. Precisa trabalhar organizado."
          </p>
          <Link to="/cadastro">
            <Button size="lg" variant="secondary" className="mt-8 text-base px-10 h-12 font-bold uppercase tracking-wide">
              Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <p className="mt-3 text-primary-foreground/35 text-xs">
            Teste grátis • Declarações extras por R$ 4,90 no Pro • Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  </Section>
);
