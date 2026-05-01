import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Pencil, Receipt } from 'lucide-react';
import { formatCPF, formatCurrency, formatDate, STATUS_LABELS } from '@/lib/formatters';
import { useCobrancasCliente } from '@/hooks/useCobrancasCliente';
import { WhatsAppIcon } from './WhatsAppIcon';

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium break-words">{value || '—'}</p>
    </div>
  );
}

export function ClienteViewModal({ open, onOpenChange, cliente, onEdit }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useCobrancasCliente(cliente?.id);

  if (!cliente) return null;
  const tel = cliente.telefone?.replace(/\D/g, '');
  const onboarding = onboardingMap[cliente.status_onboarding ?? 'nao_iniciado'] ?? onboardingMap.nao_iniciado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{cliente.nome}</DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className={onboarding.cls + ' hover:' + onboarding.cls}>{onboarding.label}</Badge>
            {cliente.procuracao_ecac ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Procuração e-CAC ativa</Badge>
            ) : (
              <Badge variant="secondary">Procuração e-CAC pendente</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados cadastrais */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold font-display">Dados cadastrais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CPF" value={<span className="tabular-nums">{formatCPF(cliente.cpf)}</span>} />
              <Field label="Email" value={cliente.email} />
              <Field
                label="WhatsApp"
                value={
                  tel ? (
                    <a
                      href={`https://wa.me/55${tel}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      <span className="tabular-nums">
                        {tel.length === 11
                          ? `(${tel.slice(0,2)}) ${tel.slice(2,7)}-${tel.slice(7)}`
                          : tel}
                      </span>
                    </a>
                  ) : null
                }
              />
              <Field
                label="Data de nascimento"
                value={cliente.data_nascimento ? formatDate(cliente.data_nascimento) : null}
              />
              <Field label="Contador responsável" value={cliente.usuarios?.nome} />
              <Field
                label="Cliente desde"
                value={cliente.created_at ? formatDate(cliente.created_at) : null}
              />
            </div>
          </section>

          {/* Procuração e-CAC */}
          {cliente.procuracao_ecac && cliente.procuracao_ecac_validade && (
            <section className="rounded-lg border bg-emerald-50/50 p-3">
              <p className="text-xs text-muted-foreground">Validade da procuração e-CAC</p>
              <p className="text-sm font-medium">{formatDate(cliente.procuracao_ecac_validade)}</p>
            </section>
          )}

          {/* Cobranças e pagamentos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display">Cobranças e pagamentos</h3>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate(`/clientes/${cliente.id}`)}>
                Ver todas <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="text-base font-bold text-emerald-600">{formatCurrency(data?.totalPago ?? 0)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-base font-bold text-amber-600">{formatCurrency(data?.totalPendente ?? 0)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Atrasado</p>
                <p className="text-base font-bold text-red-600">{formatCurrency(data?.totalAtrasado ?? 0)}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : data && data.recentes.length > 0 ? (
              <div className="rounded-lg border divide-y">
                {data.recentes.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.descricao}</p>
                      <p className="text-xs text-muted-foreground">Vence em {formatDate(c.data_vencimento)}</p>
                    </div>
                    <span className="tabular-nums font-medium">{formatCurrency(c.valor)}</span>
                    <Badge className={(cobrancaCls[c.status] || '') + ' shrink-0'}>
                      {STATUS_LABELS[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma cobrança cadastrada</p>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => navigate(`/clientes/${cliente.id}`)}>
            Abrir perfil completo
          </Button>
          <Button onClick={() => onEdit(cliente)} className="gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
