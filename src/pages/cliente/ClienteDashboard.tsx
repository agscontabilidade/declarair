import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useClientePortal } from '@/hooks/useClientePortal';
import { StatusStepper } from '@/components/cliente-portal/StatusStepper';
import { FileText, ClipboardList, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';

export default function ClienteDashboard() {
  const { profile } = useAuth();
  const { declaracao, checklist, formulario, statusStep, pendentes, isLoading } = useClientePortal();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Olá, {profile.nome || 'Cliente'}!
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe o status da sua declaração de IR</p>
        </div>

        {!declaracao ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Seu contador ainda não criou sua declaração</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Aguarde o contato do seu escritório de contabilidade</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Stepper */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Declaração IR {declaracao.ano_base}</p>
                <StatusStepper currentStep={statusStep} />
              </CardContent>
            </Card>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Documentos Pendentes */}
              <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/cliente/documentos')}>
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <Upload className="h-10 w-10 text-accent mb-3" />
                  <p className="font-medium">Documentos</p>
                  {pendentes.length > 0 ? (
                    <Badge className="mt-2 bg-amber-100 text-amber-800">{pendentes.length} pendente(s)</Badge>
                  ) : (
                    <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Tudo em dia
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Formulário IR */}
              <Card
                className={`shadow-sm transition-shadow ${formulario?.status_preenchimento === 'concluido' ? 'opacity-80' : 'cursor-pointer hover:shadow-md'}`}
                onClick={() => formulario?.status_preenchimento !== 'concluido' && navigate('/cliente/formulario')}
              >
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <ClipboardList className="h-10 w-10 text-primary mb-3" />
                  <p className="font-medium">{formulario?.status_preenchimento === 'concluido' ? 'Formulário Enviado ✓' : 'Formulário IR'}</p>
                  <Badge className={`mt-2 ${
                    formulario?.status_preenchimento === 'concluido' ? 'bg-emerald-100 text-emerald-800' :
                    formulario?.status_preenchimento === 'em_andamento' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_LABELS[formulario?.status_preenchimento || 'nao_iniciado']}
                  </Badge>
                </CardContent>
              </Card>

              {/* Resultado */}
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <FileText className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="font-medium">Resultado</p>
                  {declaracao.status === 'transmitida' && declaracao.tipo_resultado ? (
                    <p className={`text-lg font-bold mt-1 ${declaracao.tipo_resultado === 'restituicao' ? 'text-emerald-600' : declaracao.tipo_resultado === 'pagamento' ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {STATUS_LABELS[declaracao.tipo_resultado]}: {declaracao.valor_resultado ? formatCurrency(Number(declaracao.valor_resultado)) : '—'}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Aguardando transmissão</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Checklist pendente */}
            {pendentes.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Documentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pendentes.map((doc: any) => (
                      <li key={doc.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        {doc.nome_documento}
                        {doc.obrigatorio && <Badge variant="outline" className="text-[10px] py-0">Obrigatório</Badge>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </ClienteLayout>
  );
}
