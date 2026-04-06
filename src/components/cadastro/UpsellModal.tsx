import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, Clock, ArrowRight } from 'lucide-react';

interface UpsellModalProps {
  open: boolean;
  onContinueFree: () => void;
  onUpgrade: () => void;
}

const BENEFITS = [
  '3 declarações inclusas + extras por R$ 4,90/cada',
  'Até 5 usuários simultâneos',
  'Storage ilimitado',
  'Malha Fina + Calculadora IR',
  'Suporte prioritário',
  'Addons disponíveis (WhatsApp, Portal, API)',
];

export function UpsellModal({ open, onContinueFree, onUpgrade }: UpsellModalProps) {
  const [seconds, setSeconds] = useState(300); // 5 min

  useEffect(() => {
    if (!open) { setSeconds(300); return; }
    const interval = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [open]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <Crown className="h-7 w-7 text-accent" />
          </div>
          <DialogTitle className="font-display text-xl">Antes de continuar...</DialogTitle>
          <DialogDescription className="text-sm">
            O plano <span className="font-semibold text-foreground">Pro</span> por apenas <span className="font-bold text-accent">R$ 49,90/mês</span> oferece muito mais para seu escritório:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 my-2">
          {BENEFITS.map(b => (
            <div key={b} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        {seconds > 0 && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-warning/10 border border-warning/20">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              Oferta especial expira em {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button className="w-full h-11" onClick={onUpgrade}>
            Assinar o Pro — R$ 29,90/mês <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={onContinueFree}>
            Continuar com o plano gratuito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
