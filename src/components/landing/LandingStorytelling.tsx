import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Section } from './LandingSection';

export const LandingStorytelling = () => (
  <Section className="gradient-brand">
    <div className="py-20 lg:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/40 leading-relaxed italic">
          Todo ano começa igual.
        </p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/60 leading-relaxed italic">
          Clientes perdidos, documentos soltos no WhatsApp, prazos batendo na porta.
        </p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
          Você não é um organizador de papéis.<br />
          <span className="text-accent-foreground/80">Você é um estrategista.</span>
        </p>
        <div className="pt-8">
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-8 h-12 font-bold uppercase tracking-wide bg-white text-foreground hover:bg-white/90">
              Chega de caos <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </Section>
);
