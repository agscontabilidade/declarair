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
  ArrowDownRight, HelpCircle, User, Building, Scale,
  AlertCircle, Lightbulb, Target, FileCheck2, XCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
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
    [key: string]: string;
  };
  secoes_analise?: {
    id: string;
    titulo: string;
    icone?: string;
    status: 'ok' | 'atencao' | 'critico';
    resumo: string;
    pontos: string[];
    tooltip?: string;
  }[];
  recomendacoes?: {
    prioridade: 'alta' | 'media' | 'baixa';
    acao: string;
    motivo?: string;
    base_legal?: string;
  }[];
  conclusao?: {
    veredito: 'transmitir' | 'ajustar' | 'nao_transmitir';
    mensagem: string;
  };
}

interface Props {
  resultado: string;
  /** Dados estruturados pré-parseados (preferenciais sobre o JSON inline) */
  jsonOverride?: VisualData | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Pré-processa o texto da IA para garantir parágrafos espaçados e separação visual
// entre subtemas, evitando "parede de texto" no markdown final.
function prepareText(raw: string): string {
  let t = raw.replace(/\r\n/g, '\n').trim();
  // Garante linha em branco antes de marcadores comuns que a IA usa
  t = t.replace(/(?<!\n)\n(🚨|⚠️|✅|🔴|🟡|🔵)/g, '\n\n$1');
  // Adiciona quebra antes de "Risco" / "Aquisição" / "Patrimônio em" em linha
  t = t.replace(/(?<!\n)\n(\*\*(?:Risco|Aquisição|Alienação|Patrimônio em|Variação|TOTAL|Saldo de|Resultado:|Origens|Aplicações))/g, '\n\n$1');
  // Garante linha em branco antes de cabeçalhos
  t = t.replace(/(?<!\n)\n(#{1,4}\s)/g, '\n\n$1');
  // Colapsa múltiplas linhas em blocos consistentes
  t = t.replace(/\n{3,}/g, '\n\n');
  return t;
}

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

export function VisualIAFiscal({ resultado, jsonOverride }: Props) {
  const { textualContent, jsonData } = useMemo(() => {
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    const matches = Array.from(resultado.matchAll(jsonRegex));
    const textual = resultado.replace(jsonRegex, '').trim();
    let data: VisualData | null = jsonOverride ?? null;

    if (!data && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      try {
        data = JSON.parse(lastMatch[1]);
      } catch {
        // tenta reparo simples
        try {
          data = JSON.parse(lastMatch[1].replace(/,\s*([}\]])/g, '$1'));
        } catch {
          data = null;
        }
      }
    }

    return { textualContent: textual, jsonData: data };
  }, [resultado, jsonOverride]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (!jsonData) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
        <ReactMarkdown>{textualContent}</ReactMarkdown>
      </div>
    );
  }

  // Se for Análise de Caixa — render tolerante: basta UMA das chaves estar presente
  const hasCaixaData = !!(jsonData.resumo || jsonData.patrimonio || jsonData.riscos_count || (jsonData.origens && jsonData.origens.length));
  if (hasCaixaData && !jsonData.comparativo) {
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
          <Card className={`${resumo?.estouro ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-200 bg-emerald-50/30'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Saldo de Caixa
                  <InfoTooltip content={detalhes?.saldo || "Diferença entre tudo que entrou (Origens) e tudo que saiu ou foi investido (Aplicações). Se negativo, indica 'estouro de caixa'."} />
                </span>
                {resumo?.estouro ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo?.estouro ? 'text-destructive' : 'text-emerald-700'}`}>
                {typeof resumo?.saldo === 'number' ? formatCurrency(resumo.saldo) : '—'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {resumo?.estouro ? '⚠️ Estouro detectado!' : resumo ? '✅ Caixa compatível.' : 'Dado indisponível.'}
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
              {(() => {
                const atualOk = typeof patrimonio?.atual === 'number' && Number.isFinite(patrimonio.atual);
                const antOk = typeof patrimonio?.anterior === 'number' && Number.isFinite(patrimonio.anterior);
                const percOk = typeof patrimonio?.variacao_perc === 'number' && Number.isFinite(patrimonio.variacao_perc);
                if (!atualOk && !antOk) {
                  return (
                    <>
                      <div className="text-2xl font-bold text-muted-foreground">—</div>
                      <p className="text-[11px] text-muted-foreground mt-1">Dado indisponível na análise.</p>
                    </>
                  );
                }
                return (
                  <>
                    <div className="text-2xl font-bold flex items-baseline gap-2 flex-wrap">
                      {atualOk ? formatCurrency(patrimonio!.atual!) : <span className="text-muted-foreground">—</span>}
                      {percOk && (
                        <span className={`text-xs font-medium flex items-center ${patrimonio!.variacao_perc! >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {patrimonio!.variacao_perc! >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(patrimonio!.variacao_perc!).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {antOk ? `Anterior: ${formatCurrency(patrimonio!.anterior!)}` : 'Patrimônio anterior indisponível.'}
                    </p>
                  </>
                );
              })()}
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

        {(resumo || (origens && origens.length > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resumo && (
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
                      { name: 'Origens', valor: resumo.total_origens, fill: '#3b82f6' },
                      { name: 'Aplicações', valor: resumo.total_aplicacoes, fill: resumo.estouro ? '#ef4444' : '#10b981' }
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
            )}

            {origens && origens.length > 0 && (
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
                        {origens.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        <Separator className="my-6" />

        <AnaliseTecnicaVisual 
          secoes={jsonData.secoes_analise} 
          recomendacoes={jsonData.recomendacoes}
          conclusao={jsonData.conclusao}
          detalhes={detalhes}
          textualFallback={textualContent}
        />
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

// ===== Sub-componente: Análise Técnica Visual =====
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User, wallet: Wallet, trending: TrendingUp, shield: ShieldAlert,
  receipt: Receipt, building: Building, scale: Scale,
};

const STATUS_CONFIG = {
  ok: { 
    label: 'Conforme', icon: CheckCircle2, 
    border: 'border-emerald-200', bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    iconColor: 'text-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    accent: 'bg-emerald-500'
  },
  atencao: { 
    label: 'Atenção', icon: AlertCircle, 
    border: 'border-amber-200', bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    iconColor: 'text-amber-600', badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    accent: 'bg-amber-500'
  },
  critico: { 
    label: 'Crítico', icon: XCircle, 
    border: 'border-destructive/30', bg: 'bg-destructive/5',
    iconColor: 'text-destructive', badgeBg: 'bg-destructive/10 text-destructive',
    accent: 'bg-destructive'
  },
};

const PRIORIDADE_CONFIG = {
  alta: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Prioridade Alta', emoji: '🔴' },
  media: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20', label: 'Prioridade Média', emoji: '🟡' },
  baixa: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20', label: 'Prioridade Baixa', emoji: '🔵' },
};

const VEREDITO_CONFIG = {
  transmitir: { 
    label: 'Pronto para Transmissão', icon: CheckCircle2, 
    bg: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200', 
    iconColor: 'text-emerald-600', textColor: 'text-emerald-700 dark:text-emerald-400'
  },
  ajustar: { 
    label: 'Ajustes Necessários', icon: AlertTriangle, 
    bg: 'from-amber-500/10 to-amber-500/5 border-amber-200', 
    iconColor: 'text-amber-600', textColor: 'text-amber-700 dark:text-amber-400'
  },
  nao_transmitir: { 
    label: 'Não Transmitir', icon: XCircle, 
    bg: 'from-destructive/10 to-destructive/5 border-destructive/30', 
    iconColor: 'text-destructive', textColor: 'text-destructive'
  },
};

interface AnaliseTecnicaVisualProps {
  secoes?: VisualData['secoes_analise'];
  recomendacoes?: VisualData['recomendacoes'];
  conclusao?: VisualData['conclusao'];
  detalhes?: VisualData['detalhes'];
  textualFallback: string;
}

function AnaliseTecnicaVisual({ secoes, recomendacoes, conclusao, detalhes, textualFallback }: AnaliseTecnicaVisualProps) {
  const hasStructured = (secoes && secoes.length > 0) || (recomendacoes && recomendacoes.length > 0) || conclusao;

  if (!hasStructured) {
    // Fallback para análises antigas que não têm estrutura
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 px-1">
          <ListChecks className="h-4 w-4 text-primary" /> Análise Técnica e Recomendações
          <InfoTooltip content={detalhes?.analise_tecnica || "Diagnóstico detalhado da IA."} />
        </h4>
        <Card className="border-none bg-accent/5">
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{textualFallback}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold flex items-center gap-2 px-1">
        <ListChecks className="h-4 w-4 text-primary" /> Análise Técnica e Recomendações
        <InfoTooltip content={detalhes?.analise_tecnica || "Diagnóstico estruturado por temas, com recomendações priorizadas e veredito final da IA."} />
      </h4>

      {/* Cards de Seções por Tema */}
      {secoes && secoes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secoes.map((secao, idx) => {
            const cfg = STATUS_CONFIG[secao.status] || STATUS_CONFIG.ok;
            const Icon = ICON_MAP[secao.icone || ''] || FileCheck2;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={secao.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`relative overflow-hidden border ${cfg.border} ${cfg.bg} h-full`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent}`} />
                  <CardHeader className="pb-2 pl-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${cfg.iconColor}`} />
                        <CardTitle className="text-sm font-semibold truncate">{secao.titulo}</CardTitle>
                        {secao.tooltip && <InfoTooltip content={secao.tooltip} />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badgeBg} shrink-0`}>
                        <StatusIcon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-5 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{secao.resumo}</p>
                    {secao.pontos && secao.pontos.length > 0 && (
                      <ul className="space-y-1.5">
                        {secao.pontos.map((p, i) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${cfg.accent}`} />
                            <span className="text-foreground/80">{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recomendações Priorizadas */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Plano de Ação Recomendado
              <InfoTooltip content="Lista priorizada das ações que o contador deve tomar antes de transmitir a declaração." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recomendacoes.map((rec, i) => {
              const cfg = PRIORIDADE_CONFIG[rec.prioridade] || PRIORIDADE_CONFIG.media;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-3 rounded-lg border ${cfg.bg} flex items-start gap-3`}
                >
                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                    <Target className={`h-4 w-4 ${cfg.color}`} />
                    <span className="text-[9px] font-bold uppercase">{rec.prioridade}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground leading-snug">{rec.acao}</p>
                    {rec.motivo && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.motivo}</p>
                    )}
                    {rec.base_legal && (
                      <p className="text-[10px] text-muted-foreground/70 italic">📖 {rec.base_legal}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Veredito Final */}
      {conclusao && (() => {
        const cfg = VEREDITO_CONFIG[conclusao.veredito] || VEREDITO_CONFIG.ajustar;
        const Icon = cfg.icon;
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`bg-gradient-to-r ${cfg.bg} border`}>
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full bg-background flex items-center justify-center shrink-0 ${cfg.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider ${cfg.textColor}`}>Veredito Final da IA</p>
                  <p className={`text-base font-bold ${cfg.textColor}`}>{cfg.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{conclusao.mensagem}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* Texto adicional (cálculos detalhados) - card legível e auto-explicativo */}
      {textualFallback && textualFallback.trim().length > 100 && (
        <div className="mt-8 space-y-3">
          <h4 className="text-xs font-semibold flex items-center gap-2 px-1 text-muted-foreground uppercase tracking-wider">
            <Info className="h-3 w-3" /> Detalhamento Técnico Completo
            <InfoTooltip content="Texto técnico completo gerado pela IA. Útil para revisar os cálculos, fundamentos legais e rastros de cada conclusão." />
          </h4>
          <Card className="border bg-card">
            <CardContent className="pt-8 pb-8 px-6 md:px-10">
              <article className="prose prose-base max-w-3xl mx-auto dark:prose-invert
                prose-headings:font-bold prose-headings:text-foreground
                prose-headings:tracking-tight prose-headings:scroll-mt-20
                prose-h1:text-xl prose-h1:mt-0 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b
                prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60
                prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary
                prose-h4:text-sm prose-h4:mt-6 prose-h4:mb-2 prose-h4:uppercase prose-h4:tracking-wider prose-h4:text-muted-foreground
                prose-p:text-foreground/90 prose-p:my-4 prose-p:leading-7
                prose-li:text-foreground/90 prose-li:my-2 prose-li:leading-7 prose-li:marker:text-primary/60
                prose-ul:my-4 prose-ul:space-y-1 prose-ol:my-4 prose-ol:space-y-1
                prose-strong:text-foreground prose-strong:font-semibold
                prose-em:text-foreground/80
                prose-hr:my-8 prose-hr:border-border/50
                prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                  {prepareText(textualFallback)}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
