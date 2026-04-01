import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRECOS } from '@/lib/constants/planos';

export function TabelaAvulso() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Pague apenas pelo que usar
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Sem mínimo, sem contrato. Compre declarações extras sob demanda.
        </p>
      </div>

      <Card className="shadow-lg border-accent/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4">
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Declarações Avulsas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="text-center p-8 rounded-xl border-2 border-accent bg-accent/5 shadow-md shadow-accent/10 max-w-xs w-full">
              <p className="text-sm font-semibold text-muted-foreground">Por declaração</p>
              <p className="text-4xl font-bold text-foreground mt-3">
                R$ {PRECOS.DECLARACAO_EXTRA.preco.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                cada declaração extra
              </p>
            </div>
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
