import { ShieldCheck, FileText, Sparkles } from 'lucide-react';

const BULLETS = [
  { icon: ShieldCheck, text: 'Sem risco' },
  { icon: FileText, text: 'Sem contrato' },
  { icon: Sparkles, text: 'Sem surpresas' },
];

export function PlanosHeader() {
  return (
    <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
        Escale seu IR sem aumentar equipe
      </h1>
      <p className="text-lg text-muted-foreground">
        Comece grátis e pague apenas pelo que usar
      </p>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {BULLETS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm font-medium text-foreground">
            <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
