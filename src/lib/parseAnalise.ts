// Utilitário tolerante para extrair os dados estruturados da análise da IA fiscal,
// mesmo quando o JSON salvo está parcialmente inválido.

export type Veredito = 'transmitir' | 'ajustar' | 'nao_transmitir';

export interface PatrimonioParsed {
  anterior: number | null;
  atual: number | null;
  variacao_valor: number | null;
  variacao_perc: number | null;
}

export interface ParsedAnalise {
  veredito: Veredito | null;
  vereditoMensagem: string | null;
  saldo: number | null;
  estouro: boolean | null;
  totalOrigens: number | null;
  totalAplicacoes: number | null;
  riscos: { alto: number; medio: number; baixo: number } | null;
  patrimonio: PatrimonioParsed | null;
  jsonData: Record<string, unknown> | null;
  textoLimpo: string;
}

interface AnaliseRow {
  resultado_texto?: string | null;
  resultado_json?: unknown;
  resumo_visual?: unknown;
  veredito?: string | null;
}

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)\s*```/gi;

const finite = (n: unknown): number | null =>
  typeof n === 'number' && Number.isFinite(n) ? n : null;

function tryJsonParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw); } catch { /* ignore */ }
  const cleaned = raw
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u201C\u201D]/g, '"');
  try { return JSON.parse(cleaned); } catch { /* ignore */ }
  return repairTruncatedJson(cleaned);
}

function repairTruncatedJson(raw: string): Record<string, unknown> | null {
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
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
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

// Extrai patrimônio do texto bruto buscando o bloco "patrimonio": { ... }
function extractPatrimonioFromRaw(raw: string): PatrimonioParsed | null {
  const blockMatch = raw.match(/"patrimonio"\s*:\s*\{([\s\S]{0,400}?)\}/i);
  const block = blockMatch ? blockMatch[1] : raw;
  const anterior = extractNumber(block, 'anterior');
  const atual = extractNumber(block, 'atual');
  const variacao_valor = extractNumber(block, 'variacao_valor');
  const variacao_perc = extractNumber(block, 'variacao_perc');
  if (anterior === null && atual === null && variacao_valor === null && variacao_perc === null) {
    return null;
  }
  return { anterior, atual, variacao_valor, variacao_perc };
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
    patrimonio: null, jsonData: null, textoLimpo: '',
  };
  if (!analise) return empty;

  const texto = analise.resultado_texto || '';
  const matches = Array.from(texto.matchAll(JSON_BLOCK_RE));
  let jsonRaw = '';
  let jsonData: Record<string, unknown> | null = null;
  if (matches.length > 0) {
    jsonRaw = matches[matches.length - 1][1];
    jsonData = tryJsonParse(jsonRaw);
  }
  if (!jsonData && analise.resultado_json && typeof analise.resultado_json === 'object') {
    jsonData = analise.resultado_json as Record<string, unknown>;
  }

  const textoLimpo = texto.replace(JSON_BLOCK_RE, '').trim();

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
    saldo = finite(r.saldo);
    if (typeof r.estouro === 'boolean') estouro = r.estouro;
    totalOrigens = finite(r.total_origens);
    totalAplicacoes = finite(r.total_aplicacoes);
  }
  if (saldo === null && resumoVisual) saldo = finite(resumoVisual.saldo);
  if (estouro === null && resumoVisual && typeof resumoVisual.estouro === 'boolean') estouro = resumoVisual.estouro;
  if (saldo === null && jsonRaw) saldo = extractNumber(jsonRaw, 'saldo');
  if (estouro === null && jsonRaw) estouro = extractBool(jsonRaw, 'estouro');
  if (totalOrigens === null && jsonRaw) totalOrigens = extractNumber(jsonRaw, 'total_origens');
  if (totalAplicacoes === null && jsonRaw) totalAplicacoes = extractNumber(jsonRaw, 'total_aplicacoes');

  // ============ RISCOS ============
  let riscos: { alto: number; medio: number; baixo: number } | null = null;
  const fromObj = (o: Record<string, unknown> | null | undefined) => {
    if (!o) return null;
    const a = finite(o.alto);
    const m = finite(o.medio);
    const b = finite(o.baixo);
    if (a !== null || m !== null || b !== null) {
      return { alto: a ?? 0, medio: m ?? 0, baixo: b ?? 0 };
    }
    return null;
  };
  riscos = fromObj(jsonData?.riscos_count as Record<string, unknown> | undefined)
        ?? fromObj((resumoVisual?.riscos as Record<string, unknown>) ?? undefined);
  if (!riscos && jsonRaw) {
    // procura especificamente o bloco riscos_count para evitar pegar "alto" de outro lugar
    const block = jsonRaw.match(/"riscos_count"\s*:\s*\{([\s\S]{0,200}?)\}/i);
    const target = block ? block[1] : '';
    if (target) {
      const a = extractNumber(target, 'alto');
      const m = extractNumber(target, 'medio');
      const b = extractNumber(target, 'baixo');
      if (a !== null || m !== null || b !== null) {
        riscos = { alto: a ?? 0, medio: m ?? 0, baixo: b ?? 0 };
      }
    }
  }

  // ============ PATRIMONIO ============
  let patrimonio: PatrimonioParsed | null = null;
  if (jsonData?.patrimonio && typeof jsonData.patrimonio === 'object') {
    const p = jsonData.patrimonio as Record<string, unknown>;
    const cand: PatrimonioParsed = {
      anterior: finite(p.anterior),
      atual: finite(p.atual),
      variacao_valor: finite(p.variacao_valor),
      variacao_perc: finite(p.variacao_perc),
    };
    if (cand.anterior !== null || cand.atual !== null || cand.variacao_perc !== null) {
      patrimonio = cand;
    }
  }
  if (!patrimonio && resumoVisual?.patrimonio && typeof resumoVisual.patrimonio === 'object') {
    const p = resumoVisual.patrimonio as Record<string, unknown>;
    patrimonio = {
      anterior: finite(p.anterior),
      atual: finite(p.atual),
      variacao_valor: finite(p.variacao_valor),
      variacao_perc: finite(p.variacao_perc),
    };
  }
  if (!patrimonio && jsonRaw) {
    patrimonio = extractPatrimonioFromRaw(jsonRaw);
  }
  // Recalcula valores derivados quando possível
  if (patrimonio && patrimonio.atual !== null && patrimonio.anterior !== null) {
    if (patrimonio.variacao_valor === null) {
      patrimonio.variacao_valor = patrimonio.atual - patrimonio.anterior;
    }
    if (patrimonio.variacao_perc === null && patrimonio.anterior > 0) {
      patrimonio.variacao_perc = ((patrimonio.atual - patrimonio.anterior) / patrimonio.anterior) * 100;
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

  // Injeta dados reparados de volta no jsonData para o componente visual usar
  if (jsonData) {
    if (patrimonio && (!jsonData.patrimonio || typeof jsonData.patrimonio !== 'object')) {
      jsonData.patrimonio = patrimonio as unknown as Record<string, unknown>;
    } else if (jsonData.patrimonio && patrimonio) {
      // Sobrescreve campos numéricos inválidos do jsonData com os valores reparados
      const existing = jsonData.patrimonio as Record<string, unknown>;
      jsonData.patrimonio = {
        anterior: finite(existing.anterior) ?? patrimonio.anterior,
        atual: finite(existing.atual) ?? patrimonio.atual,
        variacao_valor: finite(existing.variacao_valor) ?? patrimonio.variacao_valor,
        variacao_perc: finite(existing.variacao_perc) ?? patrimonio.variacao_perc,
      } as unknown as Record<string, unknown>;
    }
    if (riscos && !jsonData.riscos_count) {
      jsonData.riscos_count = riscos as unknown as Record<string, unknown>;
    }
    if (jsonData.resumo && typeof jsonData.resumo === 'object') {
      const r = jsonData.resumo as Record<string, unknown>;
      if (saldo !== null && finite(r.saldo) === null) r.saldo = saldo;
      if (totalOrigens !== null && finite(r.total_origens) === null) r.total_origens = totalOrigens;
      if (totalAplicacoes !== null && finite(r.total_aplicacoes) === null) r.total_aplicacoes = totalAplicacoes;
    }
  }

  return {
    veredito, vereditoMensagem, saldo, estouro,
    totalOrigens, totalAplicacoes, riscos, patrimonio,
    jsonData, textoLimpo,
  };
}
