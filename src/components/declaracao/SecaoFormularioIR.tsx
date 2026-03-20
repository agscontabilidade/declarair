import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { STATUS_LABELS, formatCPF, formatCurrency } from '@/lib/formatters';
import { FileText, AlertCircle } from 'lucide-react';

interface Props {
  formulario: any;
  isLoading: boolean;
}

const formStatusColors: Record<string, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-amber-100 text-amber-800',
  concluido: 'bg-emerald-100 text-emerald-800',
};

function renderJsonList(data: any, labelMap?: Record<string, string>) {
  if (!data) return <p className="text-sm text-muted-foreground">Nenhum dado informado</p>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-sm text-muted-foreground">Nenhum item</p>;
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="p-3 border rounded-lg text-sm">
            {typeof item === 'object' ? (
              Object.entries(item).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{labelMap?.[k] || k.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{typeof v === 'number' ? formatCurrency(v) : String(v || '-')}</span>
                </div>
              ))
            ) : (
              <span>{String(item)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">Nenhum dado informado</p>;
    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
            <span className="font-medium">{typeof v === 'number' ? formatCurrency(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm">{String(data)}</p>;
}

export function SecaoFormularioIR({ formulario, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!formulario) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Cliente ainda não preencheu o formulário</p>
        </CardContent>
      </Card>
    );
  }

  const status = formulario.status_preenchimento || 'nao_iniciado';

  if (status === 'nao_iniciado') {
    return (
      <Card className="border-muted">
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Cliente ainda não preencheu o formulário</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'em_andamento') {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-foreground font-medium">Cliente está preenchendo o formulário...</p>
          <Badge className={formStatusColors.em_andamento + ' mt-2'}>Em Andamento</Badge>
        </CardContent>
      </Card>
    );
  }

  // Concluído: show data in accordions
  const sections = [
    { key: 'dados_pessoais', title: 'Dados Pessoais', data: { estado_civil: formulario.estado_civil, conjuge_nome: formulario.conjuge_nome, conjuge_cpf: formulario.conjuge_cpf ? formatCPF(formulario.conjuge_cpf) : null } },
    { key: 'dependentes', title: 'Dependentes', data: formulario.dependentes },
    { key: 'rendimentos', title: 'Rendimentos', data: { emprego: formulario.rendimentos_emprego, autonomo: formulario.rendimentos_autonomo, aluguel: formulario.rendimentos_aluguel, outros: formulario.outros_rendimentos } },
    { key: 'bens', title: 'Bens e Direitos', data: formulario.bens_direitos },
    { key: 'dividas', title: 'Dívidas e Ônus', data: formulario.dividas_onus },
    { key: 'deducoes', title: 'Deduções', data: { medicas: formulario.despesas_medicas, educacao: formulario.despesas_educacao, previdencia: formulario.previdencia_privada } },
    { key: 'adicionais', title: 'Informações Adicionais', data: formulario.informacoes_adicionais },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Formulário IR</CardTitle>
          <Badge className={formStatusColors.concluido}>Concluído</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sections.map(s => (
            <AccordionItem key={s.key} value={s.key}>
              <AccordionTrigger className="text-sm font-medium">{s.title}</AccordionTrigger>
              <AccordionContent>
                {renderJsonList(s.data)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
