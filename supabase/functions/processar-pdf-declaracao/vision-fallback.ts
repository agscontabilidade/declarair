// =============================================================================
// VISION fallback: envia o PDF inteiro (base64) para Gemini 2.5 Pro pelo
// Lovable AI Gateway. O modelo LÊ visualmente o bloco RESUMO e devolve o
// tipo de resultado + valor + uma "linha_citada" copiada literalmente do PDF.
//
// Anti-alucinação dupla:
//   1. O valor monetário precisa existir literalmente no OCR text já obtido.
//   2. A linha_citada (após normalização) precisa aparecer dentro do OCR text.
//   3. Para restituição a linha precisa conter RESTITUIR; para pagamento, PAGAR.
//   4. O valor não pode coincidir com totais já vistos como "rendimentos" /
//      "base de cálculo" / "imposto devido".
// =============================================================================

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-pro";
const MAX_PDF_BYTES = 18 * 1024 * 1024;

export type VisionResult =
  | { ok: true; data: Record<string, unknown>; elapsedMs: number }
  | { ok: false; reason: string; elapsedMs: number };

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid stack overflow on large inputs
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function normalizeForMatch(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function valueExistsInSource(v: number, source: string): boolean {
  if (!Number.isFinite(v) || v <= 0) return true;
  const fixed = v.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const brStr = `${intWithDots},${decPart}`;
  return source.includes(brStr);
}

const TOOL = {
  name: "extrair_resultado_declaracao",
  description:
    "Lê visualmente o bloco RESUMO da Declaração de IRPF e devolve o resultado final.",
  parameters: {
    type: "object",
    properties: {
      cpf: { type: "string", description: "CPF do titular, apenas dígitos (11)." },
      nome: { type: "string", description: "Nome completo do titular." },
      ano_exercicio: { type: "integer", description: "Ano-exercício (ex.: 2026)." },
      tipo_resultado: {
        type: "string",
        enum: ["restituicao", "pagamento", "nenhum"],
        description:
          "'restituicao' se IMPOSTO A RESTITUIR > 0; 'pagamento' se SALDO DE IMPOSTO A PAGAR > 0; 'nenhum' se ambos forem zero.",
      },
      valor_resultado: {
        type: "number",
        description:
          "Valor em reais (use ponto decimal, ex.: 1836.56). Use 0 se tipo_resultado='nenhum'.",
      },
      linha_citada: {
        type: "string",
        description:
          "COPIE LITERALMENTE a linha do PDF que contém o label (ex.: 'Imposto a Restituir') e o valor. Não parafraseie. Não traduza.",
      },
      pagina_origem: {
        type: "integer",
        description: "Número da página (1-indexed) onde a linha foi lida.",
      },
    },
    required: [
      "cpf",
      "ano_exercicio",
      "tipo_resultado",
      "valor_resultado",
      "linha_citada",
    ],
    additionalProperties: false,
  },
};

export async function runVisionExtraction(
  pdfBytes: Uint8Array,
  ocrText: string,
  anoBase: number,
  cpfCliente: string,
): Promise<VisionResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { ok: false, reason: "LOVABLE_API_KEY ausente", elapsedMs: 0 };
  if (pdfBytes.byteLength > MAX_PDF_BYTES) {
    return { ok: false, reason: "pdf_muito_grande_para_vision", elapsedMs: 0 };
  }

  const b64 = bytesToBase64(pdfBytes);
  const dataUri = `data:application/pdf;base64,${b64}`;

  const systemPrompt = [
    "Você é um leitor visual de declarações de IRPF da Receita Federal do Brasil.",
    "Sua tarefa: ENCONTRAR no documento o bloco 'RESUMO DA DECLARAÇÃO' (ou equivalente) e ler o RESULTADO FINAL.",
    "",
    "REGRAS DURAS:",
    "1. Leia EXCLUSIVAMENTE o bloco RESUMO. NUNCA confunda com 'Total de Rendimentos', 'Base de Cálculo', 'Imposto Devido' ou 'Imposto Pago' — esses NÃO são o resultado final.",
    "2. Se 'IMPOSTO A RESTITUIR' tem valor > 0 → tipo_resultado='restituicao', valor_resultado=esse número.",
    "3. Se 'SALDO DE IMPOSTO A PAGAR' (ou 'IMPOSTO A PAGAR') tem valor > 0 → tipo_resultado='pagamento', valor_resultado=esse número.",
    "4. Se ambos forem zero → tipo_resultado='nenhum', valor_resultado=0.",
    "5. SEMPRE preencha 'linha_citada' copiando LITERALMENTE a linha do PDF que tem o label e o valor (ex.: 'Imposto a Restituir ........ 1.836,56'). Sem aspas, sem reformatação.",
    "6. Se não conseguir ler com 100% de certeza, NÃO chame a função.",
  ].join("\n");

  const userPrompt = [
    `Ano-base esperado: ${anoBase}.`,
    `CPF esperado do titular: ${digits(cpfCliente) || "(desconhecido)"}.`,
    "Tarefa: extrair o resultado final do RESUMO da declaração anexa.",
  ].join("\n");

  let resp: Response;
  try {
    resp = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUri } },
            ],
          },
        ],
        tools: [{ type: "function", function: TOOL }],
        tool_choice: { type: "function", function: { name: TOOL.name } },
      }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: `vision_excecao: ${(e as Error).message}`,
      elapsedMs: Date.now() - t0,
    };
  }

  const elapsedMs = Date.now() - t0;

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 429) return { ok: false, reason: "rate_limit_vision", elapsedMs };
    if (resp.status === 402) return { ok: false, reason: "creditos_vision_esgotados", elapsedMs };
    return {
      ok: false,
      reason: `vision_gateway_${resp.status}: ${body.slice(0, 200)}`,
      elapsedMs,
    };
  }

  let json: any;
  try {
    json = await resp.json();
  } catch {
    return { ok: false, reason: "vision_resposta_invalida", elapsedMs };
  }

  const choice = json?.choices?.[0];
  if (choice?.finish_reason === "length") {
    return { ok: false, reason: "vision_resposta_truncada", elapsedMs };
  }
  const call = choice?.message?.tool_calls?.[0];
  const argsRaw = call?.function?.arguments;
  if (!argsRaw) {
    return { ok: false, reason: "vision_nao_chamou_funcao", elapsedMs };
  }
  let args: Record<string, unknown>;
  try {
    args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
  } catch {
    return { ok: false, reason: "vision_args_invalidos", elapsedMs };
  }

  // ===== Validações cruzadas =====

  // CPF
  if (typeof args.cpf === "string") {
    args.cpf = digits(args.cpf as string);
    if ((args.cpf as string).length !== 11) {
      return { ok: false, reason: "vision_cpf_invalido", elapsedMs };
    }
    const cpfCli = digits(cpfCliente);
    if (cpfCli && args.cpf !== cpfCli) {
      return {
        ok: false,
        reason: `vision_cpf_divergente (${args.cpf} ≠ ${cpfCli})`,
        elapsedMs,
      };
    }
  }

  // Ano
  if (typeof args.ano_exercicio === "number" && args.ano_exercicio !== anoBase) {
    return {
      ok: false,
      reason: `vision_ano_divergente (${args.ano_exercicio} ≠ ${anoBase})`,
      elapsedMs,
    };
  }

  const tipoResultado = String(args.tipo_resultado || "");
  const valor = typeof args.valor_resultado === "number" ? args.valor_resultado : 0;
  const linhaCitada = String(args.linha_citada || "");

  // Coerência tipo x valor
  if (tipoResultado === "nenhum" && valor !== 0) {
    return { ok: false, reason: "vision_nenhum_com_valor", elapsedMs };
  }
  if ((tipoResultado === "restituicao" || tipoResultado === "pagamento") && valor <= 0) {
    return { ok: false, reason: "vision_tipo_com_valor_zero", elapsedMs };
  }

  // Anti-alucinação 1: linha_citada precisa aparecer no OCR (se temos OCR)
  if (ocrText && linhaCitada.length >= 10) {
    const ocrNorm = normalizeForMatch(ocrText);
    const linhaNorm = normalizeForMatch(linhaCitada);
    // Pega um trecho de 25 caracteres significativos da linha (sem espaços/pontos)
    const trecho = linhaNorm.replace(/[^a-z0-9,]/g, "").slice(0, 25);
    if (trecho.length >= 10) {
      const ocrCompact = ocrNorm.replace(/[^a-z0-9,]/g, "");
      if (!ocrCompact.includes(trecho)) {
        return {
          ok: false,
          reason: `vision_linha_nao_encontrada_no_ocr (trecho="${trecho}")`,
          elapsedMs,
        };
      }
    }
  }

  // Anti-alucinação 2: label correto para o tipo
  if (tipoResultado === "restituicao") {
    if (!/restitu/i.test(linhaCitada)) {
      return {
        ok: false,
        reason: "vision_linha_sem_label_restituir",
        elapsedMs,
      };
    }
  } else if (tipoResultado === "pagamento") {
    if (!/pagar|pagamento/i.test(linhaCitada)) {
      return { ok: false, reason: "vision_linha_sem_label_pagar", elapsedMs };
    }
  }

  // Anti-alucinação 3: valor existe no OCR
  if (valor > 0 && ocrText && !valueExistsInSource(valor, ocrText)) {
    return {
      ok: false,
      reason: `vision_valor_nao_encontrado_no_ocr (${valor})`,
      elapsedMs,
    };
  }

  // Anti-alucinação 4: valor não pode coincidir com totais "proibidos" no OCR
  if (valor > 0 && ocrText) {
    const labelsProibidos = [
      /rendimentos\s+tribut[aá]veis[\s\S]{0,400}?\btotal\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /total\s+de\s+rendimentos[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /base\s+de\s+c[aá]lculo[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /imposto\s+devido\b[^\d\n\r]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    ];
    const proibidos = new Set<number>();
    for (const re of labelsProibidos) {
      const m = ocrText.match(re);
      if (m) {
        const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
        if (Number.isFinite(n) && n > 0) proibidos.add(Math.round(n * 100));
      }
    }
    if (proibidos.has(Math.round(valor * 100))) {
      return {
        ok: false,
        reason: `vision_valor_coincide_com_total_proibido (${valor})`,
        elapsedMs,
      };
    }
  }

  const cpfFinal = (args.cpf as string) || digits(cpfCliente);

  console.log(
    `[vision] ok ano=${args.ano_exercicio} tipo=${tipoResultado} valor=${valor} pagina=${args.pagina_origem ?? "?"} linha="${linhaCitada.slice(0, 120)}"`,
  );

  return {
    ok: true,
    data: {
      eh_declaracao_irpf: true,
      subtipo: "dirpf",
      cpf: cpfFinal,
      nome: args.nome || "",
      ano_exercicio: args.ano_exercicio,
      tipo_resultado: tipoResultado,
      valor_resultado: valor,
      motivo_rejeicao: null,
      _confianca: 0.92,
      _metodo: "vision_pdf",
      _linha_citada: linhaCitada,
    },
    elapsedMs,
  };
}
