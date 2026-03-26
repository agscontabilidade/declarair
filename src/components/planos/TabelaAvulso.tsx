import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AVULSO = [
  { range: '1–10', preco: 'R$ 7,90', perDecl: true },
  { range: '10–50', preco: 'R$ 6,50', perDecl: true },
  { range: '50–100', preco: 'R$ 5,00', perDecl: true },
  { range: '100–300', preco: 'R$ 4,20', perDecl: true },
  { range: '300+', preco: 'R$ 3,00', perDecl: true, highlight: true },
];

export function TabelaAvulso() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Pague apenas pelo que usar
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Quanto mais declarações, menor o custo. Sem mínimo, sem contrato.
        </p>
      </div>

      <Card className="shadow-lg border-accent/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4">
          <div className="flex items-center justify-center gap-2">
            <TrendingDown className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Declarações Avulsas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {AVULSO.map((item) => (
              <div
                key={item.range}
                className={`relative text-center p-5 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                  item.highlight
                    ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                    : 'border-border/50 hover:border-accent/30'
                }`}
              >
                {item.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Melhor preço
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold text-muted-foreground">{item.range}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{item.preco}</p>
                <p className="text-xs text-muted-foreground mt-1">por declaração</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/20">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">
                Você só paga pelas declarações que realmente fizer
              </span>
            </div>

            <Link to="/cadastro">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8">
                Começar grátis agora <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
