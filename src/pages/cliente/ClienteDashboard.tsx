import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useClientePortal } from '@/hooks/useClientePortal';
import { StatusStepper } from '@/components/cliente-portal/StatusStepper';
import { ChatFlutuante } from '@/components/cliente-portal/ChatFlutuante';
import { FileText, ClipboardList, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';

export default function ClienteDashboard() {
  const { profile, user } = useAuth();
  const { declaracao, checklist, formulario, statusStep, pendentes, isLoading } = useClientePortal();
  const navigate = useNavigate();

  const { unreadCount } = useChat(
    declaracao?.id,
    declaracao?.escritorio_id,
    profile.clienteId || undefined,
    'cliente',
    user?.id
  );

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
              <Card className="shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" onClick={() => navigate('/cliente/documentos')}>
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <Upload className="h-10 w-10 text-accent mb-3" />
                  <p className="font-medium">Documentos</p>
                  {pendentes.length > 0 ? (
                    <Badge className="mt-2 bg-warning/15 text-warning">{pendentes.length} pendente(s)</Badge>
                  ) : (
                    <div className="flex items-center gap-1 mt-2 text-success text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Tudo em dia
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Formulário IR */}
              <Card
                className={`shadow-sm transition-all duration-200 ${formulario?.status_preenchimento === 'concluido' ? 'opacity-80' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'}`}
                onClick={() => formulario?.status_preenchimento !== 'concluido' && navigate('/cliente/formulario')}
              >
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <ClipboardList className="h-10 w-10 text-primary mb-3" />
                  <p className="font-medium">{formulario?.status_preenchimento === 'concluido' ? 'Formulário Enviado ✓' : 'Formulário IR'}</p>
                  <Badge className={`mt-2 ${
                    formulario?.status_preenchimento === 'concluido' ? 'bg-success/15 text-success' :
                    formulario?.status_preenchimento === 'em_andamento' ? 'bg-warning/15 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {STATUS_LABELS[formulario?.status_preenchimento || 'nao_iniciado']}
                  </Badge>
                </CardContent>
              </Card>

              {/* Resultado */}
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <FileText className="h-10 w-10 text-success mb-3" />
                  <p className="font-medium">Resultado</p>
                  {declaracao.status === 'transmitida' && declaracao.tipo_resultado ? (
                    <p className={`text-lg font-bold mt-1 ${declaracao.tipo_resultado === 'restituicao' ? 'text-success' : declaracao.tipo_resultado === 'pagamento' ? 'text-destructive' : 'text-muted-foreground'}`}>
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
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Documentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pendentes.map((doc: any) => (
                      <li key={doc.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-warning" />
                        {doc.nome_documento}
                        {doc.obrigatorio && <Badge variant="outline" className="text-[10px] py-0">Obrigatório</Badge>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Floating chat */}
            {profile.clienteId && (
              <ChatFlutuante
                declaracaoId={declaracao.id}
                escritorioId={declaracao.escritorio_id}
                clienteId={profile.clienteId}
                unreadCount={unreadCount}
              />
            )}
          </>
        )}
      </div>
    </ClienteLayout>
  );
}
