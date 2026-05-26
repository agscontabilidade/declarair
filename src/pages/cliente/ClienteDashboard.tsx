import { lazy, Suspense } from 'react';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useClientePortal } from '@/hooks/useClientePortal';
import { StatusStepper } from '@/components/cliente-portal/StatusStepper';
import { ChatFlutuante } from '@/components/cliente-portal/ChatFlutuante';
import { FileText, ClipboardList, Upload, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { QueryError } from '@/components/ui/QueryError';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const EcacTutorialDialog = lazy(() => import('@/components/cliente-portal/EcacTutorialDialog'));

export default function ClienteDashboard() {
  const { profile, user } = useAuth();
  const { declaracao, checklist, formulario, statusStep, progressoFormulario, stepTimestamps, isLoading, isError, error, refetch } = useClientePortal({ includeTimestamps: true });
  // Supabase generated types may not yet expose `status_documentos`; cast through a typed shape.
  type DeclaracaoExtra = { status_documentos?: string | null; status?: string | null };
  const decl = declaracao as (typeof declaracao & DeclaracaoExtra) | null | undefined;
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
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Declaração IR {declaracao.ano_base}</p>
                <StatusStepper currentStep={statusStep} stepTimestamps={stepTimestamps} />
              </CardContent>
            </Card>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Informações Cadastrais */}
              <button
                type="button"
                onClick={() => navigate('/cliente/formulario')}
                className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
              >
                <Card
                  className={`shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${formulario?.status_preenchimento === 'concluido' ? 'border-success/30 bg-success/5' : ''}`}
                >
                  <CardContent className="flex flex-col items-center py-6 sm:py-8 text-center">
                    <ClipboardList className={`h-10 w-10 mb-3 ${formulario?.status_preenchimento === 'concluido' ? 'text-success' : 'text-primary'}`} />
                    <p className="font-medium">Informações Cadastrais</p>

                    <div className="w-full max-w-[140px] mt-3">
                      <div className="flex justify-between text-[10px] mb-1 font-medium text-muted-foreground uppercase tracking-wider">
                        <span>Status</span>
                        <span>{formulario?.status_preenchimento === 'concluido' ? '100%' : `${progressoFormulario}%`}</span>
                      </div>
                      <Progress value={formulario?.status_preenchimento === 'concluido' ? 100 : progressoFormulario} className="h-1.5" />
                    </div>

                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Badge className={`mt-3 cursor-help ${
                          formulario?.status_preenchimento === 'concluido' ? 'bg-success/15 text-success hover:bg-success/20' : 'bg-warning/15 text-warning hover:bg-warning/20'
                        }`}>
                          {formulario?.status_preenchimento === 'concluido' ? 'Preenchido' : 'Pendente'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        {formulario?.status_preenchimento === 'concluido'
                          ? 'Você já enviou seus dados cadastrais ao contador.'
                          : 'Clique no card para preencher seus dados pessoais, endereço, dependentes e chave Pix.'}
                      </TooltipContent>
                    </Tooltip>

                  </CardContent>
                </Card>
              </button>

              {/* Envio de Documentos */}
              <button
                type="button"
                onClick={() => navigate('/cliente/documentos')}
                className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
              >
                <Card
                  className={`shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${decl?.status_documentos === 'enviado' ? 'border-success/30 bg-success/5' : ''}`}
                >
                  <CardContent className="flex flex-col items-center py-6 sm:py-8 text-center">
                    <Upload className={`h-10 w-10 mb-3 ${decl?.status_documentos === 'enviado' ? 'text-success' : 'text-primary'}`} />
                    <p className="font-medium">Envio de Documentos</p>

                    <div className="w-full max-w-[140px] mt-3">
                      <div className="flex justify-between text-[10px] mb-1 font-medium text-muted-foreground uppercase tracking-wider">
                        <span>Documentos</span>
                        <span>{checklist.length}</span>
                      </div>
                      <Progress value={decl?.status_documentos === 'enviado' ? 100 : checklist.length > 0 ? 50 : 0} className="h-1.5" />
                    </div>

                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Badge className={`mt-3 cursor-help ${
                          decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
                            ? 'bg-success/15 text-success hover:bg-success/20'
                            : checklist.length > 0
                            ? 'bg-primary/15 text-primary hover:bg-primary/20'
                            : 'bg-warning/15 text-warning hover:bg-warning/20'
                        }`}>
                          {decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
                            ? 'Enviado ao Contador'
                            : checklist.length > 0
                            ? 'Pronto para Enviar'
                            : 'Pendente'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        {decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
                          ? 'Seus documentos já foram entregues ao contador para análise.'
                          : checklist.length > 0
                          ? 'Você já anexou arquivos. Clique no card para revisar e finalizar o envio.'
                          : 'Nenhum documento anexado ainda. Clique no card para começar o upload.'}
                      </TooltipContent>
                    </Tooltip>

                  </CardContent>
                </Card>
              </button>

              {/* Resultado */}
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className={`h-10 w-10 mb-3 ${declaracao.status === 'transmitida' ? 'text-success' : 'text-muted-foreground/40'}`} />
                  <p className="font-medium">Resultado Final</p>
                  {declaracao.status === 'transmitida' && declaracao.tipo_resultado ? (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <p className={`text-lg font-bold mt-1 cursor-help ${declaracao.tipo_resultado === 'restituicao' ? 'text-success' : declaracao.tipo_resultado === 'pagamento' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {STATUS_LABELS[declaracao.tipo_resultado]}: {declaracao.valor_resultado ? formatCurrency(Number(declaracao.valor_resultado)) : '—'}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        {declaracao.tipo_resultado === 'restituicao'
                          ? 'Valor que a Receita Federal vai te devolver. O pagamento segue o calendário oficial de lotes.'
                          : declaracao.tipo_resultado === 'pagamento'
                          ? 'Valor de imposto a pagar à Receita. Pode ser parcelado em até 8 cotas pelo aplicativo Meu Imposto de Renda.'
                          : 'Sem restituição nem imposto a pagar nesta declaração.'}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground mt-1 cursor-help">Aguardando transmissão</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        O resultado (restituição ou imposto a pagar) aparece aqui depois que seu contador transmitir a declaração à Receita.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CardContent>
              </Card>

            </div>


            {/* Card de Procuração Eletrônica */}
            <Card className="shadow-sm border-warning/30 bg-warning/5 overflow-hidden">
              <div className="md:flex items-center">
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div className="bg-warning/15 p-2 rounded-lg cursor-help">
                          <ShieldCheck className="h-5 w-5 text-warning" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] text-xs">
                        A procuração eletrônica permite que seu contador acompanhe sua declaração em tempo real direto no e-CAC e resolva pendências sem te incomodar.
                      </TooltipContent>
                    </Tooltip>
                    <h3 className="text-lg font-bold">Procuração Eletrônica e-CAC</h3>
                  </div>

                  <p className="text-muted-foreground text-sm max-w-2xl">
                    Cadastre uma procuração eletrônica na Receita Federal através do portal e-CAC usando sua senha <strong>gov.br</strong>. 
                    Isso permite que seu contador acompanhe sua declaração em tempo real e resolva qualquer pendência de forma muito mais ágil.
                  </p>
                </div>
                <div className="px-6 pb-6 md:pb-0 md:pr-8">
                  <Suspense fallback={null}>
                    <EcacTutorialDialog
                      trigger={
                        <Button
                          className="w-full md:w-auto shadow-md bg-warning text-warning-foreground hover:bg-warning/90"
                          title="Tutorial completo para cadastrar a procuração no portal e-CAC da Receita Federal"
                        >
                          Ver Passo a Passo
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      }
                    />
                  </Suspense>
                </div>
              </div>
            </Card>

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
