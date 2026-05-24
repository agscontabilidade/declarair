// =============================================================================
// Extração via Lovable AI Gateway — MULTIMODAL (envia PDF inteiro pro Gemini).
// O Gemini lê PDF nativo, faz OCR de imagens e entende layout, então funciona
// para PDF de texto, PDF/A e PDF escaneado.
// =============================================================================

export type Tipo = "declaracao" | "recibo" | "mei" | "darf";

export type AiExtractionResult =
  | { ok: true; data: Record<string, unknown>; elapsedMs: number }
  | { ok: false; reason: string; elapsedMs: number };

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function parseMoneyBR(s: string): number | null {
  if (!s) return null;
  const c = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

// Converte Uint8Array em base64 (chunked p/ não estourar stack em PDFs grandes)
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function schemaFor(tipo: Tipo) {
  switch (tipo) {
    case "declaracao":
      return {
        name: "extrair_declaracao_irpf",
        description: "Valida que um PDF é uma Declaração de IRPF (DIRPF/DSDP) e extrai apenas CPF, ano e nome. O RESULTADO (restituição/pagamento) NÃO é extraído daqui — é extraído do Recibo.",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string", description: "CPF do contribuinte titular, apenas dígitos (11)." },
            ano_exercicio: { type: "integer", description: "Ano-exercício da declaração (ex.: 2026)." },
            nome: { type: "string", description: "Nome completo do contribuinte titular." },
          },
          required: ["cpf", "ano_exercicio"],
          additionalProperties: false,
        },
      };
    case "recibo":
      return {
        name: "extrair_recibo_rfb",
        description: "Extrai dados de um Recibo de Entrega da Receita Federal, incluindo o resultado da declaração (restituição/pagamento).",
        parameters: {
          type: "object",
          properties: {
            cpf: { type: "string" },
            ano_exercicio: { type: "integer" },
            numero_recibo: { type: "string", description: "Número do recibo no formato dd.dd.dd.dd.dd-dd." },
            data_transmissao: { type: "string", description: "Data no formato YYYY-MM-DD." },
            tipo_resultado: {
              type: "string",
              enum: ["restituicao", "pagamento", "nenhum"],
              description: "Procure no recibo: 'restituicao' se houver IMPOSTO A RESTITUIR > 0; 'pagamento' se houver IMPOSTO A PAGAR / SALDO A PAGAR > 0; 'nenhum' se ambos forem zero ou ausentes.",
            },
            valor_resultado: {
              type: "number",
              description: "Valor em reais correspondente ao tipo_resultado, exatamente como aparece no recibo. Use 0 quando tipo_resultado='nenhum'.",
            },
          },
          required: ["cpf", "ano_exercicio", "numero_recibo", "data_transmissao", "tipo_resultado", "valor_resultado"],
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
  pdfBytes: Uint8Array,
  tipo: Tipo,
  anoBase: number,
  cpfCliente: string,
): Promise<AiExtractionResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { ok: false, reason: "LOVABLE_API_KEY ausente", elapsedMs: 0 };
  }
  if (!pdfBytes || pdfBytes.length < 100) {
    return { ok: false, reason: "pdf_vazio", elapsedMs: 0 };
  }

  const tool = schemaFor(tipo);
  const base64 = bytesToBase64(pdfBytes);
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const systemPrompt = [
    "Você analisa documentos fiscais brasileiros (Receita Federal) lendo o PDF anexado.",
    "O PDF pode conter texto ou ser uma imagem escaneada — leia visualmente em qualquer caso.",
    "REGRAS:",
    "1. Para o RECIBO de entrega: localize 'IMPOSTO A RESTITUIR' ou 'IMPOSTO A PAGAR' (ou 'SALDO A PAGAR'). Se Restituir > 0 → tipo_resultado='restituicao'; se Pagar > 0 → tipo_resultado='pagamento'; se ambos zero/ausentes → tipo_resultado='nenhum' e valor_resultado=0.",
    "2. Para DECLARAÇÃO completa: extraia APENAS CPF, ano e nome. NÃO tente extrair valor de resultado.",
    "3. Use exatamente os números/datas/strings que aparecem no documento. Se um campo obrigatório não está visível, NÃO chame a função.",
  ].join("\n");

  const userPromptText = [
    `Ano-base esperado: ${anoBase}.`,
    `CPF esperado do cliente: ${digits(cpfCliente) || "(desconhecido)"}.`,
    `Tipo de documento: ${tipo}.`,
    "Leia o PDF anexado e chame a função com os dados extraídos.",
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
          {
            role: "user",
            content: [
              { type: "text", text: userPromptText },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
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

    // ===== Validações cruzadas (independentes do texto bruto) =====
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
    if (tipo === "mei" && typeof args.cnpj === "string") {
      args.cnpj = digits(args.cnpj);
      if ((args.cnpj as string).length !== 14) {
        return { ok: false, reason: "ia_cnpj_invalido", elapsedMs };
      }
    }
    const anoKey = tipo === "mei" ? "ano_calendario" : "ano_exercicio";
    if (typeof args[anoKey] === "number") {
      const ano = args[anoKey] as number;
      const okAno = tipo === "mei" ? (ano === anoBase || ano === anoBase - 1) : (ano === anoBase);
      if (!okAno) {
        return { ok: false, reason: `ia_ano_divergente (${ano} ≠ ${anoBase})`, elapsedMs };
      }
    }
    if (tipo === "recibo" && typeof args.numero_recibo === "string") {
      const nr = (args.numero_recibo as string).trim();
      if (!/^\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2}-\d{2}$/.test(nr)) {
        return { ok: false, reason: "ia_numero_recibo_formato_invalido", elapsedMs };
      }
      args.numero_recibo = nr;
    }

    // ===== Normaliza para o shape interno =====
    let data: Record<string, unknown> = {};
    if (tipo === "declaracao") {
      data = {
        eh_declaracao_irpf: true,
        subtipo: "dirpf",
        cpf: args.cpf,
        nome: args.nome || "",
        ano_exercicio: args.ano_exercicio,
        motivo_rejeicao: null,
        _confianca: 0.80,
        _metodo: "ia",
      };
    } else if (tipo === "recibo") {
      data = {
        eh_recibo_rfb: true,
        numero_recibo: args.numero_recibo,
        cpf: args.cpf,
        ano_exercicio: args.ano_exercicio,
        data_transmissao: args.data_transmissao,
        tipo_resultado: args.tipo_resultado || "nenhum",
        valor_resultado: typeof args.valor_resultado === "number" ? args.valor_resultado : 0,
        motivo_rejeicao: null,
        _confianca: 0.80,
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
        _confianca: 0.80,
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
        _confianca: 0.80,
        _metodo: "ia",
      };
    }

    return { ok: true, data, elapsedMs };
  } catch (e) {
    return { ok: false, reason: `excecao: ${(e as Error).message}`, elapsedMs: Date.now() - t0 };
  }
}
