import { UserPlus, Users, TrendingDown } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Assine a plataforma', desc: 'Escolha o plano ideal e comece em minutos' },
  { icon: Users, title: 'Gerencie seus clientes', desc: 'Use todas as ferramentas sem limitação' },
  { icon: TrendingDown, title: 'Pague pelo que usar', desc: 'Declarações avulsas com preço regressivo' },
];

export function ComoFunciona() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Como funciona</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="relative text-center space-y-3 p-6 rounded-xl border border-border/50 bg-card">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
              {i + 1}
            </div>
            <div className="h-12 w-12 mx-auto rounded-xl bg-accent/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/20">
          <TrendingDown className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Quanto mais você usa, menor o custo por declaração</span>
        </div>
      </div>
    </div>
  );
}
