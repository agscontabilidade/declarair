import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlanGate } from '@/components/billing/BillingGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, BarChart3, Users, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';

type TipoRelatorio = 'declaracoes' | 'clientes' | 'cobrancas' | 'resumo';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function Relatorios() {
  const { profile } = useAuth();
  const [tipo, setTipo] = useState<TipoRelatorio>('resumo');
  const [ano, setAno] = useState(currentYear - 1);
  const [exporting, setExporting] = useState(false);

  const { data: resumo, isLoading } = useQuery({
    queryKey: ['relatorio-resumo', profile.escritorioId, ano],
    queryFn: async () => {
      const eid = profile.escritorioId!;
      const [clientes, declaracoes, cobrancas] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('escritorio_id', eid),
        supabase.from('declaracoes').select('id, status, tipo_resultado, valor_resultado').eq('escritorio_id', eid).eq('ano_base', ano),
        supabase.from('cobrancas').select('id, valor, status').eq('escritorio_id', eid),
      ]);

      const decls = declaracoes.data || [];
      const cobrs = cobrancas.data || [];
      const transmitidas = decls.filter(d => d.status === 'transmitida').length;
      const emAndamento = decls.filter(d => d.status !== 'transmitida').length;
      const totalRestituicao = decls.filter(d => d.tipo_resultado === 'restituicao').reduce((s, d) => s + (d.valor_resultado || 0), 0);
      const totalPagamento = decls.filter(d => d.tipo_resultado === 'pagamento').reduce((s, d) => s + (d.valor_resultado || 0), 0);
      const receitaTotal = cobrs.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor || 0), 0);
      const receitaPendente = cobrs.filter(c => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);

      return {
        totalClientes: clientes.count ?? 0,
        totalDeclaracoes: decls.length,
        transmitidas,
        emAndamento,
        totalRestituicao,
        totalPagamento,
        receitaTotal,
        receitaPendente,
      };
    },
    enabled: !!profile.escritorioId,
  });

  async function exportCSV(tipoExport: TipoRelatorio) {
    setExporting(true);
    try {
      const eid = profile.escritorioId!;
      let csvContent = '';
      let filename = '';

      if (tipoExport === 'clientes') {
        const { data } = await supabase.from('clientes').select('nome, cpf, email, telefone, status_onboarding, created_at').eq('escritorio_id', eid).order('nome');
        csvContent = 'Nome,CPF,Email,Telefone,Status,Cadastro\n' +
          (data || []).map(c => `"${c.nome}","${c.cpf}","${c.email || ''}","${c.telefone || ''}","${c.status_onboarding}","${new Date(c.created_at).toLocaleDateString('pt-BR')}"`).join('\n');
        filename = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (tipoExport === 'declaracoes') {
        const { data } = await supabase.from('declaracoes').select('ano_base, status, tipo_resultado, valor_resultado, data_transmissao, numero_recibo, created_at, clientes(nome, cpf)').eq('escritorio_id', eid).eq('ano_base', ano).order('created_at', { ascending: false });
        csvContent = 'Cliente,CPF,Ano Base,Status,Resultado,Valor,Recibo,Transmissão\n' +
          (data || []).map((d: any) => `"${d.clientes?.nome || ''}","${d.clientes?.cpf || ''}",${d.ano_base},"${d.status}","${d.tipo_resultado || ''}",${d.valor_resultado || 0},"${d.numero_recibo || ''}","${d.data_transmissao ? new Date(d.data_transmissao).toLocaleDateString('pt-BR') : ''}"`).join('\n');
        filename = `declaracoes_${ano}_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (tipoExport === 'cobrancas') {
        const { data } = await supabase.from('cobrancas').select('descricao, valor, status, data_vencimento, data_pagamento, created_at, clientes(nome)').eq('escritorio_id', eid).order('created_at', { ascending: false });
        csvContent = 'Cliente,Descrição,Valor,Status,Vencimento,Pagamento\n' +
          (data || []).map((c: any) => `"${c.clientes?.nome || ''}","${c.descricao}",${c.valor},"${c.status}","${new Date(c.data_vencimento).toLocaleDateString('pt-BR')}","${c.data_pagamento ? new Date(c.data_pagamento).toLocaleDateString('pt-BR') : ''}"`).join('\n');
        filename = `cobrancas_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      if (csvContent) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado com sucesso!');
      }
    } catch {
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <PlanGate requiredPlan="pro" featureName="Relatórios Avançados">
        <div className="space-y-6 max-w-6xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Relatórios</h1>
              <p className="text-muted-foreground">Visualize e exporte dados consolidados do escritório</p>
            </div>
            <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>Ano {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo Cards */}
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : resumo && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                      <p className="text-2xl font-bold">{resumo.totalClientes}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Declarações ({ano})</p>
                      <p className="text-2xl font-bold">{resumo.totalDeclaracoes}</p>
                      <p className="text-xs text-muted-foreground">{resumo.transmitidas} transmitidas</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita (pago)</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(resumo.receitaTotal)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(resumo.receitaPendente)} pendente</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-success/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Restituições</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(resumo.totalRestituicao)}</p>
                      <p className="text-xs text-destructive">{formatCurrency(resumo.totalPagamento)} a pagar</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-accent/30" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* Export section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exportar Relatórios</CardTitle>
              <CardDescription>Baixe seus dados em formato CSV para análise externa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-3">
                    <Users className="h-8 w-8 mx-auto text-primary" />
                    <h4 className="font-semibold">Clientes</h4>
                    <p className="text-xs text-muted-foreground">Lista completa de clientes com dados de contato</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV('clientes')} disabled={exporting}>
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-accent" />
                    <h4 className="font-semibold">Declarações {ano}</h4>
                    <p className="text-xs text-muted-foreground">Todas as declarações do ano selecionado</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV('declaracoes')} disabled={exporting}>
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-3">
                    <DollarSign className="h-8 w-8 mx-auto text-success" />
                    <h4 className="font-semibold">Cobranças</h4>
                    <p className="text-xs text-muted-foreground">Histórico completo de cobranças</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV('cobrancas')} disabled={exporting}>
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
