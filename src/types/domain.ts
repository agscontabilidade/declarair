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

// Formulário payload genérico (JSONB do Supabase)
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type JsonRecord = Record<string, Json | undefined>;
