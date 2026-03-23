import { useState } from 'react';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, ChevronLeft, ChevronRight, CheckCircle2, Save } from 'lucide-react';
import { useFormularioIR } from '@/hooks/useFormularioIR';
import { StepDadosPessoais } from '@/components/formulario-ir/StepDadosPessoais';
import { StepDependentes } from '@/components/formulario-ir/StepDependentes';
import { StepRendimentos } from '@/components/formulario-ir/StepRendimentos';
import { StepBensDireitos } from '@/components/formulario-ir/StepBensDireitos';
import { StepDividasOnus } from '@/components/formulario-ir/StepDividasOnus';
import { StepDeducoes } from '@/components/formulario-ir/StepDeducoes';
import { StepInfoAdicionais } from '@/components/formulario-ir/StepInfoAdicionais';
import { toast } from 'sonner';

const STEP_LABELS = [
  'Dados Pessoais', 'Dependentes', 'Rendimentos', 'Bens e Direitos',
  'Dívidas e Ônus', 'Deduções', 'Informações Adicionais',
];

export default function ClienteFormulario() {
  const { formData, updateField, declaracao, isLoading, saving, lastSaved, finalizar } = useFormularioIR();
  const [step, setStep] = useState(0);
  const [confirmado, setConfirmado] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const progress = Math.round(((step + 1) / 7) * 100);

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ClienteLayout>
    );
  }

  if (!declaracao) {
    return (
      <ClienteLayout>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma declaração ativa</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Aguarde seu contador criar uma declaração</p>
          </CardContent>
        </Card>
      </ClienteLayout>
    );
  }

  if (concluido) {
    return (
      <ClienteLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mb-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Formulário Enviado!</h2>
          <p className="text-muted-foreground max-w-md">
            Seus dados foram enviados com sucesso. Seu contador irá analisar as informações e preparar sua declaração.
          </p>
        </div>
      </ClienteLayout>
    );
  }

  const handleFinalizar = async () => {
    if (!confirmado) {
      toast.error('Confirme a veracidade das informações');
      return;
    }
    const ok = await finalizar();
    if (ok) setConcluido(true);
  };

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Formulário IR {declaracao.ano_base}</h1>
            <p className="text-sm text-muted-foreground mt-1">Etapa {step + 1} de 7 — {STEP_LABELS[step]}</p>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Save className="h-3.5 w-3.5" />
              Rascunho salvo às {lastSaved}
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step Content */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            {step === 0 && <StepDadosPessoais data={formData} onChange={updateField} />}
            {step === 1 && <StepDependentes data={formData} onChange={updateField} />}
            {step === 2 && <StepRendimentos data={formData} onChange={updateField} />}
            {step === 3 && <StepBensDireitos data={formData} onChange={updateField} />}
            {step === 4 && <StepDividasOnus data={formData} onChange={updateField} />}
            {step === 5 && <StepDeducoes data={formData} onChange={updateField} />}
            {step === 6 && <StepInfoAdicionais data={formData} onChange={updateField} confirmado={confirmado} onConfirmChange={setConfirmado} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          {step < 6 ? (
            <Button className="w-full sm:w-auto active:scale-[0.98]" onClick={() => setStep(step + 1)}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinalizar} disabled={saving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    </ClienteLayout>
  );
}
