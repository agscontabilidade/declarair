import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AddonRequiredModalProps {
  open: boolean;
  onClose: () => void;
  addon: {
    nome: string;
    descricao: string;
    preco: number;
    beneficios: string[];
  };
}

export function AddonRequiredModal({ open, onClose, addon }: AddonRequiredModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">{addon.nome} Necessário</DialogTitle>
          <DialogDescription className="text-center">{addon.descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-accent">R$ {addon.preco.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">/mês</p>
          </div>

          <div className="space-y-2 py-4">
            {addon.beneficios.map((beneficio) => (
              <div key={beneficio} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm">{beneficio}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => {
                navigate('/meus-planos');
                onClose();
              }}
            >
              Ativar {addon.nome}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Agora Não
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancele quando quiser. Sem taxas ocultas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
