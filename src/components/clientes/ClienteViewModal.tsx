import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Pencil,
  Receipt,
  User,
  ShieldCheck,
  Wallet,
  Mail,
  Calendar,
  IdCard,
  UserCog,
  CalendarClock,
} from 'lucide-react';
import { formatCPF, formatPhone, formatCurrency, formatDate, STATUS_LABELS } from '@/lib/formatters';
import { useCobrancasCliente } from '@/hooks/useCobrancasCliente';
import { WhatsAppIcon } from './WhatsAppIcon';

interface Cliente {
  id: string;
  nome: string;
  cpf: string | null;
  email?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  status_onboarding?: string;
  created_at?: string;
  procuracao_ecac?: boolean | null;
  procuracao_ecac_validade?: string | null;
  usuarios?: { nome: string } | null;
}

const onboardingMap: Record<string, { label: string; cls: string }> = {
  nao_iniciado: { label: 'Não Iniciado', cls: 'bg-muted text-muted-foreground' },
  convite_enviado: { label: 'Convite Enviado', cls: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em Andamento', cls: 'bg-amber-100 text-amber-800' },
  concluido: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-800' },
};

const cobrancaCls: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  pago: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-muted text-muted-foreground',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onEdit: (cliente: Cliente) => void;
}

interface ReadFieldProps {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value?: string | null;
  placeholder?: string;
  href?: string;
  hrefAriaLabel?: string;
  hrefIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
  mono?: boolean;
}

function ReadField({
  id,
  label,
  icon: Icon,
  value,
  placeholder = '—',
  href,
  hrefAriaLabel,
  hrefIcon: HrefIcon,
  className,
  mono,
}: ReadFieldProps) {
  const display = value && value.trim() !== '' ? value : '';
  return (
    <div className={'space-y-1.5 ' + (className ?? '')}>
      <Label htmlFor={id} className="text-xs text-muted-foreground font-medium">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          id={id}
          readOnly
          value={display}
          placeholder={placeholder}
          className={
            'bg-muted/40 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0 ' +
            (Icon ? 'pl-9 ' : '') +
            (href ? 'pr-10 ' : '') +
            (mono ? 'tabular-nums ' : '')
          }
        />
        {href && display && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={hrefAriaLabel}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            {HrefIcon ? <HrefIcon className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          </a>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold font-display leading-tight">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ClienteViewModal({ open, onOpenChange, cliente, onEdit }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useCobrancasCliente(cliente?.id);

  if (!cliente) return null;
  const tel = cliente.telefone?.replace(/\D/g, '') ?? '';
  const onboarding = onboardingMap[cliente.status_onboarding ?? 'nao_iniciado'] ?? onboardingMap.nao_iniciado;
  const initials = cliente.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-semibold text-lg shrink-0">
              {initials || <User className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-xl truncate">{cliente.nome}</DialogTitle>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <Badge className={onboarding.cls + ' hover:' + onboarding.cls}>{onboarding.label}</Badge>
                {cliente.procuracao_ecac ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Procuração e-CAC
                  </Badge>
                ) : (
                  <Badge variant="secondary">Procuração e-CAC pendente</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Dados cadastrais */}
          <section className="space-y-4">
            <SectionHeader
              icon={User}
              title="Dados cadastrais"
              description="Informações de contato e identificação do cliente"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadField
                id="view-cpf"
                label="CPF"
                icon={IdCard}
                value={formatCPF(cliente.cpf)}
                mono
              />
              <ReadField
                id="view-nascimento"
                label="Data de nascimento"
                icon={Calendar}
                value={cliente.data_nascimento ? formatDate(cliente.data_nascimento) : ''}
              />
              <ReadField
                id="view-email"
                label="E-mail"
                icon={Mail}
                value={cliente.email ?? ''}
                href={cliente.email ? `mailto:${cliente.email}` : undefined}
                hrefAriaLabel="Enviar e-mail"
                hrefIcon={Mail}
                className="sm:col-span-2"
              />
              <ReadField
                id="view-whatsapp"
                label="WhatsApp"
                icon={WhatsAppIcon}
                value={tel ? formatPhone(tel) : ''}
                href={tel ? `https://wa.me/55${tel}` : undefined}
                hrefAriaLabel="Abrir conversa no WhatsApp"
                hrefIcon={WhatsAppIcon}
                mono
              />
              <ReadField
                id="view-contador"
                label="Contador responsável"
                icon={UserCog}
                value={cliente.usuarios?.nome ?? ''}
              />
              <ReadField
                id="view-criado"
                label="Cliente desde"
                icon={Calendar}
                value={cliente.created_at ? formatDate(cliente.created_at) : ''}
              />
              <ReadField
                id="view-ecac"
                label="Validade da procuração e-CAC"
                icon={CalendarClock}
                value={
                  cliente.procuracao_ecac && cliente.procuracao_ecac_validade
                    ? formatDate(cliente.procuracao_ecac_validade)
                    : ''
                }
                placeholder={cliente.procuracao_ecac ? '—' : 'Sem procuração ativa'}
              />
            </div>
          </section>

          <Separator />

          {/* Cobranças */}
          <section className="space-y-4">
            <SectionHeader
              icon={Wallet}
              title="Cobranças e pagamentos"
              description="Resumo financeiro deste cliente"
              action={
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                >
                  Ver todas <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              }
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-emerald-50/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Pago</p>
                <p className="text-base font-bold text-emerald-700 tabular-nums mt-1">
                  {formatCurrency(data?.totalPago ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border bg-amber-50/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Pendente</p>
                <p className="text-base font-bold text-amber-700 tabular-nums mt-1">
                  {formatCurrency(data?.totalPendente ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border bg-red-50/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Atrasado</p>
                <p className="text-base font-bold text-red-700 tabular-nums mt-1">
                  {formatCurrency(data?.totalAtrasado ?? 0)}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data && data.recentes.length > 0 ? (
              <div className="rounded-lg border divide-y bg-card">
                {data.recentes.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {formatDate(c.data_vencimento)}
                      </p>
                    </div>
                    <span className="tabular-nums font-medium">{formatCurrency(c.valor)}</span>
                    <Badge className={(cobrancaCls[c.status] || '') + ' shrink-0'}>
                      {STATUS_LABELS[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma cobrança cadastrada</p>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => navigate(`/clientes/${cliente.id}`)}>
            Abrir perfil completo
          </Button>
          <Button onClick={() => onEdit(cliente)} className="gap-2">
            <Pencil className="h-4 w-4" /> Editar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
