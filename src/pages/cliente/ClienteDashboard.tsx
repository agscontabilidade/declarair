import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useClientePortal } from '@/hooks/useClientePortal';
import { StatusStepper } from '@/components/cliente-portal/StatusStepper';
import { ChatFlutuante } from '@/components/cliente-portal/ChatFlutuante';
import { FileText, ClipboardList, Upload, AlertCircle, CheckCircle2, ShieldCheck, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { QueryError } from '@/components/ui/QueryError';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useState } from 'react';
import passo1Img from '@/assets/ecac/passo-1.jpg';
import passo2Img from '@/assets/ecac/passo-2.jpg';
import passo3Img from '@/assets/ecac/passo-3.jpg';
import passo4Img from '@/assets/ecac/passo-4.jpg';
import passo5Img from '@/assets/ecac/passo-5.jpg';
import passo7Img from '@/assets/ecac/passo-7.jpg';
import passo8Img from '@/assets/ecac/passo-8.jpg';
import passo9Img from '@/assets/ecac/passo-9.jpg';

export default function ClienteDashboard() {
  const { profile, user } = useAuth();
  const { declaracao, checklist, formulario, statusStep, pendentes, progressoFormulario, stepTimestamps, isLoading, isError, error, refetch } = useClientePortal();
  // Supabase generated types may not yet expose `status_documentos`; cast through a typed shape.
  type DeclaracaoExtra = { status_documentos?: string | null; status?: string | null };
  const decl = declaracao as (typeof declaracao & DeclaracaoExtra) | null | undefined;
  const navigate = useNavigate();
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Antes de começar",
      description: "Acesse o Portal e-CAC com sua conta gov.br nível Prata ou Ouro.",
      image: null,
      content: (
        <div className="space-y-4">
          <p className="text-sm">Acesse o link oficial do e-CAC da Receita Federal:</p>
          <a
            href="https://cav.receita.fazenda.gov.br/ecac/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-2 font-medium text-sm break-all"
          >
            cav.receita.fazenda.gov.br/ecac/ <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
          <div className="bg-primary/5 p-4 rounded-lg text-sm border border-primary/20">
            <strong>Importante:</strong> O acesso deve ser feito com sua conta <strong>gov.br nível Prata ou Ouro</strong>. Caso ainda não tenha esse nível, faça a verificação pelo aplicativo gov.br.
          </div>
        </div>
      )
    },
    {
      title: "Passo 1: Autorizações de Acesso",
      description: 'No menu inicial do e-CAC, clique em "Autorizações de Acesso (Procurações)".',
      image: passo1Img,
      content: (
        <p className="text-sm">Logo após o login, na tela inicial do e-CAC, localize e clique no card <strong>"Autorizações de Acesso (Procurações)"</strong>.</p>
      )
    },
    {
      title: "Passo 2: Minhas Autorizações de Acesso",
      description: 'Em seguida, clique em "Minhas Autorizações de Acesso".',
      image: passo2Img,
      content: (
        <p className="text-sm">Na próxima tela, no menu lateral ou na lista de opções, clique em <strong>"Minhas Autorizações de Acesso"</strong>.</p>
      )
    },
    {
      title: "Passo 3: Nova Autorização",
      description: 'Clique no botão "+ Nova Autorização".',
      image: passo3Img,
      content: (
        <p className="text-sm">Você verá a lista de autorizações já existentes (se houver). Clique no botão verde <strong>"+ Nova Autorização"</strong> no canto superior direito.</p>
      )
    },
    {
      title: "Passo 4: Dados do Procurador",
      description: "Informe o CPF do contador e a validade da autorização.",
      image: passo4Img,
      content: (
        <div className="space-y-3 text-sm">
          <p>Preencha os campos com os dados do seu contador:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">CPF</strong> da pessoa autorizada (seu contador)</li>
            <li><strong className="text-foreground">Validade</strong> da autorização</li>
          </ul>
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            💡 <strong>Sugestão:</strong> Validade de <strong>5 anos</strong>. Pode ser cancelada a qualquer momento.
          </div>
          <p>Clique em <strong>"Avançar"</strong>.</p>
        </div>
      )
    },
    {
      title: "Passo 5: Selecionar Serviços",
      description: 'Na etapa de serviços, clique em "Selecionar Serviços".',
      image: passo5Img,
      content: (
        <p className="text-sm">Leia as informações sobre os efeitos da autorização e clique no botão <strong>"Selecionar Serviços"</strong>.</p>
      )
    },
    {
      title: "Passo 6: Marcar os Serviços",
      description: "Selecione os serviços orientados pelo escritório.",
      image: null,
      content: (
        <div className="space-y-3 text-sm">
          <p>Marque os seguintes serviços (todos relacionados ao IRPF):</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground max-h-64 overflow-y-auto bg-muted/40 rounded-lg p-3">
            <li>Atualização de Dados Bancários p/ Restituição – <span className="font-mono text-xs">Cód. 00082</span></li>
            <li>Cópia de Declaração – <span className="font-mono text-xs">Cód. 00003</span></li>
            <li>Declaração DIRPF Pré-Preenchida – <span className="font-mono text-xs">Cód. 00098</span></li>
            <li>Declarações - DIRPF – <span className="font-mono text-xs">Cód. 00011</span></li>
            <li>Entregar Arquivo de Dados - Obrigação Acessória – <span className="font-mono text-xs">Cód. 00120</span></li>
            <li>Fontes Pagadoras – <span className="font-mono text-xs">Cód. 00021</span></li>
            <li>IRPF - Carnê Leão Web – <span className="font-mono text-xs">Cód. 00204</span></li>
            <li>Meu Imposto de Renda – <span className="font-mono text-xs">Cód. 00107</span></li>
            <li>Notificações e Autos relativos à entrega de declarações – <span className="font-mono text-xs">Cód. 00088</span></li>
            <li>Opção de Impressão do IRPF – <span className="font-mono text-xs">Cód. 00055</span></li>
            <li>Pagamentos - Comprovante de Arrecadação – <span className="font-mono text-xs">Cód. 00004</span></li>
            <li>Situação Fiscal do Contribuinte – <span className="font-mono text-xs">Cód. 00002</span></li>
          </ol>
        </div>
      )
    },
    {
      title: "Passo 7: Revisar Autorização",
      description: "Confira as informações e siga para a etapa de assinatura.",
      image: passo7Img,
      content: (
        <p className="text-sm">Revise os dados do procurador, prazo de validade e os serviços selecionados. Se estiver tudo certo, prossiga para a <strong>etapa de assinatura</strong>.</p>
      )
    },
    {
      title: "Passo 8: Autorizar via gov.br",
      description: "No Portal de Assinatura gov.br, informe o código recebido no aplicativo.",
      image: passo8Img,
      content: (
        <p className="text-sm">Você será redirecionado para o <strong>Portal de Assinatura gov.br</strong>. Abra o aplicativo gov.br no seu celular, copie o código exibido e cole no campo. Em seguida, clique em <strong>"Autorizar"</strong>.</p>
      )
    },
    {
      title: "Passo 9: Pronto!",
      description: "Autorização registrada com sucesso.",
      image: passo9Img,
      content: (
        <div className="space-y-4">
          <div className="bg-success/10 p-4 rounded-lg border border-success/20">
            <p className="text-sm">
              ✅ <strong>Autorização registrada com sucesso!</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Após a assinatura, a procuração eletrônica fica imediatamente ativa. Avise seu contador para que ele possa dar seguimento aos procedimentos da sua declaração.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNextTutorial = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
    }
  };

  const handlePrevTutorial = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
    }
  };

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
                          statusStep === 2 && decl?.status === 'documentacao_recebida'
                            ? 'bg-destructive/15 text-destructive hover:bg-destructive/20'
                            : decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
                            ? 'bg-success/15 text-success hover:bg-success/20'
                            : checklist.length > 0
                            ? 'bg-primary/15 text-primary hover:bg-primary/20'
                            : 'bg-warning/15 text-warning hover:bg-warning/20'
                        }`}>
                          {statusStep === 2 && decl?.status === 'documentacao_recebida'
                            ? 'Pendente de Reenvio'
                            : decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
                            ? 'Enviado ao Contador'
                            : checklist.length > 0
                            ? 'Pronto para Enviar'
                            : 'Pendente'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        {statusStep === 2 && decl?.status === 'documentacao_recebida'
                          ? 'Seu contador solicitou novos documentos. Clique no card para enviar.'
                          : decl?.status_documentos === 'enviado' || decl?.status === 'documentacao_recebida' || decl?.status === 'declaracao_pronta' || decl?.status === 'transmitida'
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
                    <div className="bg-warning/15 p-2 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-warning" />
                    </div>
                    <h3 className="text-lg font-bold">Procuração Eletrônica e-CAC</h3>
                  </div>
                  <p className="text-muted-foreground text-sm max-w-2xl">
                    Cadastre uma procuração eletrônica na Receita Federal através do portal e-CAC usando sua senha <strong>gov.br</strong>. 
                    Isso permite que seu contador acompanhe sua declaração em tempo real e resolva qualquer pendência de forma muito mais ágil.
                  </p>
                </div>
                <div className="px-6 pb-6 md:pb-0 md:pr-8">
                  <Dialog onOpenChange={(open) => !open && setCurrentTutorialStep(0)}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full md:w-auto shadow-md bg-warning text-warning-foreground hover:bg-warning/90"
                        title="Tutorial completo para cadastrar a procuração no portal e-CAC da Receita Federal"
                      >
                        Ver Passo a Passo
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </DialogTrigger>


                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                          <ShieldCheck className="h-6 w-6 text-primary" />
                          Tutorial de Procuração e-CAC
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="mt-6">
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 gap-1">
                          {tutorialSteps.map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i <= currentTutorialStep ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Step Content */}
                        <div className="min-h-[300px] flex flex-col">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold mb-2">{tutorialSteps[currentTutorialStep].title}</h4>
                            <p className="text-muted-foreground mb-6">{tutorialSteps[currentTutorialStep].description}</p>
                            
                            {tutorialSteps[currentTutorialStep].image && (
                              <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 shadow-sm">
                                <img
                                  src={tutorialSteps[currentTutorialStep].image as string}
                                  alt={tutorialSteps[currentTutorialStep].title}
                                  className="w-full h-auto object-contain max-h-[360px] mx-auto"
                                  loading="lazy"
                                />
                                <p className="text-xs text-muted-foreground text-center py-2 px-3 border-t border-border bg-background/50">
                                  {tutorialSteps[currentTutorialStep].description}
                                </p>
                              </div>
                            )}

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                              {tutorialSteps[currentTutorialStep].content}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
                            <Button 
                              variant="outline" 
                              onClick={handlePrevTutorial}
                              disabled={currentTutorialStep === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Anterior
                            </Button>
                            
                            <span className="text-sm font-medium text-muted-foreground">
                              Passo {currentTutorialStep + 1} de {tutorialSteps.length}
                            </span>

                            {currentTutorialStep < tutorialSteps.length - 1 ? (
                              <Button onClick={handleNextTutorial}>
                                Próximo
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            ) : (
                              <DialogClose asChild>
                                <Button className="bg-success hover:bg-success/90">
                                  Entendi, vou cadastrar!
                                </Button>
                              </DialogClose>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
