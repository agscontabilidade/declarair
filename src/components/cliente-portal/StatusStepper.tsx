import { Check, FileText, FolderOpen, FileCheck, Send } from 'lucide-react';

const STEPS = [
  { label: 'Aguardando Documentos', icon: FolderOpen },
  { label: 'Documentação Recebida', icon: FileText },
  { label: 'Declaração Pronta', icon: FileCheck },
  { label: 'Transmitida', icon: Send },
];

interface StatusStepperProps {
  currentStep: number; // 1-4
}

export function StatusStepper({ currentStep }: StatusStepperProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const Icon = step.icon;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isCompleted ? 'bg-emerald-500 text-white' :
                isCurrent ? 'bg-accent text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-1.5 text-center max-w-[80px] leading-tight ${
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                stepNum < currentStep ? 'bg-emerald-500' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
