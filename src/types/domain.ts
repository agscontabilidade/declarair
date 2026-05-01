import { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Domain Aliases
export type Cliente = Tables<'clientes'>;
export type Declaracao = Tables<'declaracoes'>;
export type Cobranca = Tables<'cobrancas'>;
export type Usuario = Tables<'usuarios'>;
export type Escritorio = Tables<'escritorios'>;
export type FormularioIR = Tables<'formulario_ir'>;
export type Addon = Tables<'addons'>;
export type Notificacao = Tables<'notificacoes'>;
export type AtividadeAuditoria = Tables<'auditoria_atividades'>;

// Extended types with relationships (common patterns)
export interface ClienteWithContador extends Cliente {
  usuarios?: { nome: string } | null;
}

export interface DeclaracaoWithCliente extends Declaracao {
  clientes?: { nome: string; cpf: string } | null;
}
