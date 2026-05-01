/**
 * Tipos compartilhados de domínio derivados das tabelas Supabase.
 * Use estes tipos no lugar de `any` em props de componentes e maps.
 */
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

// Linhas básicas
export type ClienteRow = Tables['clientes']['Row'];
export type DeclaracaoRow = Tables['declaracoes']['Row'];
export type CobrancaRow = Tables['cobrancas']['Row'];
export type MensagemEnviadaRow = Tables['mensagens_enviadas']['Row'];
export type ChecklistDocumentoRow = Tables['checklist_documentos']['Row'];
export type FormularioIRRow = Tables['formulario_ir']['Row'];
export type TemplateMensagemRow = Tables['templates_mensagem']['Row'];

// Aliases retro-compatíveis
export type Cliente = ClienteRow;
export type Cobranca = CobrancaRow;
export type ClienteWithContador = ClienteRow & {
  contador_responsavel?: { id: string; nome: string } | null;
};

// Joins comuns
export type CobrancaComCliente = CobrancaRow & {
  clientes?: Pick<ClienteRow, 'nome' | 'cpf' | 'email' | 'telefone'> | null;
};

export type DeclaracaoComCliente = DeclaracaoRow & {
  clientes?: Pick<ClienteRow, 'nome' | 'cpf' | 'email' | 'telefone'> | null;
};

export type DeclaracaoComContador = DeclaracaoRow & {
  contador?: { nome: string } | null;
};

// JSON helpers
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type JsonRecord = Record<string, Json | undefined>;

// Helper para itens de formulário (JSONB com campos variáveis)
export interface RendimentoItem { rendimento_bruto?: string | number; [k: string]: unknown }
export interface DespesaItem { valor?: string | number; descricao?: string; [k: string]: unknown }
export interface DependenteItem { nome?: string; cpf?: string; [k: string]: unknown }
