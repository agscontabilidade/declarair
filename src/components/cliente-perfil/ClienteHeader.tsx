import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCPF, formatPhone, STATUS_LABELS } from '@/lib/formatters';
import { Send, Copy, MessageCircle, Mail, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  cliente: any;
  isLoading: boolean;
  onEnviarConvite: (mode: 'auto' | 'copy' | 'email' | 'whatsapp-manual') => void;
  enviandoConvite: boolean;
  whatsappConectado: boolean;
  whatsappLoading: boolean;
}

const statusColors: Record<string, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  convite_enviado: 'bg-amber-100 text-amber-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluido: 'bg-emerald-100 text-emerald-800',
};

export function ClienteHeader({ cliente, isLoading, onEnviarConvite, enviandoConvite, whatsappConectado, whatsappLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-start gap-6 p-6 bg-card rounded-lg border shadow-sm">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  if (!cliente) return null;

  const initials = cliente.nome?.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() ?? '?';

  const handleClick = () => {
    if (whatsappConectado && cliente.telefone) {
      // Auto-send via WhatsApp
      onEnviarConvite('auto');
    }
    // If no WhatsApp, the dropdown handles it
  };

  return (
    <div className="flex items-start gap-6 p-6 bg-card rounded-lg border shadow-sm flex-wrap">
      <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold font-display shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl font-bold text-foreground">{cliente.nome}</h1>
          <Badge className={statusColors[cliente.status_onboarding] || 'bg-muted text-muted-foreground'}>
            {STATUS_LABELS[cliente.status_onboarding] || cliente.status_onboarding}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>CPF: {formatCPF(cliente.cpf)}</span>
          {cliente.email && <span>Email: {cliente.email}</span>}
          {cliente.telefone && <span>Telefone: {formatPhone(cliente.telefone)}</span>}
        </div>
        {cliente.usuarios && (
          <p className="text-sm text-muted-foreground">
            Contador: {cliente.usuarios.nome}
          </p>
        )}
      </div>
      {cliente.status_onboarding !== 'concluido' && (
        <>
          {whatsappLoading ? (
            <Button disabled className="shrink-0">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </Button>
          ) : whatsappConectado && cliente.telefone ? (
            <Button
              onClick={handleClick}
              disabled={enviandoConvite}
              className="shrink-0"
            >
              {enviandoConvite ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Enviar via WhatsApp
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={enviandoConvite} className="shrink-0">
                  {enviandoConvite ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Convite
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onEnviarConvite('copy')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar link do convite
                </DropdownMenuItem>
                {cliente.telefone && (
                  <DropdownMenuItem onClick={() => onEnviarConvite('whatsapp-manual')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar via WhatsApp Web
                  </DropdownMenuItem>
                )}
                {cliente.email && (
                  <DropdownMenuItem onClick={() => onEnviarConvite('email')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar por e-mail
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}
