import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Home, TrendingUp, Stethoscope, GraduationCap, Users, PiggyBank, FileText, Gift, Building } from 'lucide-react';
import { PERFIL_LABELS, PERFIL_DESCRICOES, type PerfilFiscal } from '@/lib/checklistPorPerfil';

const ICONS: Record<keyof PerfilFiscal, React.ElementType> = {
  salario: Briefcase,
  proLabore: Building,
  aluguel: Home,
  bolsa: TrendingUp,
  despesasMedicas: Stethoscope,
  educacao: GraduationCap,
  dependentes: Users,
  previdencia: PiggyBank,
  autonomo: FileText,
  heranca: Gift,
  bensImoveis: Building,
};

interface Props {
  perfil: PerfilFiscal;
  onChange: (perfil: PerfilFiscal) => void;
}

export function StepPerfilFiscal({ perfil, onChange }: Props) {
  const toggle = (key: keyof PerfilFiscal) => {
    onChange({ ...perfil, [key]: !perfil[key] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">Seu Perfil Fiscal</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Responda as perguntas abaixo para que seu contador saiba exatamente quais documentos solicitar.
          Isso agiliza o processo e evita idas e vindas.
        </p>
      </div>

      <div className="grid gap-3">
        {(Object.keys(PERFIL_LABELS) as (keyof PerfilFiscal)[]).map((key) => {
          const Icon = ICONS[key];
          const isActive = perfil[key];
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-sm ${isActive ? 'ring-2 ring-accent bg-accent/5' : ''}`}
              onClick={() => toggle(key)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium cursor-pointer">{PERFIL_LABELS[key]}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{PERFIL_DESCRICOES[key]}</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggle(key)}
                  onClick={e => e.stopPropagation()}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
