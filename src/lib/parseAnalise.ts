// Utilitário tolerante para extrair os dados estruturados da análise da IA fiscal,
// mesmo quando o JSON salvo está parcialmente inválido.

export type Veredito = 'transmitir' | 'ajustar' | 'nao_transmitir';

export interface ParsedAnalise {
  veredito: Veredito | null;
  vereditoMensagem: string | null;
  saldo: number | null;
  estouro: boolean | null;
  totalOrigens: number | null;
  totalAplicacoes: number | null;
  riscos: { alto: number; medio: number; baixo: number } | null;
  jsonData: Record<string, unknown> | null;
  textoLimpo: string; // resultado_texto sem o bloco ```json
}

interface AnaliseRow {
  resultado_texto?: string | null;
  resultado_json?: unknown;
  resumo_visual?: unknown;
  veredito?: string | null;
}

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)\s*```/gi;

function tryJsonParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw); } catch { /* ignore */ }
  const cleaned = raw
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u201C\u201D]/g, '"');
  try { return JSON.parse(cleaned); } catch { /* ignore */ }
  return repairTruncatedJson(cleaned);
}

function repairTruncatedJson(raw: string): Record<string, unknown> | null {
  // Caminha do final pra trás, balanceia { } [ ] (ignorando conteúdo de strings)
  // e tenta parsear progressivamente até obter um objeto válido.
  for (let end = raw.length; end > 50; end--) {
    const ch = raw[end - 1];
    if (ch !== ',' && ch !== '}' && ch !== ']' && ch !== '"' && ch !== ' ' && ch !== '\n') continue;
    let candidate = raw.slice(0, end).replace(/,\s*$/, '');
    let inString = false, escape = false;
    let openObj = 0, openArr = 0;
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{') openObj++;
      else if (c === '}') openObj--;
      else if (c === '[') openArr++;
      else if (c === ']') openArr--;
    }
    if (inString) candidate += '"';
    while (openArr-- > 0) candidate += ']';
    while (openObj-- > 0) candidate += '}';
    try { return JSON.parse(candidate) as Record<string, unknown>; } catch { /* try shorter */ }
  }
  return null;
}

function extractNumber(text: string, key: string): number | null {
  const re = new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, 'i');
  const m = text.match(re);
  return m ? Number(m[1]) : null;
}

function extractBool(text: string, key: string): boolean | null {
  const re = new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i');
  const m = text.match(re);
  return m ? m[1] === 'true' : null;
}

function extractString(text: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
  const m = text.match(re);
  return m ? m[1] : null;
}

function normalizeVeredito(v: string | null | undefined): Veredito | null {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (s.includes('transmitir') && !s.includes('nao')) return 'transmitir';
  if (s.includes('ajust')) return 'ajustar';
  if (s.includes('nao_transmitir') || s.includes('nao transmitir') || s.includes('bloque')) return 'nao_transmitir';
  return null;
}

export function parseAnalise(analise: AnaliseRow | null | undefined): ParsedAnalise {
  const empty: ParsedAnalise = {
    veredito: null, vereditoMensagem: null, saldo: null, estouro: null,
    totalOrigens: null, totalAplicacoes: null, riscos: null,
    jsonData: null, textoLimpo: '',
  };
  if (!analise) return empty;

  const texto = analise.resultado_texto || '';
  // Extrai bloco JSON do texto
  const matches = Array.from(texto.matchAll(JSON_BLOCK_RE));
  let jsonRaw = '';
  let jsonData: Record<string, unknown> | null = null;
  if (matches.length > 0) {
    jsonRaw = matches[matches.length - 1][1];
    jsonData = tryJsonParse(jsonRaw);
  }
  // resultado_json salvo no banco tem precedência
  if (!jsonData && analise.resultado_json && typeof analise.resultado_json === 'object') {
    jsonData = analise.resultado_json as Record<string, unknown>;
  }

  const textoLimpo = texto.replace(JSON_BLOCK_RE, '').trim();

  // resumo_visual fallback
  const resumoVisual = (analise.resumo_visual && typeof analise.resumo_visual === 'object')
    ? analise.resumo_visual as Record<string, unknown>
    : null;

  // ============ SALDO ============
  let saldo: number | null = null;
  let estouro: boolean | null = null;
  let totalOrigens: number | null = null;
  let totalAplicacoes: number | null = null;
  if (jsonData?.resumo && typeof jsonData.resumo === 'object') {
    const r = jsonData.resumo as Record<string, unknown>;
    if (typeof r.saldo === 'number') saldo = r.saldo;
    if (typeof r.estouro === 'boolean') estouro = r.estouro;
    if (typeof r.total_origens === 'number') totalOrigens = r.total_origens;
    if (typeof r.total_aplicacoes === 'number') totalAplicacoes = r.total_aplicacoes;
  }
  if (saldo === null && resumoVisual && typeof resumoVisual.saldo === 'number') saldo = resumoVisual.saldo;
  if (estouro === null && resumoVisual && typeof resumoVisual.estouro === 'boolean') estouro = resumoVisual.estouro;
  // Fallback regex no texto bruto do JSON
  if (saldo === null && jsonRaw) saldo = extractNumber(jsonRaw, 'saldo');
  if (estouro === null && jsonRaw) estouro = extractBool(jsonRaw, 'estouro');
  if (totalOrigens === null && jsonRaw) totalOrigens = extractNumber(jsonRaw, 'total_origens');
  if (totalAplicacoes === null && jsonRaw) totalAplicacoes = extractNumber(jsonRaw, 'total_aplicacoes');

  // ============ RISCOS ============
  let riscos: { alto: number; medio: number; baixo: number } | null = null;
  const fromObj = (o: Record<string, unknown> | null | undefined) => {
    if (!o) return null;
    const a = typeof o.alto === 'number' ? o.alto : null;
    const m = typeof o.medio === 'number' ? o.medio : null;
    const b = typeof o.baixo === 'number' ? o.baixo : null;
    if (a !== null || m !== null || b !== null) {
      return { alto: a ?? 0, medio: m ?? 0, baixo: b ?? 0 };
    }
    return null;
  };
  riscos = fromObj(jsonData?.riscos_count as Record<string, unknown> | undefined)
        ?? fromObj((resumoVisual?.riscos as Record<string, unknown>) ?? undefined);
  if (!riscos && jsonRaw) {
    // Tenta extrair do texto bruto
    const a = extractNumber(jsonRaw, 'alto');
    const m = extractNumber(jsonRaw, 'medio');
    const b = extractNumber(jsonRaw, 'baixo');
    if (a !== null || m !== null || b !== null) {
      riscos = { alto: a ?? 0, medio: m ?? 0, baixo: b ?? 0 };
    }
  }

  // ============ VEREDITO ============
  let veredito: Veredito | null = null;
  let vereditoMensagem: string | null = null;
  if (jsonData?.conclusao && typeof jsonData.conclusao === 'object') {
    const c = jsonData.conclusao as Record<string, unknown>;
    veredito = normalizeVeredito(c.veredito as string);
    if (typeof c.mensagem === 'string') vereditoMensagem = c.mensagem;
  }
  if (!veredito) veredito = normalizeVeredito(analise.veredito);
  if (!veredito && jsonRaw) veredito = normalizeVeredito(extractString(jsonRaw, 'veredito'));
  if (!vereditoMensagem && jsonRaw) vereditoMensagem = extractString(jsonRaw, 'mensagem');
  if (!vereditoMensagem && resumoVisual && typeof resumoVisual.veredito_msg === 'string') {
    vereditoMensagem = resumoVisual.veredito_msg;
  }

  return {
    veredito, vereditoMensagem, saldo, estouro,
    totalOrigens, totalAplicacoes, riscos,
    jsonData, textoLimpo,
  };
}
