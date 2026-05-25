import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import passo1Img from '@/assets/ecac/passo-1.jpg';
import passo2Img from '@/assets/ecac/passo-2.jpg';
import passo3Img from '@/assets/ecac/passo-3.jpg';
import passo4Img from '@/assets/ecac/passo-4.jpg';
import passo5Img from '@/assets/ecac/passo-5.jpg';
import passo7Img from '@/assets/ecac/passo-7.jpg';
import passo8Img from '@/assets/ecac/passo-8.jpg';
import passo9Img from '@/assets/ecac/passo-9.jpg';

const tutorialSteps = [
  {
    title: 'Antes de começar',
    description: 'Acesse o Portal e-CAC com sua conta gov.br nível Prata ou Ouro.',
    image: null as string | null,
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
    ),
  },
  {
    title: 'Passo 1: Autorizações de Acesso',
    description: 'No menu inicial do e-CAC, clique em "Autorizações de Acesso (Procurações)".',
    image: passo1Img,
    content: (
      <p className="text-sm">Logo após o login, na tela inicial do e-CAC, localize e clique no card <strong>"Autorizações de Acesso (Procurações)"</strong>.</p>
    ),
  },
  {
    title: 'Passo 2: Minhas Autorizações de Acesso',
    description: 'Em seguida, clique em "Minhas Autorizações de Acesso".',
    image: passo2Img,
    content: (
      <p className="text-sm">Na próxima tela, no menu lateral ou na lista de opções, clique em <strong>"Minhas Autorizações de Acesso"</strong>.</p>
    ),
  },
  {
    title: 'Passo 3: Nova Autorização',
    description: 'Clique no botão "+ Nova Autorização".',
    image: passo3Img,
    content: (
      <p className="text-sm">Você verá a lista de autorizações já existentes (se houver). Clique no botão verde <strong>"+ Nova Autorização"</strong> no canto superior direito.</p>
    ),
  },
  {
    title: 'Passo 4: Dados do Procurador',
    description: 'Informe o CPF do contador e a validade da autorização.',
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
    ),
  },
  {
    title: 'Passo 5: Selecionar Serviços',
    description: 'Na etapa de serviços, clique em "Selecionar Serviços".',
    image: passo5Img,
    content: (
      <p className="text-sm">Leia as informações sobre os efeitos da autorização e clique no botão <strong>"Selecionar Serviços"</strong>.</p>
    ),
  },
  {
    title: 'Passo 6: Marcar os Serviços',
    description: 'Selecione os serviços orientados pelo escritório.',
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
    ),
  },
  {
    title: 'Passo 7: Revisar Autorização',
    description: 'Confira as informações e siga para a etapa de assinatura.',
    image: passo7Img,
    content: (
      <p className="text-sm">Revise os dados do procurador, prazo de validade e os serviços selecionados. Se estiver tudo certo, prossiga para a <strong>etapa de assinatura</strong>.</p>
    ),
  },
  {
    title: 'Passo 8: Autorizar via gov.br',
    description: 'No Portal de Assinatura gov.br, informe o código recebido no aplicativo.',
    image: passo8Img,
    content: (
      <p className="text-sm">Você será redirecionado para o <strong>Portal de Assinatura gov.br</strong>. Abra o aplicativo gov.br no seu celular, copie o código exibido e cole no campo. Em seguida, clique em <strong>"Autorizar"</strong>.</p>
    ),
  },
  {
    title: 'Passo 9: Pronto!',
    description: 'Autorização registrada com sucesso.',
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
    ),
  },
];

interface Props {
  trigger: React.ReactNode;
}

export default function EcacTutorialDialog({ trigger }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) setCurrentStep((p) => p + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  return (
    <Dialog onOpenChange={(open) => !open && setCurrentStep(0)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Tutorial de Procuração e-CAC
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <div className="flex justify-between mb-8 gap-1">
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="min-h-[300px] flex flex-col">
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-2">{tutorialSteps[currentStep].title}</h4>
              <p className="text-muted-foreground mb-6">{tutorialSteps[currentStep].description}</p>

              {tutorialSteps[currentStep].image && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 shadow-sm">
                  <img
                    src={tutorialSteps[currentStep].image as string}
                    alt={tutorialSteps[currentStep].title}
                    className="w-full h-auto object-contain max-h-[360px] mx-auto"
                    loading="lazy"
                    decoding="async"
                  />
                  <p className="text-xs text-muted-foreground text-center py-2 px-3 border-t border-border bg-background/50">
                    {tutorialSteps[currentStep].description}
                  </p>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                {tutorialSteps[currentStep].content}
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <span className="text-sm font-medium text-muted-foreground">
                Passo {currentStep + 1} de {tutorialSteps.length}
              </span>

              {currentStep < tutorialSteps.length - 1 ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button className="bg-success hover:bg-success/90">Entendi, vou cadastrar!</Button>
                </DialogClose>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
