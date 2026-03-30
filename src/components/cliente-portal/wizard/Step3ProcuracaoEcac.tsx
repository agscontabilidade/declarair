import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WizardStepProps } from '../WizardFormulario';

const PASSOS_ECAC = [
  {
    titulo: '1. Acesse o e-CAC',
    descricao: 'Entre no portal e-CAC da Receita Federal pelo link abaixo. Você pode acessar com sua conta Gov.br (nível prata ou ouro).',
    link: 'https://cav.receita.fazenda.gov.br',
    linkLabel: 'Acessar e-CAC',
  },
  {
    titulo: '2. Faça login com Gov.br',
    descricao: 'Utilize sua conta Gov.br para acessar o sistema. Caso não tenha uma conta Gov.br nível prata ou ouro, será necessário criar ou elevar o nível da sua conta antes.',
  },
  {
    titulo: '3. Acesse "Procurações"',
    descricao: 'No menu principal, procure por "Legislação e Processo" > "Procuração Eletrônica" > "Cadastrar Procuração". Ou pesquise "Procuração" na barra de busca.',
  },
  {
    titulo: '4. Cadastre a Procuração',
    descricao: 'Clique em "Cadastrar Procuração" e informe o CPF ou CNPJ do seu contador/escritório. Selecione os serviços que deseja autorizar (recomendamos marcar "Declaração do Imposto de Renda Pessoa Física - DIRPF").',
  },
  {
    titulo: '5. Defina a validade',
    descricao: 'Defina o período de validade da procuração. Recomendamos definir até 31/12 do ano corrente para cobrir todo o período da declaração.',
  },
  {
    titulo: '6. Confirme e assine',
    descricao: 'Revise os dados, confirme a procuração e assine digitalmente. Pronto! Seu contador agora poderá acessar os dados necessários para sua declaração.',
  },
];

export default function Step3ProcuracaoEcac({ data, onUpdate }: WizardStepProps) {
  const [confirmou, setConfirmou] = useState((data as any).procuracao_confirmada || false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const handleConfirm = (checked: boolean) => {
    setConfirmou(checked);
    onUpdate({ ...data, procuracao_confirmada: checked } as any, checked ? 100 : 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Procuração Eletrônica no e-CAC</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Para que seu contador possa acessar seus dados junto à Receita Federal, é necessário cadastrar uma procuração eletrônica.
        </p>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Por que isso é necessário?</strong> A procuração eletrônica autoriza seu contador a consultar e transmitir sua declaração 
          junto à Receita Federal, garantindo segurança e legalidade no processo.
        </AlertDescription>
      </Alert>

      {/* Passo a passo */}
      <div className="space-y-2">
        <h4 className="font-semibold text-foreground">Passo a Passo</h4>
        {PASSOS_ECAC.map((passo, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-sm text-foreground">{passo.titulo}</span>
              {expandedStep === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {expandedStep === i && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                {passo.link && (
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={passo.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> {passo.linkLabel}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmação */}
      <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-muted/20">
        <Checkbox id="procuracao" checked={confirmou} onCheckedChange={(c) => handleConfirm(c === true)} className="mt-0.5" />
        <Label htmlFor="procuracao" className="cursor-pointer text-sm leading-relaxed">
          Confirmo que já cadastrei a procuração eletrônica no e-CAC para meu contador, 
          ou que farei isso antes do envio da documentação.
        </Label>
      </div>
    </div>
  );
}
