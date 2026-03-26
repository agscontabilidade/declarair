import { z } from 'zod';

// --- Dependentes ---
export const dependenteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').or(z.literal('')).optional(),
  data_nascimento: z.string().optional(),
  parentesco: z.string().optional(),
});
export type Dependente = z.infer<typeof dependenteSchema>;

// --- Rendimentos ---
export const rendimentoEmpregoSchema = z.object({
  fonte_pagadora: z.string().min(1, 'Fonte pagadora obrigatória').max(200),
  cnpj: z.string().optional(),
  valor_anual: z.number().nonnegative('Valor não pode ser negativo'),
  imposto_retido: z.number().nonnegative().optional(),
  decimo_terceiro: z.number().nonnegative().optional(),
});
export type RendimentoEmprego = z.infer<typeof rendimentoEmpregoSchema>;

export const rendimentoAutonomoSchema = z.object({
  descricao: z.string().optional(),
  valor_mensal: z.number().nonnegative().optional(),
  valor_anual: z.number().nonnegative().optional(),
});
export type RendimentoAutonomo = z.infer<typeof rendimentoAutonomoSchema>;

export const rendimentoAluguelSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(300),
  valor_mensal: z.number().nonnegative('Valor não pode ser negativo'),
  cpf_cnpj_inquilino: z.string().optional(),
});
export type RendimentoAluguel = z.infer<typeof rendimentoAluguelSchema>;

export const outrosRendimentosSchema = z.object({
  descricao: z.string().optional(),
  valor: z.number().nonnegative().optional(),
});
export type OutrosRendimentos = z.infer<typeof outrosRendimentosSchema>;

// --- Deduções ---
export const despesaMedicaSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(300),
  valor: z.number().positive('Valor deve ser positivo'),
  cpf_cnpj_prestador: z.string().optional(),
  tipo: z.string().optional(),
});
export type DespesaMedica = z.infer<typeof despesaMedicaSchema>;

export const despesaEducacaoSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(300),
  valor: z.number().positive('Valor deve ser positivo').max(3561.50, 'Limite de R$ 3.561,50 por pessoa'),
  cpf_cnpj_instituicao: z.string().optional(),
  beneficiario: z.string().optional(),
});
export type DespesaEducacao = z.infer<typeof despesaEducacaoSchema>;

export const previdenciaPrivadaSchema = z.object({
  tipo: z.enum(['PGBL', 'VGBL', '']).optional(),
  valor_anual: z.number().nonnegative().optional(),
  instituicao: z.string().optional(),
});
export type PrevidenciaPrivada = z.infer<typeof previdenciaPrivadaSchema>;

// --- Bens e Direitos ---
export const bemDireitoSchema = z.object({
  tipo: z.string().min(1, 'Tipo obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória').max(500),
  valor_anterior: z.number().nonnegative().optional(),
  valor_atual: z.number().nonnegative('Valor não pode ser negativo'),
  localizacao: z.string().optional(),
  inscricao: z.string().optional(),
});
export type BemDireito = z.infer<typeof bemDireitoSchema>;

// --- Dívidas ---
export const dividaOnusSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(500),
  valor_anterior: z.number().nonnegative().optional(),
  valor_atual: z.number().nonnegative('Valor não pode ser negativo'),
  credor: z.string().optional(),
});
export type DividaOnus = z.infer<typeof dividaOnusSchema>;

// --- Formulário Completo ---
export const formularioIRSchema = z.object({
  estado_civil: z.string().optional(),
  conjuge_nome: z.string().max(120).optional(),
  conjuge_cpf: z.string().regex(/^\d{11}$/, 'CPF do cônjuge inválido').or(z.literal('')).optional(),
  dependentes: z.array(dependenteSchema).default([]),
  rendimentos_emprego: z.array(rendimentoEmpregoSchema).default([]),
  rendimentos_autonomo: rendimentoAutonomoSchema.or(z.record(z.unknown())).default({}),
  rendimentos_aluguel: z.array(rendimentoAluguelSchema).default([]),
  outros_rendimentos: outrosRendimentosSchema.or(z.record(z.unknown())).default({}),
  bens_direitos: z.array(bemDireitoSchema).default([]),
  dividas_onus: z.array(dividaOnusSchema).default([]),
  despesas_medicas: z.array(despesaMedicaSchema).default([]),
  despesas_educacao: z.array(despesaEducacaoSchema).default([]),
  previdencia_privada: previdenciaPrivadaSchema.or(z.record(z.unknown())).default({}),
  informacoes_adicionais: z.string().max(5000).optional(),
});

export type FormularioIRValidated = z.infer<typeof formularioIRSchema>;

/**
 * Valida parcialmente os dados (para salvar rascunho).
 * Retorna { success, data, errors }.
 */
export function validatePartial(data: Record<string, unknown>) {
  const result = formularioIRSchema.partial().safeParse(data);
  return result;
}

/**
 * Valida completamente os dados (para finalizar).
 * Retorna { success, data, errors }.
 */
export function validateComplete(data: Record<string, unknown>) {
  const result = formularioIRSchema.safeParse(data);
  return result;
}
