import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useClientePortal } from '@/hooks/useClientePortal';
import { StatusStepper } from '@/components/cliente-portal/StatusStepper';
import { ChatFlutuante } from '@/components/cliente-portal/ChatFlutuante';
import { FileText, ClipboardList, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { QueryError } from '@/components/ui/QueryError';

export default function ClienteDashboard() {
  const { profile, user } = useAuth();
  const { declaracao, checklist, formulario, statusStep, pendentes, isLoading, isError, error, refetch } = useClientePortal();
  const navigate = useNavigate();

  const { unreadCount } = useChat(
    declaracao?.id,
    declaracao?.escritorio_id,
    profile.clienteId || undefined,
    'cliente',
    user?.id
  );

  if (isError) {
    return (
      <ClienteLayout>
        <QueryError message={error?.message} onRetry={() => refetch()} />
      </ClienteLayout>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Informações Cadastrais */}
              <Card 
                className={`shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${formulario?.status_preenchimento === 'concluido' ? 'border-success/30 bg-success/5' : ''}`}
                onClick={() => navigate('/cliente/formulario')}
              >
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <ClipboardList className={`h-10 w-10 mb-3 ${formulario?.status_preenchimento === 'concluido' ? 'text-success' : 'text-primary'}`} />
                  <p className="font-medium">Informações Cadastrais</p>
                  
                  <div className="w-full max-w-[140px] mt-3">
                    <div className="flex justify-between text-[10px] mb-1 font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Status</span>
                      <span>{formulario?.status_preenchimento === 'concluido' ? '100%' : '50%'}</span>
                    </div>
                    <Progress value={formulario?.status_preenchimento === 'concluido' ? 100 : 50} className="h-1.5" />
                  </div>

                  <Badge className={`mt-3 ${
                    formulario?.status_preenchimento === 'concluido' ? 'bg-success/15 text-success hover:bg-success/20' : 'bg-warning/15 text-warning hover:bg-warning/20'
                  }`}>
                    {formulario?.status_preenchimento === 'concluido' ? 'Preenchido' : 'Pendente'}
                  </Badge>
                </CardContent>
              </Card>

              {/* Envio de Documentos (Originalmente pendentes) */}
              <Card 
                className={`shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${(declaracao as any)?.status_documentos === 'enviado' ? 'border-success/30 bg-success/5' : ''}`}
                onClick={() => navigate('/cliente/documentos')}
              >
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <Upload className={`h-10 w-10 mb-3 ${(declaracao as any)?.status_documentos === 'enviado' ? 'text-success' : 'text-primary'}`} />
                  <p className="font-medium">Envio de Documentos</p>
                  
                  <div className="w-full max-w-[140px] mt-3">
                    <div className="flex justify-between text-[10px] mb-1 font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Documentos</span>
                      <span>{checklist.length}</span>
                    </div>
                    <Progress value={(declaracao as any)?.status_documentos === 'enviado' ? 100 : checklist.length > 0 ? 50 : 0} className="h-1.5" />
                  </div>

                  <Badge className={`mt-3 ${
                    (declaracao as any)?.status_documentos === 'enviado' || (declaracao as any)?.status === 'documentacao_recebida' || (declaracao as any)?.status === 'declaracao_pronta' || (declaracao as any)?.status === 'transmitida'
                      ? 'bg-success/15 text-success hover:bg-success/20' 
                      : checklist.length > 0 
                      ? 'bg-primary/15 text-primary hover:bg-primary/20' 
                      : 'bg-warning/15 text-warning hover:bg-warning/20'
                  }`}>
                    {(declaracao as any)?.status_documentos === 'enviado' || (declaracao as any)?.status === 'documentacao_recebida' || (declaracao as any)?.status === 'declaracao_pronta' || (declaracao as any)?.status === 'transmitida'
                      ? 'Enviado ao Contador' 
                      : checklist.length > 0 
                      ? 'Pronto para Enviar' 
                      : 'Pendente'}
                  </Badge>
                </CardContent>
              </Card>

              {/* Resultado */}
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className={`h-10 w-10 mb-3 ${declaracao.status === 'transmitida' ? 'text-success' : 'text-muted-foreground/40'}`} />
                  <p className="font-medium">Resultado Final</p>
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
