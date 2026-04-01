import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRECOS } from '@/lib/constants/planos';

export function TabelaAvulso() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--lv2-slate-950))]">
          Pague apenas pelo que usar
        </h3>
        <p className="text-[hsl(var(--lv2-slate-500))] max-w-xl mx-auto">
          Sem mínimo, sem contrato. Compre declarações extras sob demanda.
        </p>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-white overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-[hsl(var(--lv2-slate-50))] to-[hsl(var(--lv2-emerald)/0.04)] px-6 py-5 border-b border-[hsl(var(--lv2-slate-100))]">
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
            <h4 className="text-lg font-bold text-[hsl(var(--lv2-slate-950))]">Declarações Avulsas</h4>
          </div>
        </div>
        <div className="p-8">
          <div className="flex justify-center">
            <div className="text-center p-8 rounded-2xl border-2 border-[hsl(var(--lv2-emerald)/0.2)] bg-[hsl(var(--lv2-emerald)/0.03)] max-w-xs w-full">
              <p className="text-sm font-semibold text-[hsl(var(--lv2-slate-400))] uppercase tracking-wide">Por declaração</p>
              <p className="text-5xl font-bold text-[hsl(var(--lv2-slate-950))] mt-3">
                R$ {PRECOS.DECLARACAO_EXTRA.preco.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm text-[hsl(var(--lv2-slate-500))] mt-2">
                cada declaração extra
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-5">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(var(--lv2-emerald)/0.06)] border border-[hsl(var(--lv2-emerald)/0.15)]">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--lv2-emerald))]" />
              <span className="text-sm font-semibold text-[hsl(var(--lv2-slate-700))]">
                Você só paga pelas declarações que realmente fizer
              </span>
            </div>

            <Link to="/cadastro">
              <Button
                size="lg"
                className="bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white px-10 h-13 text-base font-bold rounded-full shadow-lg shadow-[hsl(var(--lv2-emerald)/0.25)]"
              >
                Começar grátis agora <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
