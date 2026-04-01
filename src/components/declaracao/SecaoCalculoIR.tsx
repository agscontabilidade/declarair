import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp, TrendingDown, CheckCircle2, Save, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import {
  calcularComparativo,
  type DadosCalculo,
  type ComparativoIR,
  TETO_DESCONTO_SIMPLIFICADO,
  DESCONTO_SIMPLIFICADO_PCT,
} from '@/lib/calculoIR';

interface Props {
  formulario: any;
  declaracao: any;
  onSaveForma: (forma: string) => void;
  savingForma: boolean;
}

function CurrencyInput({ label, value, onChange, tooltip }: { label: string; value: string; onChange: (v: string) => void; tooltip?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {tooltip && <p className="text-[10px] text-muted-foreground leading-tight">{tooltip}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pl-9 h-9 text-sm"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

function ResultadoPanel({ titulo, resultado, isMelhor, desconto }: {
  titulo: string;
  resultado: ComparativoIR['simplificada'];
  isMelhor: boolean;
  desconto?: string;
}) {
  const isRestituicao = resultado.tipoResultado === 'restituicao';
  const isPagamento = resultado.tipoResultado === 'pagamento';

  return (
    <Card className={`flex-1 transition-all ${isMelhor ? 'ring-2 ring-success shadow-lg' : 'opacity-80'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
          {isMelhor && (
            <Badge className="bg-success text-success-foreground text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" /> MELHOR
            </Badge>
          )}
        </div>
        {desconto && <p className="text-[10px] text-muted-foreground">{desconto}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total deduções</span>
            <span className="font-medium tabular-nums">{formatCurrency(resultado.totalDeducoes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base de cálculo</span>
            <span className="font-medium tabular-nums">{formatCurrency(resultado.baseCalculo)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Imposto devido</span>
            <span className="font-medium tabular-nums">{formatCurrency(resultado.impostoDevido)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Imposto retido</span>
            <span className="font-medium tabular-nums">{formatCurrency(resultado.impostoRetido)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center pt-1">
            <span className="font-semibold flex items-center gap-1.5">
              {isRestituicao && <TrendingUp className="h-4 w-4 text-success" />}
              {isPagamento && <TrendingDown className="h-4 w-4 text-destructive" />}
              {isRestituicao ? 'RESTITUIÇÃO' : isPagamento ? 'A PAGAR' : 'ZERO'}
            </span>
            <span className={`text-lg font-bold tabular-nums ${isRestituicao ? 'text-success' : isPagamento ? 'text-destructive' : ''}`}>
              {formatCurrency(Math.abs(resultado.resultado))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SecaoCalculoIR({ formulario, declaracao, onSaveForma, savingForma }: Props) {
  const navigate = useNavigate();
  const { features, loading: billingLoading } = useBillingStatus();

  // Pre-fill from formulario data
  const rendimentosEmprego = useMemo(() => {
    const arr = Array.isArray(formulario?.rendimentos_emprego) ? formulario.rendimentos_emprego : [];
    return arr.reduce((sum: number, r: any) => sum + (parseFloat(r.rendimento_bruto) || 0), 0);
  }, [formulario]);

  const totalDependentes = useMemo(() => {
    return Array.isArray(formulario?.dependentes) ? formulario.dependentes.length : 0;
  }, [formulario]);

  const totalMedicas = useMemo(() => {
    const arr = Array.isArray(formulario?.despesas_medicas) ? formulario.despesas_medicas : [];
    return arr.reduce((sum: number, d: any) => sum + (parseFloat(d.valor) || 0), 0);
  }, [formulario]);

  const totalEducacao = useMemo(() => {
    const arr = Array.isArray(formulario?.despesas_educacao) ? formulario.despesas_educacao : [];
    return arr.reduce((sum: number, d: any) => sum + (parseFloat(d.valor) || 0), 0);
  }, [formulario]);

  const [dados, setDados] = useState<DadosCalculo>({
    rendimentosTributaveis: rendimentosEmprego,
    inss: 0,
    dependentes: totalDependentes,
    despesasMedicas: totalMedicas,
    despesasEducacao: totalEducacao,
    educacaoPessoas: Math.max(1, totalDependentes + 1),
    previdenciaPrivadaPGBL: 0,
    pensaoAlimenticia: 0,
    livroCaixa: 0,
    outrasDeducoes: 0,
    impostoRetido: 0,
  });

  const [calculado, setCalculado] = useState<ComparativoIR | null>(null);

  const updateDado = (key: keyof DadosCalculo, value: string) => {
    const num = key === 'dependentes' || key === 'educacaoPessoas' ? parseInt(value) || 0 : parseFloat(value) || 0;
    setDados(prev => ({ ...prev, [key]: num }));
  };

  const handleCalcular = () => {
    setCalculado(calcularComparativo(dados));
  };

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!features.calculadora_ir) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Calculadora Premium</p>
          <p className="text-sm text-muted-foreground mb-4">
            A calculadora de IR automática está disponível apenas no plano Pro.
          </p>
          <Button size="sm" onClick={() => navigate('/planos')}>
            Fazer Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-accent" />
            Calculadora IR — Simplificada vs Completa
          </CardTitle>
          <p className="text-xs text-muted-foreground">Tabela progressiva IRPF 2026. Preencha os valores e clique em Calcular.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CurrencyInput
              label="Rendimentos Tributáveis"
              value={String(dados.rendimentosTributaveis || '')}
              onChange={v => updateDado('rendimentosTributaveis', v)}
              tooltip="Soma de todos os rendimentos tributáveis (salário, pró-labore, etc.)"
            />
            <CurrencyInput
              label="Contribuição INSS"
              value={String(dados.inss || '')}
              onChange={v => updateDado('inss', v)}
            />
            <CurrencyInput
              label="Imposto Retido na Fonte"
              value={String(dados.impostoRetido || '')}
              onChange={v => updateDado('impostoRetido', v)}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Nº de Dependentes</Label>
              <p className="text-[10px] text-muted-foreground">Cada um deduz {formatCurrency(2275.08)}</p>
              <Input
                type="number"
                min="0"
                value={String(dados.dependentes || '')}
                onChange={e => updateDado('dependentes', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <CurrencyInput
              label="Despesas Médicas"
              value={String(dados.despesasMedicas || '')}
              onChange={v => updateDado('despesasMedicas', v)}
              tooltip="Sem limite de dedução"
            />
            <CurrencyInput
              label="Despesas com Educação"
              value={String(dados.despesasEducacao || '')}
              onChange={v => updateDado('despesasEducacao', v)}
              tooltip={`Limite: ${formatCurrency(3561.50)} por pessoa`}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Pessoas com Educação</Label>
              <Input
                type="number"
                min="1"
                value={String(dados.educacaoPessoas || '')}
                onChange={e => updateDado('educacaoPessoas', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <CurrencyInput
              label="Previdência Privada (PGBL)"
              value={String(dados.previdenciaPrivadaPGBL || '')}
              onChange={v => updateDado('previdenciaPrivadaPGBL', v)}
              tooltip="Limite: 12% da renda tributável"
            />
            <CurrencyInput
              label="Pensão Alimentícia Judicial"
              value={String(dados.pensaoAlimenticia || '')}
              onChange={v => updateDado('pensaoAlimenticia', v)}
            />
            <CurrencyInput
              label="Livro-caixa (Autônomos)"
              value={String(dados.livroCaixa || '')}
              onChange={v => updateDado('livroCaixa', v)}
            />
            <CurrencyInput
              label="Outras Deduções Legais"
              value={String(dados.outrasDeducoes || '')}
              onChange={v => updateDado('outrasDeducoes', v)}
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleCalcular} className="gap-2">
              <Calculator className="h-4 w-4" /> Calcular Comparativo
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculado && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <ResultadoPanel
              titulo="DECLARAÇÃO SIMPLIFICADA"
              resultado={calculado.simplificada}
              isMelhor={calculado.melhorOpcao === 'simplificada'}
              desconto={`Desconto padrão: ${(DESCONTO_SIMPLIFICADO_PCT * 100).toFixed(0)}% — Teto: ${formatCurrency(TETO_DESCONTO_SIMPLIFICADO)}`}
            />
            <ResultadoPanel
              titulo="DECLARAÇÃO COMPLETA"
              resultado={calculado.completa}
              isMelhor={calculado.melhorOpcao === 'completa'}
              desconto="Suas deduções reais detalhadas"
            />
          </div>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-sm">
                  {calculado.melhorOpcao === 'completa' ? '✅ A Declaração Completa' : '✅ A Declaração Simplificada'} é mais vantajosa
                </p>
                <p className="text-xs text-muted-foreground">
                  Economia de <strong className="text-success">{formatCurrency(calculado.economia)}</strong> em relação à outra opção
                </p>
              </div>
              <Button
                onClick={() => onSaveForma(calculado.melhorOpcao)}
                disabled={savingForma}
                size="sm"
                className="gap-2 shrink-0"
              >
                <Save className="h-4 w-4" />
                {savingForma ? 'Salvando...' : 'Definir como Escolhida'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
