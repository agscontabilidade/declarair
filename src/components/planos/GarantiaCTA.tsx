import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5500000000000?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20DeclaraIR';

interface GarantiaCTAProps {
  onNavigate: () => void;
}

export function GarantiaCTA({ onNavigate }: GarantiaCTAProps) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
        <ShieldCheck className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Comece grátis. Sem cartão de crédito.</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground">
        Pronto para profissionalizar seu IR?
      </h2>
      <p className="text-muted-foreground">
        Teste gratuitamente e veja como o DeclaraIR pode transformar a gestão de declarações do seu escritório.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8" onClick={onNavigate}>
          Começar agora <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2" /> Falar com consultor
          </a>
        </Button>
      </div>
    </div>
  );
}
