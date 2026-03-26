import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

const AVULSO = [
  { range: '1–9', preco: 'R$ 7,90' },
  { range: '10–24', preco: 'R$ 6,50' },
  { range: '25–49', preco: 'R$ 5,50' },
  { range: '50–99', preco: 'R$ 4,50' },
  { range: '100–249', preco: 'R$ 3,90' },
  { range: '250–499', preco: 'R$ 3,50' },
  { range: '500+', preco: 'R$ 2,99' },
];

export function TabelaAvulso() {
  return (
    <Card className="shadow-sm max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <TrendingDown className="h-5 w-5 text-accent" />
          Declarações Avulsas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Excedeu o limite do plano? Compre declarações adicionais com desconto por volume
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {AVULSO.map((item, i) => (
            <div
              key={item.range}
              className={`text-center p-3 rounded-lg border transition-colors ${
                i === AVULSO.length - 1
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-border/50 hover:border-accent/20'
              }`}
            >
              <p className="text-xs text-muted-foreground font-medium">{item.range}</p>
              <p className="text-sm font-bold mt-1 text-foreground">{item.preco}</p>
              <p className="text-[10px] text-muted-foreground">por decl.</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
