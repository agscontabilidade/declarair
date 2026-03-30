import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import Step1DadosCadastrais from './wizard/Step1DadosCadastrais';
import Step2DependentesAlimentandos from './wizard/Step2DependentesAlimentandos';
import Step3ProcuracaoEcac from './wizard/Step3ProcuracaoEcac';
import Step4EnvioDocumentos from './wizard/Step4EnvioDocumentos';

import type { FormularioCompleto } from '@/lib/types/formularioCliente';

const STEPS = [
  { id: 1, titulo: 'Dados Cadastrais', icone: '👤' },
  { id: 2, titulo: 'Dependentes e Alimentandos', icone: '👨‍👩‍👧‍👦' },
  { id: 3, titulo: 'Procuração e-CAC', icone: '🔐' },
  { id: 4, titulo: 'Envio de Documentos', icone: '📎' },
];

export interface WizardStepProps {
  data: Partial<FormularioCompleto>;
  onUpdate: (data: Partial<FormularioCompleto>, progress: number) => void;
}

export default function WizardFormulario() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormularioCompleto>>({});
  const [stepProgress, setStepProgress] = useState<Record<number, number>>({});

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepData = (stepId: number, data: Partial<FormularioCompleto>, progress: number) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStepProgress(prev => ({ ...prev, [stepId]: progress }));
  };

  const handleSave = async () => {
    toast.success('Rascunho salvo!');
  };

  const calcularProgressoGeral = () => {
    const total = Object.values(stepProgress).reduce((sum, val) => sum + val, 0);
    return Math.round(total / STEPS.length);
  };

  const renderStep = () => {
    const props: WizardStepProps = {
      data: formData,
      onUpdate: (data, progress) => handleStepData(currentStep, data, progress),
    };

    switch (currentStep) {
      case 1: return <Step1DadosCadastrais {...props} />;
      case 2: return <Step2DependentesAlimentandos {...props} />;
      case 3: return <Step3ProcuracaoEcac {...props} />;
      case 4: return <Step4EnvioDocumentos {...props} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">Envio de Documentação</h2>
              <span className="text-sm text-muted-foreground">
                Etapa {currentStep} de {STEPS.length}
              </span>
            </div>
            <Progress value={calcularProgressoGeral()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stepper horizontal (desktop) */}
      <div className="hidden md:flex items-center justify-between overflow-x-auto">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = stepProgress[step.id] === 100;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors whitespace-nowrap
                  ${isActive ? 'bg-primary/10' : 'hover:bg-muted'}
                `}
              >
                <span className="text-xl">{isCompleted ? '✅' : step.icone}</span>
                <div className="text-left">
                  <p className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {step.titulo}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {stepProgress[step.id] || 0}%
                  </p>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-border mx-1 min-w-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = stepProgress[step.id] === 100;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}
              `}
            >
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrevious} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>

        <Button variant="outline" className="w-full sm:w-auto" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> Salvar Rascunho
        </Button>

        {currentStep < STEPS.length ? (
          <Button className="w-full sm:w-auto active:scale-[0.98]" onClick={handleNext}>
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button className="w-full sm:w-auto bg-success hover:bg-success/90 active:scale-[0.98]" onClick={handleSave}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar e Enviar
          </Button>
        )}
      </div>
    </div>
  );
}
