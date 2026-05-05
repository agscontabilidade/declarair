import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Info, Wallet, ShieldAlert, Sparkles, Receipt, ListChecks,
  ArrowDownRight, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisualData {
  tipo?: 'analise_caixa' | 'analise' | 'riscos';
  resumo?: {
    total_origens: number;
    total_aplicacoes: number;
    saldo: number;
    estouro: boolean;
    percentual_utilizacao: number;
  };
  origens?: { label: string; valor: number }[];
  aplicacoes?: { label: string; valor: number }[];
  patrimonio?: {
    anterior: number;
    atual: number;
    variacao_valor: number;
    variacao_perc: number;
  };
  riscos_count?: { alto: number; medio: number; baixo: number };
  regime?: 'simplificada' | 'completa';
  economia_estimada?: number;
  rendimento_tributavel?: number;
  comparativo?: {
    simplificada: { base: number; ir: number };
    completa: { base: number; ir: number };
  };
  detalhes?: {
    [key: string]: string; // Dicionário de tooltips para campos específicos
  };
}

interface Props {
  resultado: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const InfoTooltip = ({ content }: { content?: string }) => {
  if (!content) return null;
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help hover:text-primary transition-colors" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] p-3 text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
};

export function VisualIAFiscal({ resultado }: Props) {
  const { textualContent, jsonData } = useMemo(() => {
    const jsonMatch = resultado.match(/```json\s*([\s\S]*?)\s*```/);
    let textual = resultado;
    let data: VisualData | null = null;

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

  // Se for Análise de Caixa
  if (jsonData.resumo && jsonData.patrimonio) {
    const { resumo, origens, aplicacoes, patrimonio, riscos_count, detalhes } = jsonData;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Visão 360º de Caixa
          </h3>
          <Badge variant="outline" className="bg-accent/5">IA Fiscal Engine</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`${resumo!.estouro ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-200 bg-emerald-50/30'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Saldo de Caixa
                  <InfoTooltip content={detalhes?.saldo || "Diferença entre tudo que entrou (Origens) e tudo que saiu ou foi investido (Aplicações). Se negativo, indica 'estouro de caixa'."} />
                </span>
                {resumo!.estouro ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo!.estouro ? 'text-destructive' : 'text-emerald-700'}`}>
                {formatCurrency(resumo!.saldo)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {resumo!.estouro ? '⚠️ Estouro detectado!' : '✅ Caixa compatível.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Variação Patrimonial
                <InfoTooltip content={detalhes?.patrimonio || "Crescimento ou redução do seu patrimônio líquido declarado entre o início e o fim do ano-base."} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-baseline gap-2">
                {formatCurrency(patrimonio!.atual)}
                <span className={`text-xs font-medium flex items-center ${patrimonio!.variacao_perc >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {patrimonio!.variacao_perc >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(patrimonio!.variacao_perc).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Anterior: {formatCurrency(patrimonio!.anterior)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" /> Nível de Risco
                  <InfoTooltip content={detalhes?.risco || "Indica a probabilidade de a declaração cair na malha fina com base nas inconsistências encontradas."} />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {riscos_count?.alto ? (
                  <Badge variant="destructive" className="h-8 px-2.5 animate-pulse">
                    {riscos_count.alto} Alta
                  </Badge>
                ) : null}
                <Badge variant={riscos_count?.medio ? 'secondary' : 'outline'} className="h-8 px-2.5">
                  {riscos_count?.medio || 0} Médio
                </Badge>
                <Badge variant="outline" className="h-8 px-2.5">
                  {riscos_count?.baixo || 0} Baixo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" /> Fluxo de Caixa
                <InfoTooltip content={detalhes?.fluxo || "Comparação visual entre as suas fontes de recursos (Origens) e os seus gastos/investimentos (Aplicações)."} />
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Origens', valor: resumo!.total_origens, fill: '#3b82f6' },
                  { name: 'Aplicações', valor: resumo!.total_aplicacoes, fill: resumo!.estouro ? '#ef4444' : '#10b981' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" /> Fontes de Origem
                <InfoTooltip content={detalhes?.origens || "Detalhamento de onde vieram os recursos declarados (Salários, Aluguéis, Isentos, etc.)."} />
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={origens}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="valor"
                    nameKey="label"
                  >
                    {origens!.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 px-1">
            <ListChecks className="h-4 w-4 text-primary" /> Análise Técnica e Recomendações
            <InfoTooltip content={detalhes?.analise_tecnica || "Diagnóstico detalhado realizado pela IA sobre a consistência dos dados e passos necessários para evitar a malha fina."} />
          </h4>
          <Card className="border-none bg-accent/5 overflow-hidden">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                <ReactMarkdown
                  components={{
                    h2: ({node, ...props}) => <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4 border-b pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-foreground/90 mt-6 mb-3 flex items-center gap-2" {...props} />,
                    p: ({node, children, ...props}) => {
                      const text = String(children);
                      if (text.includes('🚨 Risco Alto')) {
                        return (
                          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 my-4">
                            <p className="m-0 font-medium text-destructive flex items-center gap-2">
                              {children}
                            </p>
                          </div>
                        );
                      }
                      if (text.includes('⚠️ Risco Médio')) {
                        return (
                          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 my-4">
                            <p className="m-0 font-medium text-amber-600 flex items-center gap-2">
                              {children}
                            </p>
                          </div>
                        );
                      }
                      return <p className="mb-4" {...props}>{children}</p>;
                    },
                    li: ({node, ...props}) => <li className="mb-1" {...props} />
                  }}
                >
                  {textualContent}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Se for Análise Completa / Comparativo de Regimes
  if (jsonData.comparativo) {
    const { regime, economia_estimada, rendimento_tributavel, comparativo, riscos_count, detalhes } = jsonData;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Recomendação de Regime
                <InfoTooltip content={detalhes?.regime || "A IA calcula qual modelo de tributação gera o menor imposto a pagar ou a maior restituição para o seu caso."} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground uppercase">
                {regime === 'simplificada' ? 'Desconto Simplificado' : 'Deduções Legais (Completa)'}
              </div>
              <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4" /> Economia de {formatCurrency(economia_estimada!)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Status de Risco
                <InfoTooltip content={detalhes?.risco || "Resumo dos alertas detectados pela IA."} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant={riscos_count?.alto ? 'destructive' : 'outline'}>{riscos_count?.alto || 0} Crítico</Badge>
                <Badge variant={riscos_count?.medio ? 'secondary' : 'outline'}>{riscos_count?.medio || 0} Alerta</Badge>
                <Badge variant="outline">{riscos_count?.baixo || 0} Normal</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Diferença de base tributável: {formatCurrency(Math.abs(comparativo!.simplificada.base - comparativo!.completa.base))}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Simulação de Impacto Fiscal
              <InfoTooltip content={detalhes?.simulacao || "Comparativo do imposto devido em cada modalidade."} />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Simplificada', ir: comparativo!.simplificada.ir, color: regime === 'simplificada' ? '#3b82f6' : '#94a3b8' },
                  { name: 'Completa', ir: comparativo!.completa.ir, color: regime === 'completa' ? '#3b82f6' : '#94a3b8' }
                ]}
                margin={{ left: 40, right: 40 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{fill: 'transparent'}} />
                <Bar dataKey="ir" radius={[0, 4, 4, 0]} barSize={40}>
                  { [0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? (regime === 'simplificada' ? '#3b82f6' : '#cbd5e1') : (regime === 'completa' ? '#3b82f6' : '#cbd5e1')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="prose prose-sm max-w-none dark:prose-invert mt-6">
          <ReactMarkdown>{textualContent}</ReactMarkdown>
        </div>
      </motion.div>
    );
  }

  // Fallback para qualquer outro tipo (Riscos, Deduções)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {jsonData.riscos_count && (
          <div className="flex gap-2">
            <Badge variant={jsonData.riscos_count.alto > 0 ? 'destructive' : 'outline'}>{jsonData.riscos_count.alto} Alta</Badge>
            <Badge variant={jsonData.riscos_count.medio > 0 ? 'secondary' : 'outline'}>{jsonData.riscos_count.medio} Média</Badge>
          </div>
        )}
      </div>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{textualContent}</ReactMarkdown>
      </div>
    </div>
  );
}