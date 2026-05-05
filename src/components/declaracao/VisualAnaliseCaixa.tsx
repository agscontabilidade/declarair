import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Info, Wallet, ShieldAlert, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VisualAnaliseData {
  resumo: {
    total_origens: number;
    total_aplicacoes: number;
    saldo: number;
    estouro: boolean;
    percentual_utilizacao: number;
  };
  origens: { label: string; valor: number }[];
  aplicacoes: { label: string; valor: number }[];
  patrimonio: {
    anterior: number;
    atual: number;
    variacao_valor: number;
    variacao_perc: number;
  };
  riscos_count: { alto: number; medio: number; baixo: number };
}

interface Props {
  resultado: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function VisualAnaliseCaixa({ resultado }: Props) {
  const { textualContent, jsonData } = useMemo(() => {
    const jsonMatch = resultado.match(/```json\s*([\s\S]*?)\s*```/);
    let textual = resultado;
    let data: VisualAnaliseData | null = null;

    if (jsonMatch) {
      try {
        data = JSON.parse(jsonMatch[1]);
        textual = resultado.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Erro ao parsear JSON da análise:", e);
      }
    }

    return { textualContent: textual, jsonData: data };
  }, [resultado]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (!jsonData) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{resultado}</ReactMarkdown>
      </div>
    );
  }

  const { resumo, origens, aplicacoes, patrimonio, riscos_count } = jsonData;

  return (
    <div className="space-y-6">
      {/* 360 View Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${resumo.estouro ? 'border-destructive bg-destructive/5' : 'border-emerald-200 bg-emerald-50/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center justify-between">
              Saldo de Caixa
              {resumo.estouro ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.estouro ? 'text-destructive' : 'text-emerald-700'}`}>
              {formatCurrency(resumo.saldo)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {resumo.estouro ? '⚠️ Atenção: Aplicações superam as origens.' : '✅ Saldo compatível com a variação patrimonial.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Evolução Patrimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-baseline gap-2">
              {formatCurrency(patrimonio.atual)}
              <span className={`text-xs font-medium flex items-center ${patrimonio.variacao_perc >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {patrimonio.variacao_perc >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(patrimonio.variacao_perc).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Anterior: {formatCurrency(patrimonio.anterior)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Riscos Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant={riscos_count.alto > 0 ? 'destructive' : 'outline'} className="h-8 px-3">
                {riscos_count.alto} Alta
              </Badge>
              <Badge variant={riscos_count.medio > 0 ? 'secondary' : 'outline'} className="h-8 px-3">
                {riscos_count.medio} Médio
              </Badge>
              <Badge variant="outline" className="h-8 px-3">
                {riscos_count.baixo} Baixo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Comparativo Origens vs Aplicações
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Origens', valor: resumo.total_origens, fill: '#3b82f6' },
                { name: 'Aplicações', valor: resumo.total_aplicacoes, fill: resumo.estouro ? '#ef4444' : '#10b981' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={10} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" /> Composição das Origens
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={origens}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor"
                  nameKey="label"
                >
                  {origens.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Aplicações e Riscos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500" /> Detalhamento e Recomendações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{textualContent}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}