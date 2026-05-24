// =============================================================================
// Pipeline determinístico de validação de PDFs fiscais brasileiros (SEM IA).
//
// Camadas de extração de TEXTO (cascata, tudo determinístico):
//   A. unpdf.extractText                     — wrapper rápido sobre pdfjs
//   B. pdfjs (proxy do unpdf) getTextContent — reconstrói linhas por Y/X
//   C. pdfjs-serverless direto               — força PDF.js sem CMaps externos
//   D. raw stream parser                     — varre os streams do PDF byte-a-byte,
//                                              decodifica Flate e extrai operadores
//                                              de texto (Tj, TJ, ', "). Esta é a
//                                              camada que salva PDFs do PGD/eCAC
//                                              que nenhum PDF.js consegue ler.
//
// Camadas de validação (depois do texto):
//   1. Structure   — sniff de bytes e métricas
//   2. Fingerprint — Creator/Producer/Title do PDF (assinaturas do PGD/eCAC)
//   3. Domain      — DV CPF/CNPJ, DV módulo 11 nº recibo, whitelist DARF
//   4. Parsers     — DIRPF / DSDP / Comunicação Saída / Recibo / DASN-SIMEI / DARF
//   5. Scorer      — agrega evidências e devolve confiança 0–1
//
// Aceite automático exige score ≥ 0.55 + cross-check de CPF/ano feito no caller.
// Se TODAS as camadas A..D falharem, retornamos `scan_sem_texto_real` (PDF imagem
// de verdade) — esses sim caem no modal manual já existente.
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
// DOMAIN VALIDATORS
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

function validateNumeroReciboDV(numero: string): boolean {
  const d = onlyDigits(numero);
  if (d.length < 10) return false;
  if (d.length !== 14) return true;
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

const CODIGOS_DARF_IRPF_PF = new Set([
  "0211", "4600", "6015", "8523", "0190", "5320",
]);

// =============================================================================
// STRUCTURE SNIFF
// =============================================================================

interface PdfStructure {
  isPdf: boolean;
  numPages: number;
  metadata: Record<string, string>;
}

async function sniffPdf(bytes: Uint8Array): Promise<{ pdf: unknown; structure: PdfStructure } | null> {
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
    return { pdf, structure: { isPdf: true, numPages, metadata } };
  } catch (e) {
    console.error("[sniff] falhou:", (e as Error).message);
    return null;
  }
}

// =============================================================================
// EXTRATORES DE TEXTO
// =============================================================================

interface ExtractedText {
  full: string;
  byPage: string[];
  normalized: string;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function buildText(full: string, byPage: string[]): ExtractedText {
  return { full, byPage, normalized: normalize(full) };
}

// --- A: unpdf.extractText (rápido) ---
async function extractA_unpdf(pdf: unknown): Promise<ExtractedText> {
  try {
    const { text } = await extractText(pdf as never, { mergePages: false });
    const byPage: string[] = Array.isArray(text) ? text : [String(text || "")];
    return buildText(byPage.join("\n\n"), byPage);
  } catch (e) {
    console.error("[engine/unpdf] falhou:", (e as Error).message);
    return buildText("", []);
  }
}

// --- B: pdfjs proxy do unpdf, reconstrução por coordenada ---
async function extractB_proxy(pdf: unknown): Promise<ExtractedText> {
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
        const y = Math.round((Number(tr[5]) || 0) * 2) / 2;
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y)!.push({ x, s: str });
      }
      const ys = [...lines.keys()].sort((a, b) => b - a);
      const pageText = ys
        .map((y) => lines.get(y)!.sort((a, b) => a.x - b.x).map((c) => c.s).join(" ").replace(/[ \t]+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
      byPage.push(pageText);
    }
    return buildText(byPage.join("\n\n"), byPage);
  } catch (e) {
    console.error("[engine/proxy] falhou:", (e as Error).message);
    return buildText("", []);
  }
}

// --- C: pdfjs-serverless direto (drop-in do PDF.js sem CMaps externos) ---
async function extractC_pdfjsDirect(bytes: Uint8Array): Promise<ExtractedText> {
  try {
    // deno-lint-ignore no-explicit-any
    const mod: any = await import("https://esm.sh/pdfjs-serverless@0.5.0");
    const getDocument = mod.getDocument || mod.default?.getDocument;
    if (typeof getDocument !== "function") {
      console.error("[engine/pdfjs-direct] getDocument indisponível no módulo");
      return buildText("", []);
    }
    const doc = await getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: false,
      disableFontFace: true,
      isEvalSupported: false,
    }).promise;
    const numPages: number = doc.numPages || 0;
    const byPage: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // deno-lint-ignore no-explicit-any
      const items: any[] = content.items || [];
      const lines = new Map<number, { x: number; s: string }[]>();
      for (const it of items) {
        const str = (it.str ?? "").toString();
        if (!str) continue;
        const tr = it.transform || [1, 0, 0, 1, 0, 0];
        const x = Number(tr[4]) || 0;
        const y = Math.round((Number(tr[5]) || 0) * 2) / 2;
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y)!.push({ x, s: str });
      }
      const ys = [...lines.keys()].sort((a, b) => b - a);
      const pageText = ys
        .map((y) => lines.get(y)!.sort((a, b) => a.x - b.x).map((c) => c.s).join(" ").replace(/[ \t]+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
      byPage.push(pageText);
    }
    return buildText(byPage.join("\n\n"), byPage);
  } catch (e) {
    console.error("[engine/pdfjs-direct] falhou:", (e as Error).message);
    return buildText("", []);
  }
}

// --- D: RAW STREAM PARSER ---
// Lê o PDF como bytes, encontra blocos `stream`...`endstream`, tenta descomprimir
// com Flate (DecompressionStream nativo do Deno) e extrai texto dos operadores
// PDF (Tj, TJ, ', "). Decodifica strings literais (...) e hex <...>.
// Aplica heurística UTF-16BE quando a string começa com BOM FE FF.
//
// Esta camada NÃO depende de ToUnicode / CMap / fontes — por isso roda mesmo
// nos PDFs do PGD/eCAC que travam o PDF.js.

async function inflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  // Tenta deflate-raw e zlib (deflate). PDFs usam zlib (header 0x78).
  const formats: CompressionFormat[] = ["deflate", "deflate-raw"];
  for (const fmt of formats) {
    try {
      const ds = new DecompressionStream(fmt);
      const stream = new Blob([data]).stream().pipeThrough(ds);
      const out = new Uint8Array(await new Response(stream).arrayBuffer());
      if (out.length > 0) return out;
    } catch { /* tenta próximo formato */ }
  }
  return null;
}

function bytesToLatin1(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

// Decodifica uma string literal PDF do tipo "(...)" tratando escapes \n \r \t \b \f \\ \( \) \ooo
function decodePdfLiteral(raw: string): string {
  // raw já vem sem os parênteses externos
  // Detecta UTF-16BE BOM "\xFE\xFF"
  if (raw.length >= 2 && raw.charCodeAt(0) === 0xFE && raw.charCodeAt(1) === 0xFF) {
    let out = "";
    for (let i = 2; i + 1 < raw.length; i += 2) {
      out += String.fromCharCode((raw.charCodeAt(i) << 8) | raw.charCodeAt(i + 1));
    }
    return out;
  }
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "\\" && i + 1 < raw.length) {
      const n = raw[i + 1];
      if (n === "n") { out += "\n"; i++; }
      else if (n === "r") { out += "\r"; i++; }
      else if (n === "t") { out += "\t"; i++; }
      else if (n === "b") { out += "\b"; i++; }
      else if (n === "f") { out += "\f"; i++; }
      else if (n === "(" || n === ")" || n === "\\") { out += n; i++; }
      else if (n >= "0" && n <= "7") {
        // octal até 3 dígitos
        let oct = n; i++;
        if (i + 1 < raw.length && raw[i + 1] >= "0" && raw[i + 1] <= "7") { oct += raw[i + 1]; i++; }
        if (i + 1 < raw.length && raw[i + 1] >= "0" && raw[i + 1] <= "7") { oct += raw[i + 1]; i++; }
        out += String.fromCharCode(parseInt(oct, 8));
      } else {
        // escape desconhecido — preserva o próximo caractere
        out += n; i++;
      }
    } else if (c === "\r") {
      // CR ou CRLF dentro de literal vira LF
      if (raw[i + 1] === "\n") i++;
      out += "\n";
    } else {
      out += c;
    }
  }
  return out;
}

function decodePdfHex(hex: string): string {
  // hex já vem sem os "<>"
  const clean = hex.replace(/\s+/g, "");
  // pad ímpar com 0
  const h = clean.length % 2 === 0 ? clean : clean + "0";
  // UTF-16BE se começa com FEFF
  if (h.length >= 4 && h.substring(0, 4).toUpperCase() === "FEFF") {
    let out = "";
    for (let i = 4; i + 3 < h.length; i += 4) {
      out += String.fromCharCode(parseInt(h.substring(i, i + 4), 16));
    }
    return out;
  }
  let out = "";
  for (let i = 0; i + 1 < h.length; i += 2) {
    const code = parseInt(h.substring(i, i + 2), 16);
    if (!Number.isNaN(code)) out += String.fromCharCode(code);
  }
  return out;
}

// Extrai conteúdo de strings literais e hex de um content-stream textual.
// Mantém ordem de leitura. Não tenta posicionar por coordenada.
function extractStringsFromContent(content: string): string {
  const pieces: string[] = [];
  let i = 0;
  while (i < content.length) {
    const c = content[i];
    if (c === "(") {
      // achar matching paren considerando escape e nesting
      let depth = 1; let j = i + 1; let raw = "";
      while (j < content.length && depth > 0) {
        const cj = content[j];
        if (cj === "\\" && j + 1 < content.length) { raw += cj + content[j + 1]; j += 2; continue; }
        if (cj === "(") { depth++; raw += cj; j++; continue; }
        if (cj === ")") { depth--; if (depth === 0) break; raw += cj; j++; continue; }
        raw += cj; j++;
      }
      pieces.push(decodePdfLiteral(raw));
      i = j + 1;
    } else if (c === "<" && content[i + 1] !== "<") {
      const end = content.indexOf(">", i + 1);
      if (end === -1) { i++; continue; }
      const hex = content.substring(i + 1, end);
      // Evita confundir com dict <<...>>
      if (/^[0-9a-fA-F\s]*$/.test(hex)) pieces.push(decodePdfHex(hex));
      i = end + 1;
    } else {
      i++;
    }
  }
  // Junta com espaço — o objetivo é reconhecer marcadores fiscais e CPFs,
  // não preservar layout perfeito.
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

async function extractD_rawStreams(bytes: Uint8Array): Promise<ExtractedText> {
  try {
    const latin = bytesToLatin1(bytes);
    const collected: string[] = [];

    // Itera por todos os tokens "stream"..."endstream"
    const streamMarker = "stream";
    const endMarker = "endstream";
    let cursor = 0;
    let streamCount = 0;
    while (true) {
      const sIdx = latin.indexOf(streamMarker, cursor);
      if (sIdx === -1) break;
      // O byte logo após "stream" pode ser \n ou \r\n
      let dataStart = sIdx + streamMarker.length;
      if (latin[dataStart] === "\r") dataStart++;
      if (latin[dataStart] === "\n") dataStart++;
      const eIdx = latin.indexOf(endMarker, dataStart);
      if (eIdx === -1) break;
      // O byte anterior a "endstream" também pode ser EOL
      let dataEnd = eIdx;
      if (latin[dataEnd - 1] === "\n") dataEnd--;
      if (latin[dataEnd - 1] === "\r") dataEnd--;
      cursor = eIdx + endMarker.length;
      streamCount++;

      // Inspeciona o dict imediatamente antes de "stream" (até 400 bytes) pra
      // detectar streams de imagem (JPEG/JBIG2/CCITT/JPX) e pulá-los — eles
      // são lixo binário pra parsing textual e queimam CPU em vão.
      const dictStart = Math.max(0, sIdx - 400);
      const dictPeek = latin.substring(dictStart, sIdx);
      if (/\/(DCTDecode|JBIG2Decode|CCITTFaxDecode|JPXDecode|RunLengthDecode)\b/.test(dictPeek)) continue;
      if (/\/Subtype\s*\/Image\b/.test(dictPeek)) continue;

      const slice = bytes.subarray(dataStart, dataEnd);
      if (slice.length === 0) continue;
      // Limite de tamanho — streams enormes raramente são content streams textuais
      if (slice.length > 2_000_000) continue;


      let decoded: Uint8Array | null = null;
      // Heurística: zlib header começa com 0x78 (0x78 0x9C / 0x78 0xDA / 0x78 0x01)
      if (slice[0] === 0x78) {
        decoded = await inflateRaw(slice);
      }
      // Se não conseguiu inflar ou não é zlib, tenta usar bruto mesmo
      const textBytes = decoded ?? slice;
      const asText = bytesToLatin1(textBytes);

      // Só vale a pena varrer se há algum operador textual
      if (!/[\(<].*[\)>]/.test(asText)) continue;
      if (!/Tj|TJ|\'|\"/.test(asText)) {
        // Mesmo sem operador explícito, às vezes vale extrair strings; mas
        // pra evitar lixo de imagens, exigimos algum sinal textual.
        if (!/(BT|Tf|Td|TD|Tm|T\*)/.test(asText)) continue;
      }
      const extracted = extractStringsFromContent(asText);
      if (extracted.length === 0) continue;
      // Filtro anti-binário: rejeita pedaços onde menos de 70% dos chars são
      // ASCII imprimíveis (caso típico: tabelas Huffman de JPEG embarcado).
      let printable = 0;
      for (let k = 0; k < extracted.length; k++) {
        const code = extracted.charCodeAt(k);
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || (code >= 160 && code <= 255 && code !== 0xFF)) printable++;
      }
      if (printable / extracted.length < 0.7) continue;
      collected.push(extracted);
    }

    const full = collected.join("\n");
    console.log(`[engine/raw-stream] streams=${streamCount} pedacos=${collected.length} chars=${full.length}`);
    return buildText(full, collected);
  } catch (e) {
    console.error("[engine/raw-stream] falhou:", (e as Error).message);
    return buildText("", []);
  }
}

// Orquestra cascata de extratores. Retorna o melhor resultado encontrado.
async function extractTextCascade(pdf: unknown, bytes: Uint8Array): Promise<{ text: ExtractedText; engines: string[] }> {
  const engines: string[] = [];
  const hasFiscalMarkers = (s: string) =>
    /declaracao|recibo|darf|simei|exerc[ií]cio|imposto|receita\s+federal/i.test(s);
  const score = (t: ExtractedText) => {
    const len = t.full.replace(/\s/g, "").length;
    const markers = hasFiscalMarkers(t.normalized) ? 1 : 0;
    return len + markers * 500;
  };

  let best = buildText("", []);
  let bestEngine = "none";

  const tryEngine = (name: string, t: ExtractedText) => {
    const len = t.full.replace(/\s/g, "").length;
    const markers = hasFiscalMarkers(t.normalized);
    engines.push(`${name}:len=${len},markers=${markers}`);
    console.log(`[engine/${name}] len=${len} markers=${markers}`);
    if (score(t) > score(best)) { best = t; bestEngine = name; }
  };

  tryEngine("unpdf", await extractA_unpdf(pdf));
  // Se já temos texto suficiente com marcadores fiscais, dá pra parar.
  if (score(best) >= 300 && hasFiscalMarkers(best.normalized)) {
    console.log(`[cascade] winner=${bestEngine} (early)`);
    return { text: best, engines };
  }

  tryEngine("pdfjs-proxy", await extractB_proxy(pdf));
  if (score(best) >= 300 && hasFiscalMarkers(best.normalized)) {
    console.log(`[cascade] winner=${bestEngine} (after proxy)`);
    return { text: best, engines };
  }

  tryEngine("pdfjs-direct", await extractC_pdfjsDirect(bytes));
  if (score(best) >= 300 && hasFiscalMarkers(best.normalized)) {
    console.log(`[cascade] winner=${bestEngine} (after direct)`);
    return { text: best, engines };
  }

  tryEngine("raw-stream", await extractD_rawStreams(bytes));
  console.log(`[cascade] winner=${bestEngine} engines=[${engines.join("; ")}]`);
  return { text: best, engines };
}

// =============================================================================
// FINGERPRINT
// =============================================================================

interface FingerprintHit {
  matched: boolean;
  produtor: "pgd_rfb" | "ecac_rfb" | "outro" | "desconhecido";
  confianca: number;
  detalhes: string;
}

function detectFingerprint(meta: Record<string, string>): FingerprintHit {
  const creator = (meta.Creator || meta.creator || "").toString();
  const producer = (meta.Producer || meta.producer || "").toString();
  const title = (meta.Title || meta.title || "").toString();
  const all = `${creator} | ${producer} | ${title}`;
  const n = normalize(all);
  if (/programa gerador da declaracao|pgd|irpf\s*\d{4}|dirpf|saida\s+definitiva/.test(n)) {
    return { matched: true, produtor: "pgd_rfb", confianca: 0.35, detalhes: `PGD/IRPF: ${all}` };
  }
  if (/receita federal|ecac|simei|dasn|gov\.br/.test(n)) {
    return { matched: true, produtor: "ecac_rfb", confianca: 0.25, detalhes: `eCAC/RFB: ${all}` };
  }
  return { matched: false, produtor: "desconhecido", confianca: 0, detalhes: all };
}

// =============================================================================
// FIELD FINDERS
// =============================================================================

function findCPF(text: string): string | null {
  const re = /(\d{3}\.\d{3}\.\d{3}-\d{2})/g;
  for (const m of text.match(re) || []) if (validateCPF(m)) return onlyDigits(m);
  // CPF com espaços ou pontos não-canônicos
  const re2 = /(\d{3})[.\s-](\d{3})[.\s-](\d{3})[.\s-](\d{2})/g;
  for (const m of text.matchAll(re2)) {
    const joined = m[1] + m[2] + m[3] + m[4];
    if (validateCPF(joined)) return joined;
  }
  for (const m of text.match(/\b(\d{11})\b/g) || []) if (validateCPF(m)) return m;
  return null;
}

function findCNPJ(text: string): string | null {
  const re = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
  for (const m of text.match(re) || []) if (validateCNPJ(m)) return onlyDigits(m);
  for (const m of text.match(/\b(\d{14})\b/g) || []) if (validateCNPJ(m)) return m;
  return null;
}

function findAno(text: string, ctx: "exercicio" | "calendario", preferAno?: number): number | null {
  const padroes = ctx === "exercicio"
    ? [
        /exerc[ií]cio\s+(?:de\s+|fiscal\s+)?(\d{4})/gi,
        /ano[-\s]?exerc[ií]cio[:\s]+(\d{4})/gi,
        /irpf\s*(\d{4})/gi,
        /dirpf\s*(\d{4})/gi,
        /declara[cç][aã]o\s+(?:de\s+)?ajuste\s+anual[^\n\r]{0,40}?(\d{4})/gi,
      ]
    : [
        /ano[-\s]calend[aá]rio[:\s]+(\d{4})/gi,
        /ano\s+base[:\s]+(\d{4})/gi,
        /per[ií]odo\s+(?:de\s+)?apura[cç][aã]o[:\s]+\d{2}\/(\d{4})/gi,
      ];
  const candidatos: number[] = [];
  for (const re of padroes) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const a = parseInt(m[1]);
      if (a >= 2000 && a <= 2100) candidatos.push(a);
    }
  }
  if (candidatos.length === 0) {
    // Fallback exercicio: se o ano esperado aparece em qualquer lugar do texto
    // como ano de 4 dígitos, aceita (cobre OCR que estraga o label).
    if (ctx === "exercicio" && preferAno) {
      const re = new RegExp(`\\b${preferAno}\\b`);
      if (re.test(text)) return preferAno;
    }
    return null;
  }
  // Prefere o ano-base esperado se aparece entre os candidatos.
  if (preferAno && candidatos.includes(preferAno)) return preferAno;
  // Caso contrário, devolve o mais frequente.
  const count = new Map<number, number>();
  for (const a of candidatos) count.set(a, (count.get(a) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function findNumeroRecibo(text: string): string | null {
  const re1 = /(\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2,4}[-.\s]\d{2})/;
  const m1 = text.match(re1); if (m1) return m1[1].trim();
  const re2 = /n[uú]mero\s+do\s+recibo[:\s]+([\d.\-\s]{14,30})/i;
  const m2 = text.match(re2); if (m2) return m2[1].trim();
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
// PARSERS
// =============================================================================

interface ParseInput {
  text: ExtractedText;
  fingerprint: FingerprintHit;
  anoBase: number;
  cpfClienteDigits: string;
}

// ---------- Extração robusta do resultado (Restituir / Pagar) ----------------
//
// Estratégia (anti-falso-positivo, ex.: pegar 18.406,97 dos rendimentos):
//   1. Recorta a janela do RESUMO (bloco "RESUMO ... INFORMAÇÕES BANCÁRIAS"
//      ou início/fim do texto se a âncora não existir).
//   2. Procura os labels "IMPOSTO A RESTITUIR" e "SALDO DE IMPOSTO A PAGAR"
//      apenas dentro dessa janela.
//   3. Para cada label, pega o PRIMEIRO valor monetário que aparece à frente,
//      desde que entre o label e o valor NÃO exista nenhum outro label
//      conhecido (Base de cálculo, Imposto devido, Alíquota, Quota, etc.).
//      Isso evita pegar "Base de cálculo 13.033,63" quando o label-alvo é
//      "Imposto a Restituir" mas o 892,31 ficou em outra Y-row.
//   4. Coleta totais de rendimentos / base de cálculo / imposto devido na
//      mesma janela; se o candidato bater com algum deles, descarta e
//      sinaliza `inconsistente` — o caller cai para AI/manual.
function extractResultadoFromResumo(full: string): {
  tipo: "restituicao" | "pagamento" | "nenhum";
  valor: number;
  inconsistente: boolean;
  motivo: string;
} {
  const moneyRe = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

  // 1) Recorta janela do RESUMO (tolerante a OCR: sem acentos, com quebras)
  const reResumo = /\bresumo\b[\s\S]{0,5000}?(?=informa[cç][oõ]es\s+banc[aá]rias|pagamentos\s+efetuados|p[aá]gina\s+\d|$)/i;
  const mWin = full.match(reResumo);
  const window = mWin ? mWin[0] : full;

  // 2) Coletar números "perigosos"
  const blacklist = new Set<number>();
  const pushBL = (s: string | undefined) => {
    if (!s) return;
    const v = parseMoneyBR(s);
    if (v !== null && v > 0) blacklist.add(v);
  };
  const reRendTotal = /rendimentos\s+tribut[aá]veis[\s\S]{0,800}?\btotal\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  pushBL(window.match(reRendTotal)?.[1]);
  const reBase = /base\s+de\s+c[aá]lculo[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  pushBL(window.match(reBase)?.[1]);
  const reDev = /imposto\s+devido\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  pushBL(window.match(reDev)?.[1]);
  const reTotDev = /total\s+do\s+imposto\s+devido[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  pushBL(window.match(reTotDev)?.[1]);
  const reDed = /dedu[cç][oõ]es[\s\S]{0,800}?\btotal\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  pushBL(window.match(reDed)?.[1]);

  // 3) Labels — tolerantes a quebras de linha do OCR e variações sem acento
  const labelPag = /(?:saldo\s+(?:de\s+)?)?imposto\s+a\s+pagar(?!\s+sobre)/gi;
  const labelRes = /imposto\s+a\s+restituir/gi;
  const competing = /(base\s+de\s+c[aá]lculo|imposto\s+devido|al[ií]quota|quota\s+[uú]nica|dedu[cç][aã]o|total\s+(?:dos|do)|valor\s+da\s+quota|aliquota\s+efetiva|rendimentos)/i;

  function pickValueAfter(label: RegExp): number | null {
    label.lastIndex = 0;
    let best: number | null = null;
    let m: RegExpExecArray | null;
    while ((m = label.exec(window)) !== null) {
      const start = m.index + m[0].length;
      const slice = window.slice(start, start + 300);
      moneyRe.lastIndex = 0;
      const mm = moneyRe.exec(slice);
      if (!mm) continue;
      const between = slice.slice(0, mm.index);
      if (competing.test(between)) continue;
      const v = parseMoneyBR(mm[0]);
      if (v === null) continue;
      if (blacklist.has(v)) return -1;
      // Prefere o primeiro valor encontrado
      if (best === null) best = v;
    }
    return best;
  }

  const vPag = pickValueAfter(labelPag);
  const vRes = pickValueAfter(labelRes);

  if (vPag === -1 || vRes === -1) {
    return { tipo: "nenhum", valor: 0, inconsistente: true, motivo: "valor candidato coincide com total de rendimentos/base/imposto devido" };
  }

  if (vPag !== null && vPag > 0 && vRes !== null && vRes > 0) {
    return { tipo: "nenhum", valor: 0, inconsistente: true, motivo: "pagar>0 e restituir>0 simultaneamente" };
  }
  if (vPag !== null && vPag > 0) return { tipo: "pagamento", valor: vPag, inconsistente: false, motivo: "" };
  if (vRes !== null && vRes > 0) return { tipo: "restituicao", valor: vRes, inconsistente: false, motivo: "" };
  return { tipo: "nenhum", valor: 0, inconsistente: false, motivo: "" };
}


function parseDeclaracao(inp: ParseInput): NativeResult {
  const { text, fingerprint, anoBase, cpfClienteDigits } = inp;
  const n = text.normalized;

  const hasDirpf = /declaracao\s+de\s+ajuste\s+anual/.test(n)
    || /imposto\s+sobre\s+a\s+renda\s+da\s+pessoa\s+f[ií]sica/.test(n)
    || /resumo\s+da\s+declaracao/.test(n)
    || /dirpf/.test(n);
  const hasDSDP = /declaracao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(n);
  const hasComSaida = /comunicacao\s+de\s+sa[ií]da\s+definitiva\s+do\s+pa[ií]s/.test(n);

  if (!hasDirpf && !hasDSDP && !hasComSaida) {
    return { ok: false, reason: "marcadores DIRPF/DSDP/Comunicação ausentes no texto extraído" };
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

  const ano = findAno(text.full, "exercicio", anoBase);
  if (!ano) return { ok: false, reason: "ano-exercício não encontrado" };
  if (ano !== anoBase) {
    return { ok: false, reason: `ano ${ano} ≠ ano_base ${anoBase}` };
  }

  let tipo_resultado: "restituicao" | "pagamento" | "nenhum" = "nenhum";
  let valor_resultado = 0;

  if (subtipo === "dirpf" || subtipo === "saida_definitiva") {
    const res = extractResultadoFromResumo(text.full);
    if (res.inconsistente) {
      return { ok: false, reason: `valor_resultado_inconsistente: ${res.motivo}` };
    }
    tipo_resultado = res.tipo;
    valor_resultado = res.valor;
  }

  let score = 0.45;
  if (fingerprint.matched) score += fingerprint.confianca;
  score += 0.20; // CPF e ano bateram
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

  const ano = findAno(text.full, "exercicio", anoBase);
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

  const ano = findAno(text.full, "calendario", anoBase - 1) || findAno(text.full, "exercicio", anoBase);
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

  let score = 0.55;
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
  const sniff = await sniffPdf(bytes);
  if (!sniff) return { ok: false, reason: "arquivo não é um PDF válido" };
  const { pdf, structure } = sniff;
  if (structure.numPages > 50) return { ok: false, reason: "PDF com muitas páginas (>50)" };

  // Pré-detecção de PDF imagem (escaneado): se não há /Font no documento mas
  // existem /Image ou filtros de imagem, é um scan — curto-circuita pra evitar
  // queimar CPU em todas as engines.
  const head = bytesToLatin1(bytes.subarray(0, Math.min(bytes.length, 2_000_000)));
  const hasFont = /\/Font\b/.test(head);
  const hasImage = /\/(DCTDecode|JBIG2Decode|CCITTFaxDecode|JPXDecode)\b|\/Subtype\s*\/Image\b/.test(head);
  if (!hasFont && hasImage) {
    console.log(`[pipeline] FAIL tipo=${tipo} -> scan_sem_texto_real (sem /Font, com imagem)`);
    return { ok: false, reason: "scan_sem_texto_real" };
  }

  const { text, engines } = await extractTextCascade(pdf, bytes);
  const textLen = text.full.replace(/\s/g, "").length;
  const hasFiscal = /declaracao|recibo|darf|simei|exerc[ií]cio|imposto|receita\s+federal|cpf|restitui|pagamento/i.test(text.normalized);
  if (textLen < 80 || !hasFiscal) {
    console.log(`[pipeline] FAIL tipo=${tipo} textLen=${textLen} hasFiscal=${hasFiscal} engines=[${engines.join("; ")}] -> scan_sem_texto_real`);
    return { ok: false, reason: "scan_sem_texto_real" };
  }


  const fingerprint = detectFingerprint(structure.metadata);
  console.log(`[pipeline] tipo=${tipo} paginas=${structure.numPages} textLen=${textLen} fingerprint=${fingerprint.produtor}(${fingerprint.confianca})`);

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
    const conf = (result.data as { _confianca?: number })._confianca;
    const met = (result.data as { _metodo?: string })._metodo;
    console.log(`[pipeline] OK tipo=${tipo} confianca=${conf} metodo=${met}`);
  } else {
    console.log(`[pipeline] FAIL tipo=${tipo} reason="${result.reason}" textPreview="${text.full.slice(0, 200).replace(/\s+/g, " ")}"`);
  }
  return result;
}

// =============================================================================
// API auxiliar: roda apenas os parsers regex sobre um texto já extraído por
// outro meio (ex.: OCR.space). Usada como fallback quando o PDF é uma imagem.
// =============================================================================
export function parseFromText(
  fullText: string,
  tipo: Tipo,
  anoBase: number,
  cpfCliente: string,
): NativeResult {
  if (!fullText || fullText.replace(/\s/g, "").length < 80) {
    return { ok: false, reason: "texto OCR insuficiente" };
  }
  const byPage = fullText.split(/\f|\n{3,}/);
  const text = buildText(fullText, byPage);
  // Sem metadados — fingerprint neutro
  const fingerprint: FingerprintHit = {
    matched: false,
    produtor: "desconhecido",
    confianca: 0,
    detalhes: "via OCR",
  };
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
    // marca o método como OCR
    (result.data as { _metodo?: string })._metodo = "ocr";
  }
  return result;
}

// =============================================================================
// Helper: extrai apenas o texto bruto (usado pelo fallback de IA, que precisa
// do mesmo texto que o parser nativo viu, sem rodar tudo de novo a partir do
// zero quando o caller já chamou tryNativeValidation). Re-extrai porque o
// pipeline atual descarta o texto após validar.
// =============================================================================
export async function extractRawTextFromPdf(bytes: Uint8Array): Promise<string> {
  try {
    const sniff = await sniffPdf(bytes);
    if (!sniff) return "";
    const { text } = await extractTextCascade(sniff.pdf, bytes);
    return text.full || "";
  } catch (e) {
    console.error("[extractRawTextFromPdf] falhou:", (e as Error).message);
    return "";
  }
}

