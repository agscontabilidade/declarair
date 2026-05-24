// Extração nativa de PDFs fiscais brasileiros (sem IA).
// Usa unpdf para extrair texto e regex/keywords para identificar o tipo e
// extrair campos. Retorna ok=true só quando há ALTA confiança; caso contrário
// devolve ok=false e o caller cai para IA.

import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

export type Tipo = "declaracao" | "recibo" | "mei" | "darf";

export interface NativeResultDeclaracao {
  eh_declaracao_irpf: true;
  subtipo: "dirpf" | "saida_definitiva" | "comunicacao_saida";
  cpf: string;
  nome: string;
  ano_exercicio: number;
  tipo_resultado: "restituicao" | "pagamento" | "nenhum";
  valor_resultado: number;
  motivo_rejeicao: null;
}
export interface NativeResultRecibo {
  eh_recibo_rfb: true;
  numero_recibo: string;
  cpf: string;
  ano_exercicio: number;
  data_transmissao: string;
  motivo_rejeicao: null;
}
export interface NativeResultMei {
  eh_dasn_simei: true;
  cnpj: string;
  cpf: string;
  ano_calendario: number;
  numero_recibo: string | null;
  data_transmissao: string | null;
  motivo_rejeicao: null;
}
export interface NativeResultDarf {
  eh_darf_irpf: true;
  cpf: string;
  codigo_receita: string;
  periodo_apuracao: string | null;
  data_vencimento: string | null;
  valor_principal: number;
  valor_total: number;
  motivo_rejeicao: null;
}

export type NativeResult =
  | { ok: true; tipo: "declaracao"; data: NativeResultDeclaracao }
  | { ok: true; tipo: "recibo"; data: NativeResultRecibo }
  | { ok: true; tipo: "mei"; data: NativeResultMei }
  | { ok: true; tipo: "darf"; data: NativeResultDarf }
  | { ok: false; reason: string };

// ============ Utilidades ============

function onlyDigits(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
}

function validateCPF(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(d[10]);
}

function validateCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string, weights: number[]) => {
    let s = 0;
    for (let i = 0; i < weights.length; i++) s += parseInt(base[i]) * weights[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return calc(d, w1) === parseInt(d[12]) && calc(d, w2) === parseInt(d[13]);
}

// Converte string monetária BR "1.234,56" ou "1234,56" para number
function parseMoneyBR(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// ============ Extração de texto do PDF ============

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    // unpdf aceita Uint8Array — copia para garantir buffer plain
    const buf = new Uint8Array(bytes);
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : (text || "");
  } catch (e) {
    console.error("[native] extractPdfText falhou:", (e as Error).message);
    return "";
  }
}

// ============ Helpers de extração ============

function findCPF(text: string): string | null {
  // Procura por XXX.XXX.XXX-XX no texto (formato confiável)
  const re = /(\d{3}\.\d{3}\.\d{3}-\d{2})/g;
  const matches = text.match(re) || [];
  for (const m of matches) {
    if (validateCPF(m)) return onlyDigits(m);
  }
  // Fallback: 11 dígitos seguidos (menos confiável, só se único)
  const re2 = /\b(\d{11})\b/g;
  const m2 = text.match(re2) || [];
  for (const x of m2) {
    if (validateCPF(x)) return x;
  }
  return null;
}

function findCNPJ(text: string): string | null {
  const re = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
  const matches = text.match(re) || [];
  for (const m of matches) {
    if (validateCNPJ(m)) return onlyDigits(m);
  }
  return null;
}

function findAnoExercicio(text: string, ctx: "exercicio" | "calendario" = "exercicio"): number | null {
  // Tenta achar "Exercício de YYYY" ou "Ano-Calendário YYYY"
  const padroes = ctx === "exercicio"
    ? [/exerc[ií]cio\s+(?:de\s+)?(\d{4})/i, /ano-exerc[ií]cio[:\s]+(\d{4})/i, /ano\s+exerc[ií]cio[:\s]+(\d{4})/i]
    : [/ano[-\s]calend[aá]rio[:\s]+(\d{4})/i, /per[ií]odo\s+(?:de\s+)?apura[cç][aã]o[:\s]+\d{2}\/(\d{4})/i];
  for (const re of padroes) {
    const m = text.match(re);
    if (m) {
      const ano = parseInt(m[1]);
      if (ano >= 2000 && ano <= 2100) return ano;
    }
  }
  return null;
}

function findNumeroRecibo(text: string): string | null {
  // Formato típico do recibo da Receita: XX.XX.XX.XX.XX-XX (12 dígitos + DV)
  // Variações: pode ter ou não pontos. Tamanhos vistos: 14-20 dígitos.
  const re = /(\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2,4}[-\.\s]?\d{2})/;
  const m = text.match(re);
  if (m) return m[1];
  // Padrão alternativo
  const re2 = /n[uú]mero\s+do\s+recibo[:\s]+([\d.\-\s]{14,30})/i;
  const m2 = text.match(re2);
  if (m2) return m2[1].trim();
  return null;
}

function findDataTransmissao(text: string): string | null {
  // Procura "data da transmissão" ou "transmitida em" + DD/MM/AAAA
  const padroes = [
    /transmiss[aã]o[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /transmitida\s+em[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /data\s+de\s+entrega[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  ];
  for (const re of padroes) {
    const m = text.match(re);
    if (m) {
      const [d, mo, y] = m[1].split("/");
      return `${y}-${mo}-${d}`;
    }
  }
  return null;
}

// ============ Detectores por tipo ============

function detectDeclaracao(text: string, anoBaseEsperado: number, cpfClienteDigits: string): NativeResult {
  const norm = normalize(text);

  // Marcadores únicos
  const hasDirpf = /declaracao\s+de\s+ajuste\s+anual/.test(norm)
    || /imposto\s+sobre\s+a\s+renda\s+da\s+pessoa\s+f[ií]sica/.test(norm);
  const hasDSDP = /declaracao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(norm);
  const hasComSaida = /comunicacao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(norm);

  // Anti-marcadores (não confundir com recibo)
  const ehRecibo = /recibo\s+de\s+entrega/.test(norm);

  if (!hasDirpf && !hasDSDP && !hasComSaida) {
    return { ok: false, reason: "marcadores DIRPF/DSDP/Comunicação não encontrados no texto" };
  }
  if (ehRecibo && !hasDirpf && !hasDSDP && !hasComSaida) {
    return { ok: false, reason: "PDF parece ser recibo, não declaração" };
  }

  let subtipo: "dirpf" | "saida_definitiva" | "comunicacao_saida";
  if (hasComSaida) subtipo = "comunicacao_saida";
  else if (hasDSDP) subtipo = "saida_definitiva";
  else subtipo = "dirpf";

  const cpf = findCPF(text);
  if (!cpf) return { ok: false, reason: "CPF não encontrado/validado no texto" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF do PDF (${cpf}) != cliente (${cpfClienteDigits})` };
  }

  const ano = findAnoExercicio(text, "exercicio");
  if (!ano) return { ok: false, reason: "ano-exercício não encontrado" };
  if (ano !== anoBaseEsperado) {
    return { ok: false, reason: `ano ${ano} != ano_base ${anoBaseEsperado}` };
  }

  // Nome do declarante: linha contendo "Nome" ou padrão maiúsculo
  let nome = "";
  const reNome = /nome[:\s]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{6,80})/;
  const mNome = text.match(reNome);
  if (mNome) nome = mNome[1].trim().replace(/\s+/g, " ");

  // Resultado financeiro — APENAS para DIRPF. Para DSDP/Comunicação, padrão = nenhum
  let tipo_resultado: "restituicao" | "pagamento" | "nenhum" = "nenhum";
  let valor_resultado = 0;

  if (subtipo === "dirpf") {
    // Procura "Imposto a Pagar" ou "Saldo de Imposto a Pagar" seguido de valor
    const rePagar = /(?:saldo\s+de\s+)?imposto\s+a\s+pagar[^\d]{0,40}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
    const reRestituir = /imposto\s+a\s+restituir[^\d]{0,40}(\d{1,3}(?:\.\d{3})*,\d{2})/i;

    const mPagar = text.match(rePagar);
    const mRest = text.match(reRestituir);
    const vPagar = mPagar ? parseMoneyBR(mPagar[1]) : null;
    const vRest = mRest ? parseMoneyBR(mRest[1]) : null;

    // Confiança ALTA exige que pelo menos uma das duas linhas tenha sido encontrada.
    // Se nenhuma foi encontrada, devolve falha para cair na IA (não chuta "nenhum").
    if (vPagar === null && vRest === null) {
      return { ok: false, reason: "valores de imposto não encontrados no resumo (DIRPF)" };
    }
    if (vPagar !== null && vPagar > 0) {
      tipo_resultado = "pagamento";
      valor_resultado = vPagar;
    } else if (vRest !== null && vRest > 0) {
      tipo_resultado = "restituicao";
      valor_resultado = vRest;
    } else {
      tipo_resultado = "nenhum";
      valor_resultado = 0;
    }
  }

  return {
    ok: true,
    tipo: "declaracao",
    data: {
      eh_declaracao_irpf: true,
      subtipo,
      cpf,
      nome,
      ano_exercicio: ano,
      tipo_resultado,
      valor_resultado,
      motivo_rejeicao: null,
    },
  };
}

function detectRecibo(text: string, anoBaseEsperado: number, cpfClienteDigits: string): NativeResult {
  const norm = normalize(text);
  const hasRecibo = /recibo\s+de\s+entrega/.test(norm) || /recibo\s+da\s+declaracao/.test(norm);
  if (!hasRecibo) return { ok: false, reason: "marcador 'Recibo de Entrega' não encontrado" };

  const cpf = findCPF(text);
  if (!cpf) return { ok: false, reason: "CPF não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF do PDF (${cpf}) != cliente (${cpfClienteDigits})` };
  }

  const numero = findNumeroRecibo(text);
  if (!numero) return { ok: false, reason: "número do recibo não encontrado" };

  const ano = findAnoExercicio(text, "exercicio");
  if (!ano) return { ok: false, reason: "ano-exercício não encontrado" };
  if (ano !== anoBaseEsperado) return { ok: false, reason: `ano ${ano} != ano_base ${anoBaseEsperado}` };

  const data = findDataTransmissao(text);
  if (!data) return { ok: false, reason: "data de transmissão não encontrada" };

  return {
    ok: true,
    tipo: "recibo",
    data: {
      eh_recibo_rfb: true,
      numero_recibo: numero,
      cpf,
      ano_exercicio: ano,
      data_transmissao: data,
      motivo_rejeicao: null,
    },
  };
}

function detectMei(text: string, anoBaseEsperado: number, cpfClienteDigits: string): NativeResult {
  const norm = normalize(text);
  const hasDasn = /dasn[-\s]?simei/.test(norm)
    || /declaracao\s+anual\s+(?:simplificada\s+)?(?:do\s+|para\s+o\s+)?mei/.test(norm);
  if (!hasDasn) return { ok: false, reason: "marcador DASN-SIMEI não encontrado" };

  const cnpj = findCNPJ(text);
  if (!cnpj) return { ok: false, reason: "CNPJ não encontrado/validado" };

  const cpf = findCPF(text);
  if (!cpf) return { ok: false, reason: "CPF do titular não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF do PDF (${cpf}) != cliente (${cpfClienteDigits})` };
  }

  const ano = findAnoExercicio(text, "calendario") || findAnoExercicio(text, "exercicio");
  if (!ano) return { ok: false, reason: "ano-calendário não encontrado" };
  if (ano !== anoBaseEsperado && ano !== anoBaseEsperado - 1) {
    return { ok: false, reason: `ano ${ano} incompatível com ano_base ${anoBaseEsperado}` };
  }

  const numero = findNumeroRecibo(text);
  const data = findDataTransmissao(text);

  return {
    ok: true,
    tipo: "mei",
    data: {
      eh_dasn_simei: true,
      cnpj,
      cpf,
      ano_calendario: ano,
      numero_recibo: numero,
      data_transmissao: data,
      motivo_rejeicao: null,
    },
  };
}

const CODIGOS_DARF_IRPF_PF = ["0211", "4600", "6015"];

function detectDarf(text: string, cpfClienteDigits: string): NativeResult {
  const norm = normalize(text);
  const hasDarf = /documento\s+de\s+arrecada[cç][aã]o/.test(norm) || /\bdarf\b/.test(norm);
  if (!hasDarf) return { ok: false, reason: "marcador DARF não encontrado" };

  // Código da receita: 4 dígitos. Procura "Código da Receita" ou "Cód. Receita"
  const reCodigo = /c[oó]d(?:igo|\.)?\s+(?:da\s+)?receita[:\s]+(\d{4})/i;
  const mCod = text.match(reCodigo);
  if (!mCod) return { ok: false, reason: "código da receita não encontrado" };
  const codigo = mCod[1];
  if (!CODIGOS_DARF_IRPF_PF.includes(codigo)) {
    return { ok: false, reason: `código ${codigo} não é IRPF PF (esperado ${CODIGOS_DARF_IRPF_PF.join(",")})` };
  }

  const cpf = findCPF(text);
  if (!cpf) return { ok: false, reason: "CPF não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF do PDF (${cpf}) != cliente (${cpfClienteDigits})` };
  }

  // Valor principal e total — DARF tem campos identificados
  const reValorPrincipal = /valor\s+(?:do\s+)?principal[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  const reValorTotal = /valor\s+(?:do\s+)?total[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  const mPrin = text.match(reValorPrincipal);
  const mTot = text.match(reValorTotal);
  const valor_principal = mPrin ? parseMoneyBR(mPrin[1]) : null;
  const valor_total = mTot ? parseMoneyBR(mTot[1]) : null;

  if (valor_principal === null || valor_total === null) {
    return { ok: false, reason: "valores principal/total não encontrados com confiança" };
  }

  // Período de apuração e data de vencimento (opcionais — não bloqueiam)
  const rePeriodo = /per[ií]odo\s+(?:de\s+)?apura[cç][aã]o[:\s]+(\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4})/i;
  const reVenc = /data\s+(?:de\s+)?vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i;
  const mPer = text.match(rePeriodo);
  const mVenc = text.match(reVenc);
  let data_vencimento: string | null = null;
  if (mVenc) {
    const [d, mo, y] = mVenc[1].split("/");
    data_vencimento = `${y}-${mo}-${d}`;
  }

  return {
    ok: true,
    tipo: "darf",
    data: {
      eh_darf_irpf: true,
      cpf,
      codigo_receita: codigo,
      periodo_apuracao: mPer ? mPer[1] : null,
      data_vencimento,
      valor_principal,
      valor_total,
      motivo_rejeicao: null,
    },
  };
}

// ============ API pública ============

export async function tryNativeValidation(
  bytes: Uint8Array,
  tipo: Tipo,
  anoBase: number,
  cpfCliente: string,
): Promise<NativeResult> {
  const text = await extractPdfText(bytes);
  // PDFs escaneados retornam pouquíssimo texto — sinaliza claramente
  if (!text || text.replace(/\s/g, "").length < 80) {
    return { ok: false, reason: "scan_sem_texto" };
  }

  const cpfDigits = onlyDigits(cpfCliente);
  switch (tipo) {
    case "declaracao": return detectDeclaracao(text, anoBase, cpfDigits);
    case "recibo": return detectRecibo(text, anoBase, cpfDigits);
    case "mei": return detectMei(text, anoBase, cpfDigits);
    case "darf": return detectDarf(text, cpfDigits);
  }
}

