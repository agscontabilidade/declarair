import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCPF, formatCurrency } from '@/lib/formatters';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { PERFIL_LABELS, type PerfilFiscal } from '@/lib/checklistPorPerfil';

interface Props {
  formulario: any;
  isLoading: boolean;
}

const formStatusColors: Record<string, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-amber-100 text-amber-800',
  concluido: 'bg-emerald-100 text-emerald-800',
};

const NAO_ENVIADA = 'Informação não enviada';

function isEmpty(data: any): boolean {
  if (data === null || data === undefined || data === '') return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    return entries.length === 0;
  }
  return false;
}

function renderJsonList(data: any, labelMap?: Record<string, string>) {
  if (isEmpty(data)) return <p className="text-sm text-muted-foreground italic">{NAO_ENVIADA}</p>;

  if (Array.isArray(data)) {
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
    if (entries.length === 0) return <p className="text-sm text-muted-foreground italic">{NAO_ENVIADA}</p>;

    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => {
          if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
            return (
              <div key={k} className="mt-2">
                <p className="text-sm font-medium text-foreground capitalize mb-1">{k.replace(/_/g, ' ')}</p>
                {renderJsonList(v, labelMap)}
              </div>
            );
          }
          return (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
              <span className="font-medium">{typeof v === 'number' ? formatCurrency(v) : String(v)}</span>
            </div>
          );
        })}
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
  const statusLabel = status === 'concluido' ? 'Concluído' : status === 'em_andamento' ? 'Em Andamento' : 'Não Iniciado';

  const sections = [
    { key: 'dados_pessoais', title: 'Dados Pessoais', data: { estado_civil: formulario.estado_civil, conjuge_nome: formulario.conjuge_nome, conjuge_cpf: formulario.conjuge_cpf ? formatCPF(formulario.conjuge_cpf) : null } },
    { key: 'perfil_fiscal', title: 'Perfil Fiscal', data: formulario.perfil_fiscal },
    { key: 'dependentes', title: 'Dependentes', data: formulario.dependentes },
    { key: 'rendimentos_emprego', title: 'Rendimentos de Emprego', data: formulario.rendimentos_emprego },
    { key: 'rendimentos_autonomo', title: 'Rendimentos de Autônomo', data: formulario.rendimentos_autonomo },
    { key: 'rendimentos_aluguel', title: 'Rendimentos de Aluguel', data: formulario.rendimentos_aluguel },
    { key: 'outros_rendimentos', title: 'Outros Rendimentos', data: formulario.outros_rendimentos },
    { key: 'bens', title: 'Bens e Direitos', data: formulario.bens_direitos },
    { key: 'dividas', title: 'Dívidas e Ônus', data: formulario.dividas_onus },
    { key: 'despesas_medicas', title: 'Despesas Médicas', data: formulario.despesas_medicas },
    { key: 'despesas_educacao', title: 'Despesas com Educação', data: formulario.despesas_educacao },
    { key: 'previdencia', title: 'Previdência Privada', data: formulario.previdencia_privada },
    { key: 'adicionais', title: 'Informações Adicionais', data: formulario.informacoes_adicionais },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Formulário IR</CardTitle>
          <Badge className={formStatusColors[status] || formStatusColors.nao_iniciado}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sections.map(s => (
            <AccordionItem key={s.key} value={s.key}>
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  {s.title}
                  {isEmpty(s.data) && <span className="text-xs text-muted-foreground font-normal">(vazio)</span>}
                </div>
              </AccordionTrigger>
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
