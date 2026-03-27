export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function parseCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export const STATUS_LABELS: Record<string, string> = {
  aguardando_documentos: 'Aguardando Documentos',
  documentacao_recebida: 'Documentação Recebida',
  declaracao_pronta: 'Declaração Pronta',
  transmitida: 'Transmitida',
  nao_iniciado: 'Não Iniciado',
  convite_enviado: 'Convite Enviado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  recebido: 'Recebido',
  dispensado: 'Dispensado',
  restituicao: 'Restituição',
  pagamento: 'Pagamento',
  nenhum: 'Nenhum',
};

export function formatarPapel(papel: string): string {
  const papeis: Record<string, string> = {
    dono: 'Responsável Técnico',
    contador: 'Profissional Contábil',
    admin: 'Gestor',
    colaborador: 'Profissional Contábil',
    cliente: 'Contribuinte',
    operador: 'Operador',
    administrador: 'Gestor',
  };
  return papeis[papel] || papel;
}

export const PAPEL_COLORS: Record<string, string> = {
  dono: 'bg-accent text-accent-foreground',
  administrador: 'bg-primary text-primary-foreground',
  colaborador: 'bg-secondary text-secondary-foreground',
  operador: 'bg-muted text-muted-foreground',
};
