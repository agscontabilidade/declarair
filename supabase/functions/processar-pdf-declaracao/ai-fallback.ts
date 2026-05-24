// =============================================================================
// Fallback de extração via Lovable AI Gateway (ÚLTIMO RECURSO).
//
// Só é chamado quando:
//   1. O pipeline determinístico (regex+layout) falhou OU retornou
//      `valor_resultado_inconsistente`.
//   2. Não é o caso de PDF escaneado (esses caem em OCR.space → regex).
//      OBS: se OCR.space conseguiu o texto mas o regex sobre o texto OCR
//      também falhou, então sim chamamos a IA como último passo.
//
// Para economizar créditos:
//   - Usa o modelo mais barato (google/gemini-3-flash-preview).
//   - Trunca o texto em 12k chars (cabeçalho + janela do RESUMO basta).
//   - Tool calling com schema estrito (sem JSON solto).
//   - Anti-alucinação: qualquer valor numérico retornado precisa existir
//     literalmente no texto enviado; senão descarta.
// =============================================================================

import type { Tipo } from "./extract-native.ts";

export type AiExtractionResult =
  | { ok: true; data: Record<string, unknown>; elapsedMs: number }
  | { ok: false; reason: string; elapsedMs: number };

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";
const MAX_TEXT_CHARS = 12_000;

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function parseMoneyBR(s: string): number | null {
  if (!s) return null;
  const c = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

// Garante que um valor numérico aparece literalmente no texto-fonte
// (em formato BR "1.234,56"). Anti-alucinação.
function valueExistsInSource(v: number, source: string): boolean {
  if (!Number.isFinite(v) || v <= 0) return true; // 0 é sempre aceitável
  // formata 1234.56 -> "1.234,56"
  const fixed = v.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const brStr = `${intWithDots},${decPart}`;
  return source.includes(brStr);
}

function truncateForAi(text: string, tipo: Tipo): string {
  if (tipo === "declaracao") {
    // Para declaração, prioriza a janela do RESUMO + cabeçalho.
    const head = text.slice(0, 3_000);
    const idxResumo = text.search(/\bresumo\b/i);
    if (idxResumo > 0) {
      const tail = text.slice(idxResumo, idxResumo + 6_000);
      const combined = `${head}\n\n[...]\n\n${tail}`;
      return combined.length <= MAX_TEXT_CHARS ? combined : combined.slice(0, MAX_TEXT_CHARS);
    }
  }
  if (text.length <= MAX_TEXT_CHARS) return text;
  const head = text.slice(0, 4_000);
  const idxResumo = text.search(/\bresumo\b/i);
  if (idxResumo > 0) {
    const tail = text.slice(idxResumo, idxResumo + 8_000);
    return `${head}\n\n[...]\n\n${tail}`;
  }
  return text.slice(0, MAX_TEXT_CHARS);
}

function schemaFor(tipo: Tipo) {
  switch (tipo) {
    case "declaracao":
      return {
        name: "extrair_declaracao_irpf",
        description: "Extrai dados do RESUMO de uma Declaração de IRPF (DIRPF/DSDP).",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string", description: "CPF do contribuinte titular, apenas dígitos (11)." },
            ano_exercicio: { type: "integer", description: "Ano-exercício da declaração (ex.: 2026)." },
            tipo_resultado: {
              type: "string",
              enum: ["restituicao", "pagamento", "nenhum"],
              description: "Apenas com base no bloco RESUMO: 'restituicao' se IMPOSTO A RESTITUIR > 0; 'pagamento' se SALDO DE IMPOSTO A PAGAR > 0; 'nenhum' se ambos forem zero.",
            },
            valor_resultado: {
              type: "number",
              description: "Valor exato em reais correspondente ao tipo_resultado escolhido. Deve aparecer literalmente no texto, dentro do RESUMO. Use 0 quando tipo_resultado='nenhum'.",
            },
            nome: { type: "string", description: "Nome completo do contribuinte titular." },
          },
          required: ["cpf", "ano_exercicio", "tipo_resultado", "valor_resultado"],
          additionalProperties: false,
        },
      };
    case "recibo":
      return {
        name: "extrair_recibo_rfb",
        description: "Extrai dados de um Recibo de Entrega da Receita Federal.",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string" },
            ano_exercicio: { type: "integer" },
            numero_recibo: { type: "string", description: "Número do recibo no formato dd.dd.dd.dd.dd-dd." },
            data_transmissao: { type: "string", description: "Data no formato YYYY-MM-DD." },
          },
          required: ["cpf", "ano_exercicio", "numero_recibo", "data_transmissao"],
          additionalProperties: false,
        },
      };
    case "mei":
      return {
        name: "extrair_dasn_simei",
        description: "Extrai dados da DASN-SIMEI do MEI.",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string" },
            cnpj: { type: "string", description: "Apenas dígitos (14)." },
            ano_calendario: { type: "integer" },
            numero_recibo: { type: ["string", "null"] },
            data_transmissao: { type: ["string", "null"], description: "YYYY-MM-DD." },
          },
          required: ["cpf", "cnpj", "ano_calendario"],
          additionalProperties: false,
        },
      };
    case "darf":
      return {
        name: "extrair_darf",
        description: "Extrai dados de um DARF de IRPF.",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string" },
            codigo_receita: { type: "string", description: "4 dígitos." },
            valor_principal: { type: "number" },
            valor_total: { type: "number" },
            data_vencimento: { type: ["string", "null"], description: "YYYY-MM-DD." },
          },
          required: ["cpf", "codigo_receita", "valor_principal", "valor_total"],
          additionalProperties: false,
        },
      };
  }
}

export async function runAiExtraction(
  fullText: string,
  tipo: Tipo,
  anoBase: number,
  cpfCliente: string,
): Promise<AiExtractionResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { ok: false, reason: "LOVABLE_API_KEY ausente", elapsedMs: 0 };
  }
  if (!fullText || fullText.replace(/\s/g, "").length < 80) {
    return { ok: false, reason: "texto insuficiente para IA", elapsedMs: 0 };
  }

  const truncated = truncateForAi(fullText, tipo);
  const tool = schemaFor(tipo);

  const systemPrompt = [
    "Você extrai dados estruturados de documentos fiscais brasileiros (Receita Federal).",
    "REGRAS ABSOLUTAS:",
    "1. Use APENAS valores que aparecem literalmente no texto fornecido.",
    "2. Para declarações IRPF, leia EXCLUSIVAMENTE o bloco 'RESUMO' (ignore totais de rendimentos, base de cálculo e imposto devido — esses NÃO são o resultado).",
    "3. Se IMPOSTO A RESTITUIR > 0 -> tipo_resultado='restituicao', valor_resultado=esse número.",
    "4. Se SALDO DE IMPOSTO A PAGAR > 0 -> tipo_resultado='pagamento', valor_resultado=esse número.",
    "5. Se ambos forem zero -> tipo_resultado='nenhum', valor_resultado=0.",
    "6. NUNCA invente dígitos. Se um campo não aparece com clareza no texto, NÃO chame a função.",
  ].join("\n");

  const userPrompt = [
    `Ano-base esperado: ${anoBase}.`,
    `CPF esperado do cliente: ${digits(cpfCliente) || "(desconhecido)"}.`,
    `Tipo de documento: ${tipo}.`,
    "",
    "TEXTO DO DOCUMENTO:",
    "```",
    truncated,
    "```",
  ].join("\n");

  try {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: tool }],
        tool_choice: { type: "function", function: { name: tool.name } },
      }),
    });

    const elapsedMs = Date.now() - t0;

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      if (resp.status === 429) return { ok: false, reason: "rate_limit_ia", elapsedMs };
      if (resp.status === 402) return { ok: false, reason: "creditos_ia_esgotados", elapsedMs };
      return { ok: false, reason: `gateway_${resp.status}: ${body.slice(0, 200)}`, elapsedMs };
    }

    const json = await resp.json();
    const choice = json?.choices?.[0];
    const finishReason = choice?.finish_reason;
    if (finishReason === "length") {
      return { ok: false, reason: "resposta_ia_truncada", elapsedMs };
    }
    const call = choice?.message?.tool_calls?.[0];
    const argsRaw = call?.function?.arguments;
    if (!argsRaw) {
      return { ok: false, reason: "ia_nao_chamou_funcao", elapsedMs };
    }
    let args: Record<string, unknown>;
    try {
      args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
    } catch {
      return { ok: false, reason: "ia_args_invalidos", elapsedMs };
    }

    // ===== Validação cruzada anti-alucinação =====
    // CPF
    if (typeof args.cpf === "string") {
      args.cpf = digits(args.cpf);
      if ((args.cpf as string).length !== 11) {
        return { ok: false, reason: "ia_cpf_invalido", elapsedMs };
      }
      const cpfCli = digits(cpfCliente);
      if (cpfCli && args.cpf !== cpfCli) {
        return { ok: false, reason: `ia_cpf_divergente (${args.cpf} ≠ ${cpfCli})`, elapsedMs };
      }
    }
    // CNPJ (MEI)
    if (tipo === "mei" && typeof args.cnpj === "string") {
      args.cnpj = digits(args.cnpj);
      if ((args.cnpj as string).length !== 14) {
        return { ok: false, reason: "ia_cnpj_invalido", elapsedMs };
      }
    }
    // Valores monetários precisam aparecer literalmente no texto
    const moneyFields = ["valor_resultado", "valor_principal", "valor_total"];
    for (const k of moneyFields) {
      if (typeof args[k] === "number") {
        const v = args[k] as number;
        if (v > 0 && !valueExistsInSource(v, fullText)) {
          return { ok: false, reason: `ia_valor_nao_encontrado_no_texto (${k}=${v})`, elapsedMs };
        }
      }
    }
    // Anti-alucinação extra para declaração: o valor não pode coincidir com
    // totais de rendimentos / base de cálculo / imposto devido (campos que a
    // IA costuma confundir com o resultado final).
    if (tipo === "declaracao" && typeof args.valor_resultado === "number" && (args.valor_resultado as number) > 0) {
      const v = args.valor_resultado as number;
      const moneyRe = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
      const labelsProibidos = [
        /rendimentos\s+tribut[aá]veis[\s\S]{0,400}?\btotal\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /base\s+de\s+c[aá]lculo[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /imposto\s+devido\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /total\s+do\s+imposto\s+devido[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      ];
      const proibidos = new Set<number>();
      for (const re of labelsProibidos) {
        const m = fullText.match(re);
        if (m) {
          const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
          if (Number.isFinite(n) && n > 0) proibidos.add(Math.round(n * 100));
        }
      }
      if (proibidos.has(Math.round(v * 100))) {
        return { ok: false, reason: `ia_valor_coincide_com_total_proibido (${v})`, elapsedMs };
      }
      // O valor precisa estar próximo do label correto (até 250 chars depois).
      const labelEsperado = args.tipo_resultado === "pagamento"
        ? /saldo\s+de\s+imposto\s+a\s+pagar|imposto\s+a\s+pagar(?!\s+sobre)/i
        : args.tipo_resultado === "restituicao"
          ? /imposto\s+a\s+restituir/i
          : null;
      if (labelEsperado) {
        const mL = fullText.match(labelEsperado);
        if (mL && typeof mL.index === "number") {
          const slice = fullText.slice(mL.index, mL.index + 400);
          moneyRe.lastIndex = 0;
          let found = false;
          let m: RegExpExecArray | null;
          while ((m = moneyRe.exec(slice)) !== null) {
            const n = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
            if (Math.abs(n - v) < 0.01) { found = true; break; }
          }
          if (!found) {
            return { ok: false, reason: `ia_valor_distante_do_label (${v})`, elapsedMs };
          }
        }
      }
    }
    // Ano
    const anoKey = tipo === "mei" ? "ano_calendario" : "ano_exercicio";
    if (typeof args[anoKey] === "number") {
      const ano = args[anoKey] as number;
      const okAno = tipo === "mei" ? (ano === anoBase || ano === anoBase - 1) : (ano === anoBase);
      if (!okAno) {
        return { ok: false, reason: `ia_ano_divergente (${ano} ≠ ${anoBase})`, elapsedMs };
      }
    }
    // Número do recibo deve ter formato XX.XX.XX.XX.XX-XX
    if (tipo === "recibo" && typeof args.numero_recibo === "string") {
      const nr = (args.numero_recibo as string).trim();
      if (!/^\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2}-\d{2}$/.test(nr)) {
        return { ok: false, reason: "ia_numero_recibo_formato_invalido", elapsedMs };
      }
      args.numero_recibo = nr;
    }

    // ===== Normaliza para o shape do NativeResult =====
    let data: Record<string, unknown> = {};
    if (tipo === "declaracao") {
      data = {
        eh_declaracao_irpf: true,
        subtipo: "dirpf",
        cpf: args.cpf,
        nome: args.nome || "",
        ano_exercicio: args.ano_exercicio,
        tipo_resultado: args.tipo_resultado || "nenhum",
        valor_resultado: typeof args.valor_resultado === "number" ? args.valor_resultado : 0,
        motivo_rejeicao: null,
        _confianca: 0.70,
        _metodo: "ia",
      };
    } else if (tipo === "recibo") {
      data = {
        eh_recibo_rfb: true,
        numero_recibo: args.numero_recibo,
        cpf: args.cpf,
        ano_exercicio: args.ano_exercicio,
        data_transmissao: args.data_transmissao,
        motivo_rejeicao: null,
        _confianca: 0.70,
        _metodo: "ia",
      };
    } else if (tipo === "mei") {
      data = {
        eh_dasn_simei: true,
        cnpj: args.cnpj,
        cpf: args.cpf,
        ano_calendario: args.ano_calendario,
        numero_recibo: args.numero_recibo ?? null,
        data_transmissao: args.data_transmissao ?? null,
        motivo_rejeicao: null,
        _confianca: 0.70,
        _metodo: "ia",
      };
    } else if (tipo === "darf") {
      data = {
        eh_darf_irpf: true,
        cpf: args.cpf,
        codigo_receita: String(args.codigo_receita).padStart(4, "0"),
        periodo_apuracao: null,
        data_vencimento: args.data_vencimento ?? null,
        valor_principal: typeof args.valor_principal === "number" ? args.valor_principal : parseMoneyBR(String(args.valor_principal || "0")) || 0,
        valor_total: typeof args.valor_total === "number" ? args.valor_total : parseMoneyBR(String(args.valor_total || "0")) || 0,
        motivo_rejeicao: null,
        _confianca: 0.70,
        _metodo: "ia",
      };
    }

    return { ok: true, data, elapsedMs };
  } catch (e) {
    return { ok: false, reason: `excecao: ${(e as Error).message}`, elapsedMs: Date.now() - t0 };
  }
}
