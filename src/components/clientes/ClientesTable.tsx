import { Pencil, Trash2, DollarSign, Copy, Check, MessageSquareText, Send, Link2, RefreshCw, CheckCircle2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCPF } from '@/lib/formatters';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Cliente } from '@/types/domain';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export type ClienteRow = Cliente;

function formatTelefone(tel: string | null) {
  if (!tel) return '—';
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

function CopyCpfButton({ cpf }: { cpf: string }) {
  const [copied, setCopied] = useState(false);
  const digits = (cpf || '').replace(/\D/g, '');
  if (!digits) return null;
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(digits);
      setCopied(true);
      toast.success('CPF copiado');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="iconPositive"
          className="h-5 w-5"
          aria-label="Copiar CPF (sem pontos)"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Copiar CPF (sem pontos)</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface Props {
  clientes: ClienteRow[];
  isLoading: boolean;
  onView: (cliente: ClienteRow) => void;
  onEdit: (cliente: ClienteRow) => void;
  onDelete: (cliente: ClienteRow) => void;
  onCobranca?: (cliente: ClienteRow) => void;
  onConvite?: (cliente: ClienteRow) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  clientesComCobranca?: Set<string>;
  clientesComObservacao?: Set<string>;
}

type ConviteState = {
  Icon: typeof Send;
  tooltip: string;
  className: string;
};

function getConviteState(c: ClienteRow): ConviteState {
  const hasAuth = !!c.auth_user_id;
  const tokenValido = !!c.token_convite_expira_em && new Date(c.token_convite_expira_em) > new Date();
  if (hasAuth) {
    return { Icon: CheckCircle2, tooltip: 'Portal ativo — reenviar acesso', className: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (c.status_onboarding === 'convite_enviado') {
    if (tokenValido) {
      return { Icon: Link2, tooltip: 'Convite pendente — reenviar ou copiar link', className: 'text-sky-600 dark:text-sky-400' };
    }
    return { Icon: RefreshCw, tooltip: 'Convite expirado — gerar novo', className: 'text-amber-600 dark:text-amber-400' };
  }
  return { Icon: Send, tooltip: 'Enviar convite de acesso', className: 'text-muted-foreground' };
}

export function ClientesTable({ clientes, isLoading, onView, onEdit, onDelete, onCobranca, onConvite, canEdit = true, canDelete = true, clientesComCobranca, clientesComObservacao }: Props) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Adicione seu primeiro cliente para começar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden sm:border sm:rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CPF</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">WhatsApp</TableHead>
                <TableHead>Procuração e-CAC</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => {
                const tel = c.telefone?.replace(/\D/g, '');
                const procAtiva = !!c.procuracao_ecac;
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => onView(c)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onView(c);
                      }
                    }}
                  >
                    <TableCell className="tabular-nums">
                      <div className="flex items-center gap-1">
                        {c.cpf ? formatCPF(c.cpf) : <span className="text-muted-foreground">—</span>}
                        {c.cpf && <CopyCpfButton cpf={c.cpf} />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{c.nome}</span>
                        {clientesComObservacao?.has(c.id) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="warning"
                                className="text-[10px] px-1.5 py-0 gap-1 cursor-help"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageSquareText className="h-3 w-3" /> Detalhes
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              O cliente deixou observações na declaração. Abra-a para ler.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums">{formatTelefone(c.telefone)}</TableCell>
                    <TableCell>
                      {procAtiva ? (
                        <Badge variant="success">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {clientesComCobranca?.has(c.id) ? (
                        <Link to={`/cobrancas?cliente=${c.id}`} title="Ver cobranças deste cliente">
                          <Badge variant="success" className="cursor-pointer">Gerada</Badge>
                        </Link>
                      ) : (
                        <Badge variant="secondary">Não gerada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Ver portal do cliente"
                              onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${c.id}/portal`); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">Ver portal do cliente</TooltipContent>
                        </Tooltip>
                        {onCobranca && (
                          <Button
                            size="icon"
                            variant="iconPositive"
                            aria-label="Nova cobrança"
                            title="Criar cobrança"
                            onClick={(e) => { e.stopPropagation(); onCobranca(c); }}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        {onConvite && (() => {
                          const { Icon, tooltip, className } = getConviteState(c);
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="iconAction"
                                  aria-label={tooltip}
                                  onClick={(e) => { e.stopPropagation(); onConvite(c); }}
                                >
                                  <Icon className={`h-4 w-4 ${className}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top"><p>{tooltip}</p></TooltipContent>
                            </Tooltip>
                          );
                        })()}
                        {tel && (
                          <Button size="icon" variant="iconInfo" asChild aria-label="Abrir WhatsApp">
                            <a
                              href={`https://wa.me/55${tel}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="iconAction"
                            aria-label="Editar cliente"
                            onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="iconDestructive"
                                aria-label="Excluir cliente"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Excluir definitivamente o cliente <strong>{c.nome}</strong>?
                                  Todos os dados vinculados (declarações, documentos, cobranças, mensagens) serão removidos.
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => onDelete(c)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
