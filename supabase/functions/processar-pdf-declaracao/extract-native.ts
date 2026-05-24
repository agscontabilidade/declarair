// =============================================================================
// Pipeline determinístico de validação de PDFs fiscais brasileiros (SEM IA).
//
// Camadas:
//   1. Structure   — sniff de bytes, contagem de páginas, métricas de texto.
//   2. Text/Layout — unpdf + pdfjs-dist com coordenadas → reconstrução de linhas.
//   3. Fingerprint — Creator/Producer/Title do PDF (assinaturas do PGD/eCAC).
//   4. Domain      — DV de CPF/CNPJ, DV módulo 11 do nº de recibo, whitelist DARF,
//                    coerência temporal (ano-exercício / ano-calendário / vencimentos).
//   5. Parsers     — DIRPF / DSDP / Comunicação Saída / Recibo / DASN-SIMEI / DARF.
//   6. Scorer      — agrega evidências e devolve confiança 0–1.
//
// Aceite automático exige score ≥ 0.80 + cross-check de CPF/ano feito no caller.
// Abaixo disso, devolvemos { ok:false, reason } → o caller cai pro modal manual.
//
// OCR de PDFs escaneados está FORA deste pipeline (Tesseract WASM + canvas em
// Deno edge é instável e estoura o timeout). Esses PDFs seguem caindo no fluxo
// de confirmação manual já existente — mas a maioria absoluta dos PDFs gerados
// pelo PGD/eCAC tem texto pesquisável e cai aqui dentro.
// =============================================================================

import { extractText, getDocumentProxy, getMeta } from "https://esm.sh/unpdf@0.12.1";

export type Tipo = "declaracao" | "recibo" | "mei" | "darf";

// ---------- Tipos de resultado (compatíveis com o caller atual) --------------

export interface NativeResultDeclaracao {
  eh_declaracao_irpf: true;
  subtipo: "dirpf" | "saida_definitiva" | "comunicacao_saida";
  cpf: string;
  nome: string;
  ano_exercicio: number;
  tipo_resultado: "restituicao" | "pagamento" | "nenhum";
  valor_resultado: number;
  motivo_rejeicao: null;
  _confianca?: number;
  _metodo?: string;
}
export interface NativeResultRecibo {
  eh_recibo_rfb: true;
  numero_recibo: string;
  cpf: string;
  ano_exercicio: number;
  data_transmissao: string;
  motivo_rejeicao: null;
  _confianca?: number;
  _metodo?: string;
}
export interface NativeResultMei {
  eh_dasn_simei: true;
  cnpj: string;
  cpf: string;
  ano_calendario: number;
  numero_recibo: string | null;
  data_transmissao: string | null;
  motivo_rejeicao: null;
  _confianca?: number;
  _metodo?: string;
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
  _confianca?: number;
  _metodo?: string;
}

export type NativeResult =
  | { ok: true; tipo: "declaracao"; data: NativeResultDeclaracao }
  | { ok: true; tipo: "recibo"; data: NativeResultRecibo }
  | { ok: true; tipo: "mei"; data: NativeResultMei }
  | { ok: true; tipo: "darf"; data: NativeResultDarf }
  | { ok: false; reason: string };

// =============================================================================
// CAMADA 6 — DOMAIN VALIDATORS
// =============================================================================

const onlyDigits = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

function validateCPF(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let r = 11 - (s % 11); if (r >= 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  r = 11 - (s % 11); if (r >= 10) r = 0;
  return r === parseInt(d[10]);
}

function validateCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string, w: number[]) => {
    let s = 0;
    for (let i = 0; i < w.length; i++) s += parseInt(base[i]) * w[i];
    const r = s % 11; return r < 2 ? 0 : 11 - r;
  };
  return (
    calc(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === parseInt(d[12]) &&
    calc(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === parseInt(d[13])
  );
}

// DV módulo 11 (pesos 2..9 cíclicos, da direita p/ esquerda) usado nos números
// de recibo da Receita Federal. 12 dígitos + 2 DV. Implementação tolerante:
// retorna true se o nº tem 14 dígitos e o DV bate; também aceita 10 dígitos
// (formatos antigos) sem validar DV.
function validateNumeroReciboDV(numero: string): boolean {
  const d = onlyDigits(numero);
  if (d.length < 10) return false;
  if (d.length !== 14) return true; // aceita formatos legados sem DV explícito
  const base = d.slice(0, 12);
  const dv = d.slice(12, 14);
  const mod11 = (str: string) => {
    let s = 0; let w = 2;
    for (let i = str.length - 1; i >= 0; i--) {
      s += parseInt(str[i]) * w; w = w === 9 ? 2 : w + 1;
    }
    const r = s % 11; return r < 2 ? 0 : 11 - r;
  };
  const dv1 = mod11(base);
  const dv2 = mod11(base + String(dv1));
  return `${dv1}${dv2}` === dv;
}

// Whitelist expandida de códigos DARF de IRPF Pessoa Física.
const CODIGOS_DARF_IRPF_PF = new Set([
  "0211", // IRPF — ajuste anual (cota única ou cotas)
  "4600", // Carnê-Leão
  "6015", // Ganhos de capital — alienação de bens/direitos
  "8523", // Ganhos líquidos em renda variável (PF)
  "0190", // IRPF — supl. de aposentadoria
  "5320", // Ganho de capital — moeda estrangeira
]);

// =============================================================================
// CAMADA 1 — STRUCTURE SNIFF
// =============================================================================

interface PdfStructure {
  isPdf: boolean;
  numPages: number;
  textLength: number;
  metadata: Record<string, string>;
}

async function sniffPdf(bytes: Uint8Array): Promise<{ pdf: unknown; structure: PdfStructure } | null> {
  // Magic bytes "%PDF-"
  if (bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    return null;
  }
  try {
    const buf = new Uint8Array(bytes);
    const pdf = await getDocumentProxy(buf);
    // deno-lint-ignore no-explicit-any
    const numPages = (pdf as any).numPages ?? 0;

    let metadata: Record<string, string> = {};
    try {
      const meta = await getMeta(pdf as never);
      // deno-lint-ignore no-explicit-any
      const info = (meta as any)?.info ?? {};
      metadata = Object.fromEntries(
        Object.entries(info).filter(([, v]) => typeof v === "string"),
      ) as Record<string, string>;
    } catch { /* meta opcional */ }

    return { pdf, structure: { isPdf: true, numPages, textLength: 0, metadata } };
  } catch (e) {
    console.error("[layer1] sniff falhou:", (e as Error).message);
    return null;
  }
}

// =============================================================================
// CAMADA 2 — TEXT + LAYOUT (unpdf)
// =============================================================================

interface ExtractedText {
  full: string;          // texto completo, mergePages
  byPage: string[];      // texto por página
  normalized: string;    // full sem acento, lower
}

async function extractFullText(pdf: unknown): Promise<ExtractedText> {
  try {
    const { text } = await extractText(pdf as never, { mergePages: false });
    const byPage: string[] = Array.isArray(text) ? text : [String(text || "")];
    const full = byPage.join("\n\n");
    return { full, byPage, normalized: normalize(full) };
  } catch (e) {
    console.error("[layer2] extractText falhou:", (e as Error).message);
    return { full: "", byPage: [], normalized: "" };
  }
}

// Fallback: usa o próprio PDFDocumentProxy do unpdf (que embute pdfjs sem
// canvas) e reconstrói o texto item-a-item via getTextContent, agrupando por
// coordenada Y. Cobre PDFs onde extractText(mergePages) devolve texto vazio
// ou corrompido — comum nos PDFs do PGD/eCAC com fontes embutidas.
async function extractWithProxy(pdf: unknown): Promise<ExtractedText> {
  try {
    // deno-lint-ignore no-explicit-any
    const doc: any = pdf;
    const numPages: number = doc.numPages || 0;
    const byPage: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
      // deno-lint-ignore no-explicit-any
      const items: any[] = content.items || [];
      const lines = new Map<number, { x: number; s: string }[]>();
      for (const it of items) {
        const str = (it.str ?? "").toString();
        if (!str) continue;
        const tr = it.transform || [1, 0, 0, 1, 0, 0];
        const x = Number(tr[4]) || 0;
        const y = Math.round((Number(tr[5]) || 0) * 2) / 2; // bucket 0.5pt
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y)!.push({ x, s: str });
      }
      const ys = [...lines.keys()].sort((a, b) => b - a); // top → bottom
      const pageText = ys
        .map((y) => lines.get(y)!.sort((a, b) => a.x - b.x).map((c) => c.s).join(" ").replace(/[ \t]+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
      byPage.push(pageText);
    }
    const full = byPage.join("\n\n");
    return { full, byPage, normalized: normalize(full) };
  } catch (e) {
    console.error("[layer2/proxy] fallback falhou:", (e as Error).message);
    return { full: "", byPage: [], normalized: "" };
  }
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// =============================================================================
// CAMADA 3 — FINGERPRINT (metadata do PGD/eCAC)
// =============================================================================

interface FingerprintHit {
  matched: boolean;
  produtor: "pgd_rfb" | "ecac_rfb" | "outro" | "desconhecido";
  confianca: number; // 0..1
  detalhes: string;
}

function detectFingerprint(meta: Record<string, string>): FingerprintHit {
  const creator = (meta.Creator || meta.creator || "").toString();
  const producer = (meta.Producer || meta.producer || "").toString();
  const title = (meta.Title || meta.title || "").toString();
  const all = `${creator} | ${producer} | ${title}`;
  const n = normalize(all);

  if (/programa gerador da declaracao|pgd|irpf\s*\d{4}|dirpf/.test(n)) {
    return { matched: true, produtor: "pgd_rfb", confianca: 0.35, detalhes: `PGD/IRPF: ${all}` };
  }
  if (/receita federal|ecac|simei|dasn|gov\.br/.test(n)) {
    return { matched: true, produtor: "ecac_rfb", confianca: 0.25, detalhes: `eCAC/RFB: ${all}` };
  }
  if (/itext|jaspersoft|jspdf|tcpdf|reportlab|chromium|skia/.test(n)) {
    return { matched: false, produtor: "outro", confianca: 0, detalhes: `Produtor neutro: ${all}` };
  }
  return { matched: false, produtor: "desconhecido", confianca: 0, detalhes: all };
}

// =============================================================================
// FIELD FINDERS (regex sobre texto extraído)
// =============================================================================

function findCPF(text: string): string | null {
  const re = /(\d{3}\.\d{3}\.\d{3}-\d{2})/g;
  for (const m of text.match(re) || []) if (validateCPF(m)) return onlyDigits(m);
  // fallback: 11 dígitos contíguos
  for (const m of text.match(/\b(\d{11})\b/g) || []) if (validateCPF(m)) return m;
  return null;
}

function findCNPJ(text: string): string | null {
  const re = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
  for (const m of text.match(re) || []) if (validateCNPJ(m)) return onlyDigits(m);
  for (const m of text.match(/\b(\d{14})\b/g) || []) if (validateCNPJ(m)) return m;
  return null;
}

function findAno(text: string, ctx: "exercicio" | "calendario"): number | null {
  const padroes = ctx === "exercicio"
    ? [
        /exerc[ií]cio\s+(?:de\s+|fiscal\s+)?(\d{4})/i,
        /ano[-\s]?exerc[ií]cio[:\s]+(\d{4})/i,
        /irpf\s*(\d{4})/i,
      ]
    : [
        /ano[-\s]calend[aá]rio[:\s]+(\d{4})/i,
        /ano\s+base[:\s]+(\d{4})/i,
        /per[ií]odo\s+(?:de\s+)?apura[cç][aã]o[:\s]+\d{2}\/(\d{4})/i,
      ];
  for (const re of padroes) {
    const m = text.match(re);
    if (m) { const a = parseInt(m[1]); if (a >= 2000 && a <= 2100) return a; }
  }
  return null;
}

function findNumeroRecibo(text: string): string | null {
  // Formato canônico XX.XX.XX.XX.XX.XXXX-XX (pontuação variável)
  const re1 = /(\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2,4}[-.\s]\d{2})/;
  const m1 = text.match(re1); if (m1) return m1[1].trim();
  // Próximo a label "Número do Recibo"
  const re2 = /n[uú]mero\s+do\s+recibo[:\s]+([\d.\-\s]{14,30})/i;
  const m2 = text.match(re2); if (m2) return m2[1].trim();
  // 14 dígitos contíguos com DV válido
  for (const m of text.match(/\b\d{14}\b/g) || []) if (validateNumeroReciboDV(m)) return m;
  return null;
}

function findDataTransmissao(text: string): string | null {
  const padroes = [
    /transmiss[aã]o[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /transmitida\s+em[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /data\s+de\s+entrega[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /entregue\s+em[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  ];
  for (const re of padroes) {
    const m = text.match(re);
    if (m) { const [d, mo, y] = m[1].split("/"); return `${y}-${mo}-${d}`; }
  }
  return null;
}

function parseMoneyBR(s: string): number | null {
  if (!s) return null;
  const c = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(c); return Number.isFinite(n) ? n : null;
}

function findNome(text: string): string {
  const re = /nome[:\s]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{6,80})/;
  const m = text.match(re);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

// =============================================================================
// CAMADA 5 — PARSERS por tipo (com scoring)
// =============================================================================

interface ParseInput {
  text: ExtractedText;
  fingerprint: FingerprintHit;
  anoBase: number;
  cpfClienteDigits: string;
}

function parseDeclaracao(inp: ParseInput): NativeResult {
  const { text, fingerprint, anoBase, cpfClienteDigits } = inp;
  const n = text.normalized;

  const hasDirpf = /declaracao\s+de\s+ajuste\s+anual/.test(n)
    || /imposto\s+sobre\s+a\s+renda\s+da\s+pessoa\s+f[ií]sica/.test(n)
    || /resumo\s+da\s+declaracao/.test(n);
  const hasDSDP = /declaracao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(n);
  const hasComSaida = /comunicacao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(n);
  const ehReciboMarker = /recibo\s+de\s+entrega/.test(n);

  if (!hasDirpf && !hasDSDP && !hasComSaida) {
    return { ok: false, reason: "marcadores DIRPF/DSDP/Comunicação ausentes" };
  }
  if (ehReciboMarker && !hasDirpf && !hasDSDP && !hasComSaida) {
    return { ok: false, reason: "PDF parece ser recibo, não declaração" };
  }

  let subtipo: "dirpf" | "saida_definitiva" | "comunicacao_saida";
  if (hasComSaida) subtipo = "comunicacao_saida";
  else if (hasDSDP) subtipo = "saida_definitiva";
  else subtipo = "dirpf";

  const cpf = findCPF(text.full);
  if (!cpf) return { ok: false, reason: "CPF não encontrado/validado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF do PDF (${cpf}) ≠ cliente (${cpfClienteDigits})` };
  }

  const ano = findAno(text.full, "exercicio");
  if (!ano) return { ok: false, reason: "ano-exercício não encontrado" };
  if (ano !== anoBase) {
    return { ok: false, reason: `ano ${ano} ≠ ano_base ${anoBase}` };
  }

  // Resultado financeiro — DIRPF e Saída Definitiva (que também têm RESUMO).
  // Comunicação de Saída não tem apuração de imposto.
  let tipo_resultado: "restituicao" | "pagamento" | "nenhum" = "nenhum";
  let valor_resultado = 0;

  if (subtipo === "dirpf" || subtipo === "saida_definitiva") {
    // Resolvedor tolerante: aceita label e valor na mesma linha OU em linhas
    // adjacentes (PDFs do PGD frequentemente quebram label/valor entre linhas).
    // 1) tenta padrão direto "Label ... 1.234,56"
    const rePagar = /(?:saldo\s+de\s+)?imposto\s+a\s+pagar[^\d\-\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
    const reRest = /imposto\s+a\s+restituir[^\d\-\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
    const mPag = text.full.match(rePagar);
    const mRes = text.full.match(reRest);
    let vPag = mPag ? parseMoneyBR(mPag[1]) : null;
    let vRes = mRes ? parseMoneyBR(mRes[1]) : null;

    // 2) fallback linha-a-linha: procura label e pega o 1º valor monetário nas
    //    próximas 3 linhas (cobre PDFs com label em linha separada do valor).
    if (vPag === null || vRes === null) {
      const lines = text.full.split(/\r?\n/);
      const moneyRe = /(\d{1,3}(?:\.\d{3})*,\d{2})/;
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (vPag === null && /saldo\s+de\s+imposto\s+a\s+pagar|imposto\s+a\s+pagar/i.test(ln)) {
          for (let j = 0; j <= 3 && i + j < lines.length; j++) {
            const mm = lines[i + j].match(moneyRe);
            if (mm) { vPag = parseMoneyBR(mm[1]); break; }
          }
        }
        if (vRes === null && /imposto\s+a\s+restituir/i.test(ln)) {
          for (let j = 0; j <= 3 && i + j < lines.length; j++) {
            const mm = lines[i + j].match(moneyRe);
            if (mm) { vRes = parseMoneyBR(mm[1]); break; }
          }
        }
      }
    }

    if (vPag === null && vRes === null) {
      // Não rejeita a declaração inteira — apenas registra como "nenhum" e
      // deixa o score decidir. Evita falso negativo em DSDP minimalista.
      tipo_resultado = "nenhum"; valor_resultado = 0;
    } else if (vPag !== null && vPag > 0 && vRes !== null && vRes > 0) {
      return { ok: false, reason: "PDF traz pagar>0 e restituir>0 simultaneamente (inconsistência)" };
    } else if (vPag !== null && vPag > 0) {
      tipo_resultado = "pagamento"; valor_resultado = vPag;
    } else if (vRes !== null && vRes > 0) {
      tipo_resultado = "restituicao"; valor_resultado = vRes;
    } else {
      tipo_resultado = "nenhum"; valor_resultado = 0;
    }
  }

  // Scoring
  let score = 0.45; // marcador textual forte
  if (fingerprint.matched) score += fingerprint.confianca;
  if ((subtipo === "dirpf" || subtipo === "saida_definitiva") && (tipo_resultado === "nenhum" || valor_resultado > 0)) score += 0.20;
  if (subtipo === "comunicacao_saida") score += 0.20;
  score = Math.min(1, score);

  if (score < 0.55) return { ok: false, reason: `score baixo (${score.toFixed(2)})` };

  return {
    ok: true,
    tipo: "declaracao",
    data: {
      eh_declaracao_irpf: true,
      subtipo,
      cpf,
      nome: findNome(text.full),
      ano_exercicio: ano,
      tipo_resultado,
      valor_resultado,
      motivo_rejeicao: null,
      _confianca: score,
      _metodo: fingerprint.matched ? "texto+fingerprint" : "texto",
    },
  };
}

function parseRecibo(inp: ParseInput): NativeResult {
  const { text, fingerprint, anoBase, cpfClienteDigits } = inp;
  const n = text.normalized;
  const hasRecibo = /recibo\s+de\s+entrega/.test(n) || /recibo\s+da\s+declaracao/.test(n);
  if (!hasRecibo) return { ok: false, reason: "marcador 'Recibo de Entrega' ausente" };

  const cpf = findCPF(text.full);
  if (!cpf) return { ok: false, reason: "CPF não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF (${cpf}) ≠ cliente (${cpfClienteDigits})` };
  }

  const numero = findNumeroRecibo(text.full);
  if (!numero) return { ok: false, reason: "número do recibo não encontrado" };
  const dvOk = validateNumeroReciboDV(numero);

  const ano = findAno(text.full, "exercicio");
  if (!ano) return { ok: false, reason: "ano-exercício não encontrado" };
  if (ano !== anoBase) return { ok: false, reason: `ano ${ano} ≠ ano_base ${anoBase}` };

  const data = findDataTransmissao(text.full);
  if (!data) return { ok: false, reason: "data de transmissão não encontrada" };

  let score = 0.45;
  if (fingerprint.matched) score += fingerprint.confianca;
  if (dvOk) score += 0.25;
  score = Math.min(1, score);
  if (score < 0.55) return { ok: false, reason: `score baixo (${score.toFixed(2)})` };

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
      _confianca: score,
      _metodo: dvOk ? "texto+dv" : "texto",
    },
  };
}

function parseMei(inp: ParseInput): NativeResult {
  const { text, fingerprint, anoBase, cpfClienteDigits } = inp;
  const n = text.normalized;
  const hasDasn = /dasn[-\s]?simei/.test(n)
    || /declaracao\s+anual\s+(?:simplificada\s+)?(?:do\s+|para\s+o\s+)?mei/.test(n);
  if (!hasDasn) return { ok: false, reason: "marcador DASN-SIMEI ausente" };

  const cnpj = findCNPJ(text.full);
  if (!cnpj) return { ok: false, reason: "CNPJ não encontrado/validado" };

  const cpf = findCPF(text.full);
  if (!cpf) return { ok: false, reason: "CPF do titular não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF (${cpf}) ≠ cliente (${cpfClienteDigits})` };
  }

  const ano = findAno(text.full, "calendario") || findAno(text.full, "exercicio");
  if (!ano) return { ok: false, reason: "ano-calendário não encontrado" };
  if (ano !== anoBase && ano !== anoBase - 1) {
    return { ok: false, reason: `ano ${ano} incompatível com ano_base ${anoBase}` };
  }

  let score = 0.50;
  if (fingerprint.matched) score += fingerprint.confianca;
  score = Math.min(1, score);

  return {
    ok: true,
    tipo: "mei",
    data: {
      eh_dasn_simei: true,
      cnpj,
      cpf,
      ano_calendario: ano,
      numero_recibo: findNumeroRecibo(text.full),
      data_transmissao: findDataTransmissao(text.full),
      motivo_rejeicao: null,
      _confianca: score,
      _metodo: "texto",
    },
  };
}

function parseDarf(inp: ParseInput): NativeResult {
  const { text, fingerprint, cpfClienteDigits } = inp;
  const n = text.normalized;
  const hasDarf = /documento\s+de\s+arrecada[cç][aã]o/.test(n) || /\bdarf\b/.test(n);
  if (!hasDarf) return { ok: false, reason: "marcador DARF ausente" };

  const reCodigo = /c[oó]d(?:igo|\.)?\s+(?:da\s+)?receita[:\s]+(\d{4})/i;
  const mCod = text.full.match(reCodigo);
  if (!mCod) return { ok: false, reason: "código da receita não encontrado" };
  const codigo = mCod[1];
  if (!CODIGOS_DARF_IRPF_PF.has(codigo)) {
    return { ok: false, reason: `código ${codigo} não é IRPF-PF` };
  }

  const cpf = findCPF(text.full);
  if (!cpf) return { ok: false, reason: "CPF não encontrado" };
  if (cpfClienteDigits && cpf !== cpfClienteDigits) {
    return { ok: false, reason: `CPF (${cpf}) ≠ cliente (${cpfClienteDigits})` };
  }

  const reValPrin = /valor\s+(?:do\s+)?principal[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  const reValTot = /valor\s+(?:do\s+)?total[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  const vPrin = (text.full.match(reValPrin) || [])[1];
  const vTot = (text.full.match(reValTot) || [])[1];
  const valor_principal = vPrin ? parseMoneyBR(vPrin) : null;
  const valor_total = vTot ? parseMoneyBR(vTot) : null;
  if (valor_principal === null || valor_total === null) {
    return { ok: false, reason: "valores principal/total não encontrados" };
  }

  const rePer = /per[ií]odo\s+(?:de\s+)?apura[cç][aã]o[:\s]+(\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4})/i;
  const reVenc = /data\s+(?:de\s+)?vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i;
  const mPer = text.full.match(rePer);
  const mVenc = text.full.match(reVenc);
  let data_vencimento: string | null = null;
  if (mVenc) { const [d, mo, y] = mVenc[1].split("/"); data_vencimento = `${y}-${mo}-${d}`; }

  let score = 0.55; // DARF tem campos muito identificáveis
  if (fingerprint.matched) score += fingerprint.confianca;
  if (data_vencimento) score += 0.10;
  score = Math.min(1, score);

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
      _confianca: score,
      _metodo: "texto",
    },
  };
}

// =============================================================================
// API PÚBLICA — pipeline orquestrado
// =============================================================================

export async function tryNativeValidation(
  bytes: Uint8Array,
  tipo: Tipo,
  anoBase: number,
  cpfCliente: string,
): Promise<NativeResult> {
  // CAMADA 1 — sniff
  const sniff = await sniffPdf(bytes);
  if (!sniff) return { ok: false, reason: "arquivo não é um PDF válido" };
  const { pdf, structure } = sniff;
  if (structure.numPages > 50) return { ok: false, reason: "PDF com muitas páginas (>50)" };

  // CAMADA 2 — texto (unpdf primeiro, pdfjs como fallback)
  let text = await extractFullText(pdf);
  let textLen = text.full.replace(/\s/g, "").length;
  let textSource = "unpdf";

  // Marcadores fiscais esperados — se faltarem, vale a pena tentar pdfjs mesmo
  // com textLen > 80 (caso unpdf decodifique caracteres errados).
  const hasFiscalMarkers = (s: string) =>
    /declaracao|recibo|darf|simei|exercicio|imposto/i.test(s);

  if (textLen < 200 || !hasFiscalMarkers(text.normalized)) {
    console.log(`[pipeline] unpdf insuficiente (len=${textLen}, markers=${hasFiscalMarkers(text.normalized)}); tentando pdfjs…`);
    const alt = await extractWithProxy(pdf);
    const altLen = alt.full.replace(/\s/g, "").length;
    if (altLen > textLen && hasFiscalMarkers(alt.normalized)) {
      text = alt; textLen = altLen; textSource = "pdfjs";
    } else if (altLen > textLen) {
      text = alt; textLen = altLen; textSource = "pdfjs";
    }
  }

  if (textLen < 80) {
    return { ok: false, reason: "scan_sem_texto" };
  }

  // CAMADA 3 — fingerprint
  const fingerprint = detectFingerprint(structure.metadata);
  console.log(`[pipeline] tipo=${tipo} paginas=${structure.numPages} textLen=${textLen} source=${textSource} fingerprint=${fingerprint.produtor}(${fingerprint.confianca}) detalhes="${fingerprint.detalhes.slice(0, 120)}"`);

  // CAMADAS 4+5 — domain + parsers
  const cpfDigits = onlyDigits(cpfCliente);
  const input: ParseInput = { text, fingerprint, anoBase, cpfClienteDigits: cpfDigits };

  let result: NativeResult;
  switch (tipo) {
    case "declaracao": result = parseDeclaracao(input); break;
    case "recibo": result = parseRecibo(input); break;
    case "mei": result = parseMei(input); break;
    case "darf": result = parseDarf(input); break;
  }

  if (result.ok) {
    console.log(`[pipeline] OK tipo=${tipo} confianca=${(result.data as { _confianca?: number })._confianca} metodo=${(result.data as { _metodo?: string })._metodo}`);
  } else {
    console.log(`[pipeline] FAIL tipo=${tipo} reason="${result.reason}"`);
  }
  return result;
}
