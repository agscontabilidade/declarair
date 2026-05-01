import { Check, ClipboardList, Upload, FileText, FileCheck, Send } from 'lucide-react';

const STEPS = [
  { label: 'Dados Cadastrais', shortLabel: 'Dados', icon: ClipboardList },
  { label: 'Enviar Documentos', shortLabel: 'Docs', icon: Upload },
  { label: 'Documentação Recebida', shortLabel: 'Recebida', icon: FileText },
  { label: 'Declaração Pronta', shortLabel: 'Pronta', icon: FileCheck },
  { label: 'Transmitida', shortLabel: 'Enviada', icon: Send },
];

interface StatusStepperProps {
  currentStep: number; // 1-5
}

export function StatusStepper({ currentStep }: StatusStepperProps) {
  const safeStep = Math.min(Math.max(currentStep, 1), STEPS.length);
  const currentMeta = STEPS[safeStep - 1];
  const CurrentIcon = currentMeta.icon;
  const progressPct = (safeStep / STEPS.length) * 100;

  return (
    <>
      {/* Mobile: compact view (current step + progress bar) */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              Etapa {safeStep} de {STEPS.length}
            </p>
            <p className="font-medium text-foreground truncate">{currentMeta.label}</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`${i + 1 === safeStep ? 'text-foreground font-medium' : ''} ${i + 1 < safeStep ? 'text-emerald-600' : ''}`}
            >
              {s.shortLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < safeStep;
          const isCurrent = stepNum === safeStep;
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
                  stepNum < safeStep ? 'bg-emerald-500' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
