// Edge function: valida PDF anexado (Declaração ou Recibo) com IA,
// atualiza o status da declaração e dispara notificações ao cliente.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tryNativeValidation } from "./extract-native.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ok = (extras: Record<string, unknown> = {}) =>
  json({ ok: true, ...extras });
const fail = (motivo: string, extras: Record<string, unknown> = {}) =>
  json({ ok: false, motivo, ...extras });

interface Body {
  declaracao_id?: string;
  tipo?: "declaracao" | "recibo" | "mei" | "darf";
  storage_path?: string;
  arquivo_nome?: string;
  manual_confirmacao?: ManualConfirmacao;
}

interface ManualConfirmacao {
  // Comum
  cpf?: string;
  ano?: number;
  // Declaração
  tipo_resultado?: "restituicao" | "pagamento" | "nenhum";
  valor_resultado?: number;
  subtipo?: "dirpf" | "saida_definitiva" | "comunicacao_saida";
  // Recibo
  numero_recibo?: string;
  data_transmissao?: string; // YYYY-MM-DD
  // MEI
  cnpj?: string;
  // DARF
  codigo_receita?: string;
  valor_principal?: number;
  valor_total?: number;
}


function digits(s: string | null | undefined) {
  return (s || "").replace(/\D/g, "");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const CODIGOS_DARF_IRPF_PF = ["0211", "4600", "6015"];




Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    // LOVABLE_API_KEY pode estar ausente — o fluxo cai para revisão manual sem quebrar.

    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data: userData, error: userErr } = await anon.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) return json({ error: "Token inválido" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: usuario } = await admin
      .from("usuarios")
      .select("escritorio_id, nome")
      .eq("id", userData.user.id)
      .single();
    if (!usuario?.escritorio_id) return json({ error: "Usuário sem escritório" }, 403);

    const body = (await req.json()) as Body;
    const { declaracao_id, tipo, storage_path, arquivo_nome, manual_confirmacao } = body;

    if (!declaracao_id || !tipo || !storage_path) {
      return json({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (!["declaracao", "recibo", "mei", "darf"].includes(tipo)) {
      return json({ error: "tipo inválido" }, 400);
    }

    // Confirma propriedade
    const { data: dec, error: decErr } = await admin
      .from("declaracoes")
      .select(
        "id, escritorio_id, cliente_id, ano_base, status, recibo_validado_em, clientes:cliente_id(id, nome, cpf, email, telefone)",
      )
      .eq("id", declaracao_id)
      .eq("escritorio_id", usuario.escritorio_id)
      .single();
    if (decErr || !dec) return json({ error: "Declaração não encontrada" }, 404);

    const cliente = dec.clientes as unknown as { id: string; nome: string; cpf: string; email: string; telefone: string };
    if (!cliente) return fail("Cliente da declaração não encontrado");

    // Baixa o PDF do Storage
    const { data: file, error: dlErr } = await admin.storage
      .from("documentos-clientes")
      .download(storage_path);
    if (dlErr || !file) {
      console.error("Erro download:", dlErr);
      return fail("Não foi possível ler o arquivo enviado");
    }

    const arrayBuf = await file.arrayBuffer();
    if (arrayBuf.byteLength > 18 * 1024 * 1024) {
      return fail("Arquivo muito grande (máx. 18MB)");
    }
    // base64 (chunked p/ evitar stack overflow)
    const bytes = new Uint8Array(arrayBuf);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const base64 = btoa(bin);

    // Prompts e schemas por tipo
    interface ExtracaoDeclaracao {
      eh_declaracao_irpf: boolean;
      cpf: string;
      nome: string;
      ano_exercicio: number;
      tipo_resultado: 'restituicao' | 'pagamento' | 'nenhum';
      valor_resultado: number;
      motivo_rejeicao: string | null;
    }
    interface ExtracaoRecibo {
      eh_recibo_rfb: boolean;
      numero_recibo: string;
      cpf: string;
      ano_exercicio: number;
      data_transmissao: string;
      motivo_rejeicao: string | null;
    }
    interface ExtracaoMei {
      eh_dasn_simei: boolean;
      cnpj: string;
      cpf: string;
      ano_calendario: number;
      numero_recibo: string | null;
      data_transmissao: string | null;
      motivo_rejeicao: string | null;
    }
    interface ExtracaoDarf {
      eh_darf_irpf: boolean;
      cpf: string;
      codigo_receita: string;
      periodo_apuracao: string | null;
      data_vencimento: string | null;
      valor_principal: number;
      valor_total: number;
      motivo_rejeicao: string | null;
    }

    const promptDeclaracao = {
      eh_declaracao_irpf: "boolean — true se for: (a) Declaração de Ajuste Anual do IRPF (DIRPF), (b) Declaração de Saída Definitiva do País (DSDP), ou (c) Comunicação de Saída Definitiva do País — todas emitidas pelo programa/sistema da Receita Federal. Marque false para recibo, DARF, extratos bancários, informes de rendimento ou qualquer outro documento.",
      subtipo: "'dirpf'|'saida_definitiva'|'comunicacao_saida'|null — qual variante foi reconhecida; null se eh_declaracao_irpf=false",
      cpf: "string — CPF do declarante apenas dígitos (11)",
      nome: "string — nome completo do declarante",
      ano_exercicio: "number — ano-exercício (ex.: 2026)",
      tipo_resultado: "'restituicao'|'pagamento'|'nenhum' — Para DIRPF: leia a folha 'Resumo da Declaração'/'Cálculo do Imposto'. Use 'pagamento' se houver 'Saldo de Imposto a Pagar' > 0 (ou equivalentes). Use 'restituicao' se houver 'Imposto a Restituir' > 0. Use 'nenhum' SOMENTE se ambos forem zero. Para DSDP/Comunicação de Saída: se o documento não trouxer apuração de imposto a pagar/restituir, retorne 'nenhum' com valor_resultado=0; só use 'pagamento'/'restituicao' se os valores estiverem explícitos no próprio documento.",
      valor_resultado: "number — valor em reais (sem sinal, ex.: 1234.56) correspondente ao tipo_resultado escolhido; 0 se nenhum",
      motivo_rejeicao: "string|null — preencha se eh_declaracao_irpf=false explicando o motivo",
    };
    const promptRecibo = {
      eh_recibo_rfb: "boolean — true somente se for o Recibo de Entrega da DIRPF emitido pela Receita Federal",
      numero_recibo: "string — número do recibo conforme aparece no documento",
      cpf: "string — CPF do declarante (11 dígitos)",
      ano_exercicio: "number",
      data_transmissao: "string ISO (YYYY-MM-DD) — data de transmissão",
      motivo_rejeicao: "string|null",
    };
    const promptMei = {
      eh_dasn_simei: "boolean — true somente se for a Declaração Anual do Simples Nacional para o MEI (DASN-SIMEI) ou seu recibo de entrega emitido pela Receita Federal",
      cnpj: "string — CNPJ do MEI (14 dígitos)",
      cpf: "string — CPF do titular (11 dígitos)",
      ano_calendario: "number — ano-calendário declarado (ex.: 2025)",
      numero_recibo: "string|null — número do recibo se houver",
      data_transmissao: "string|null ISO (YYYY-MM-DD)",
      motivo_rejeicao: "string|null",
    };
    const promptDarf = {
      eh_darf_irpf: "boolean — true SOMENTE se for um DARF de IRPF Pessoa Física. Códigos típicos: 0211 (IRPF Ajuste Anual), 4600 (Carnê-Leão), 6015 (ganhos de capital). Marque false para qualquer outro tributo.",
      cpf: "string — CPF do contribuinte (11 dígitos)",
      codigo_receita: "string — código da receita (4 dígitos)",
      periodo_apuracao: "string|null — DD/MM/AAAA ou MM/AAAA",
      data_vencimento: "string|null ISO (YYYY-MM-DD)",
      valor_principal: "number — valor principal em reais",
      valor_total: "number — valor total em reais (principal + multa + juros)",
      motivo_rejeicao: "string|null",
    };
    const schemaPorTipo: Record<typeof tipo, unknown> = {
      declaracao: promptDeclaracao,
      recibo: promptRecibo,
      mei: promptMei,
      darf: promptDarf,
    } as const;
    const schema = schemaPorTipo[tipo];

    const systemPrompt = `Você é um validador rigoroso de documentos fiscais brasileiros.
Você receberá um PDF anexado. Analise visual e textualmente, página por página.
Responda SOMENTE um JSON válido (sem markdown, sem texto fora do JSON).
Esquema esperado: ${JSON.stringify(schema)}.
Seja conservador quanto à autenticidade/tipo do documento, mas seja PRECISO ao extrair valores numéricos: leia a folha de resumo/cálculo e converta vírgula decimal brasileira corretamente.`;

    const userPromptMap: Record<typeof tipo, string> = {
      declaracao: "Identifique se este PDF é uma declaração do IRPF aceita: (a) DIRPF (Declaração de Ajuste Anual), (b) Declaração de Saída Definitiva do País (DSDP), ou (c) Comunicação de Saída Definitiva do País — todas emitidas pelo programa/sistema da Receita Federal. Extraia CPF, nome, ano-exercício e o RESULTADO. Para DIRPF, vá até a folha 'Resumo da Declaração' (ou equivalente) e verifique 'Saldo de Imposto a Pagar' e 'Imposto a Restituir' — retorne 'pagamento'/'restituicao' com o valor exato, ou 'nenhum' se ambos forem zero. Para DSDP/Comunicação de Saída, se não houver folha de apuração com imposto a pagar/restituir, retorne 'nenhum' e valor_resultado=0. Preencha também o campo 'subtipo' com 'dirpf', 'saida_definitiva' ou 'comunicacao_saida'.",
      recibo: "Identifique se este PDF é o Recibo de Entrega da DIRPF emitido pela Receita Federal e extraia o número do recibo, CPF, ano-exercício e data de transmissão.",
      mei: "Identifique se este PDF é a DASN-SIMEI (Declaração Anual do MEI) ou seu recibo, e extraia CNPJ, CPF do titular, ano-calendário, número do recibo e data de transmissão.",
      darf: "Identifique se este PDF é um DARF de IRPF Pessoa Física. Extraia código de receita, CPF, período de apuração, data de vencimento, valor principal e valor total.",
    };
    const userPrompt = userPromptMap[tipo];

    // ========== HÍBRIDO: regex nativa primeiro; IA só se útil; manual como último recurso ==========
    let extracao: Partial<ExtracaoDeclaracao & ExtracaoRecibo & ExtracaoMei & ExtracaoDarf> = {};
    let metodoValidacao: "regex" | "ia" | "manual" = "ia";

    const cpfClienteDigits = digits(cliente.cpf);
    const anoBaseNum = Number(dec.ano_base);

    // Helper: construir resposta padronizada para revisão manual (não apaga o arquivo)
    const manualReview = (motivo: string) =>
      json({
        ok: false,
        requires_manual_review: true,
        motivo,
        storage_path,
        arquivo_nome: arquivo_nome || storage_path.split("/").pop(),
        tipo,
      });

    // 1) Confirmação manual enviada pelo contador — pula regex/IA
    if (manual_confirmacao) {
      metodoValidacao = "manual";
      const mc = manual_confirmacao;
      // Validações básicas por tipo
      if (tipo === "declaracao") {
        if (!mc.tipo_resultado || !["restituicao", "pagamento", "nenhum"].includes(mc.tipo_resultado)) {
          return fail("Confirmação manual: informe o tipo de resultado");
        }
        if (mc.tipo_resultado !== "nenhum" && (typeof mc.valor_resultado !== "number" || mc.valor_resultado < 0)) {
          return fail("Confirmação manual: informe o valor (R$)");
        }
        extracao = {
          eh_declaracao_irpf: true,
          cpf: cpfClienteDigits,
          nome: cliente.nome,
          ano_exercicio: anoBaseNum,
          tipo_resultado: mc.tipo_resultado,
          valor_resultado: mc.tipo_resultado === "nenhum" ? 0 : Number(mc.valor_resultado || 0),
          motivo_rejeicao: null,
        };
      } else if (tipo === "recibo") {
        if (!mc.numero_recibo || !mc.data_transmissao) {
          return fail("Confirmação manual: número do recibo e data de transmissão são obrigatórios");
        }
        extracao = {
          eh_recibo_rfb: true,
          numero_recibo: String(mc.numero_recibo).trim(),
          cpf: cpfClienteDigits,
          ano_exercicio: anoBaseNum,
          data_transmissao: mc.data_transmissao,
          motivo_rejeicao: null,
        };
      } else if (tipo === "mei") {
        if (!mc.cnpj) return fail("Confirmação manual: CNPJ do MEI é obrigatório");
        extracao = {
          eh_dasn_simei: true,
          cnpj: digits(mc.cnpj),
          cpf: cpfClienteDigits,
          ano_calendario: Number(mc.ano || anoBaseNum - 1),
          numero_recibo: mc.numero_recibo || null,
          data_transmissao: mc.data_transmissao || null,
          motivo_rejeicao: null,
        };
      } else if (tipo === "darf") {
        const cod = String(mc.codigo_receita || "").padStart(4, "0");
        if (!CODIGOS_DARF_IRPF_PF.includes(cod)) {
          return fail(`Confirmação manual: código de receita deve ser um destes: ${CODIGOS_DARF_IRPF_PF.join(", ")}`);
        }
        if (typeof mc.valor_principal !== "number" || typeof mc.valor_total !== "number") {
          return fail("Confirmação manual: informe valor principal e valor total");
        }
        extracao = {
          eh_darf_irpf: true,
          cpf: cpfClienteDigits,
          codigo_receita: cod,
          periodo_apuracao: null,
          data_vencimento: mc.data_transmissao || null,
          valor_principal: mc.valor_principal,
          valor_total: mc.valor_total,
          motivo_rejeicao: null,
        };
      }
      console.log(`[hibrido] ${tipo} validado MANUALMENTE pelo contador`);
    } else {
      // 2) Tenta regex nativa
      let nativeReason = "";
      let isScan = false;
      try {
        const native = await tryNativeValidation(bytes, tipo, anoBaseNum, cliente.cpf || "");
        if (native.ok) {
          extracao = native.data as typeof extracao;
          metodoValidacao = "regex";
          console.log(`[hibrido] ${tipo} validado por REGEX (sem IA)`);
        } else {
          nativeReason = native.reason;
          isScan = native.reason === "scan_sem_texto";
          console.log(`[hibrido] regex falhou para ${tipo}: ${native.reason}`);
        }
      } catch (e) {
        console.error("[hibrido] erro inesperado na extração nativa:", e);
        nativeReason = "erro_extracao_nativa";
      }

      // 3) Fallback IA — só se regex falhou por ambiguidade (não scan) E houver chave
      if (metodoValidacao === "ia") {
        if (isScan || !LOVABLE_API_KEY) {
          // PDF escaneado ou IA indisponível → revisão manual, sem erro
          return manualReview(
            isScan
              ? "PDF parece escaneado/imagem (sem texto pesquisável). Confirme os dados manualmente para registrar."
              : "Validação automática indisponível. Confirme os dados manualmente para registrar."
          );
        }

        const model = tipo === "declaracao" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
        let aiRes: Response;
        try {
          aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
                  ],
                },
              ],
            }),
          });
        } catch (e) {
          console.error("AI fetch falhou:", e);
          return manualReview("Validação automática indisponível agora. Confirme os dados manualmente.");
        }

        if (!aiRes.ok) {
          const t = await aiRes.text().catch(() => "");
          console.error("AI error", aiRes.status, t);
          // 402 (sem créditos), 429 (rate limit) ou qualquer outro erro → revisão manual,
          // NUNCA expor "créditos esgotados" ao contador.
          return manualReview(
            "Validação automática indisponível no momento. Confirme os dados manualmente para registrar o documento."
          );
        }
        const aiJson = await aiRes.json();
        const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
        try {
          extracao = JSON.parse(content);
        } catch {
          const m = content.match(/\{[\s\S]*\}/);
          extracao = m ? JSON.parse(m[0]) : {};
        }
      }
    }


    // Validação cruzada
    const cpfArquivo = digits(extracao?.cpf);
    const cpfCliente = digits(cliente.cpf);
    const anoArquivo = Number(
      (extracao as Partial<ExtracaoDeclaracao & ExtracaoRecibo>)?.ano_exercicio ??
      (extracao as Partial<ExtracaoMei>)?.ano_calendario,
    );
    const anoBase = Number(dec.ano_base);



    if (tipo === "declaracao") {
      if (!extracao?.eh_declaracao_irpf) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como Declaração do IRPF");
      }
    } else if (tipo === "recibo") {
      if (!extracao?.eh_recibo_rfb) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como Recibo da Receita Federal");
      }
      if (!extracao?.numero_recibo) {
        return fail("Número do recibo não pôde ser extraído do PDF");
      }
    } else if (tipo === "mei") {
      if (!extracao?.eh_dasn_simei) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como DASN-SIMEI (Declaração Anual do MEI)");
      }
    } else if (tipo === "darf") {
      if (!extracao?.eh_darf_irpf) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como DARF de IRPF Pessoa Física");
      }
      const cod = String(extracao?.codigo_receita || "").padStart(4, "0");
      if (!CODIGOS_DARF_IRPF_PF.includes(cod)) {
        return fail(`DARF com código ${cod} não pertence ao IRPF Pessoa Física (esperado: ${CODIGOS_DARF_IRPF_PF.join(", ")})`);
      }
    }
    if (cpfArquivo && cpfCliente && cpfArquivo !== cpfCliente) {
      return fail(`CPF do PDF (${cpfArquivo}) não confere com o do cliente (${cpfCliente})`);
    }
    // Validação de ano: declaração e recibo precisam bater com ano_base.
    // MEI: ano_calendario costuma ser ano_base - 1 (declara o ano anterior); aceitamos esse ou o próprio ano_base.
    // DARF: pode ter períodos variados — não validamos ano.
    if (tipo === "declaracao" || tipo === "recibo") {
      if (anoArquivo && anoBase && anoArquivo !== anoBase) {
        return fail(`Ano do PDF (${anoArquivo}) não confere com a declaração (${anoBase})`);
      }
    } else if (tipo === "mei") {
      if (anoArquivo && anoBase && anoArquivo !== anoBase && anoArquivo !== anoBase - 1) {
        return fail(`Ano-calendário do MEI (${anoArquivo}) incompatível com a declaração (${anoBase})`);
      }
    }

    // Atualiza declaração
    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {};
    let virouTransmitida = false;

    // Releitura do estado atual para evitar race condition (uploads paralelos de
    // declaração e recibo podem usar snapshots desatualizados e reverter o status).
    const { data: decFresh } = await admin
      .from("declaracoes")
      .select("status, recibo_validado_em, arquivo_recibo_url, numero_recibo, data_transmissao")
      .eq("id", declaracao_id)
      .single();
    const statusAtual = (decFresh?.status ?? dec.status) as string;
    const jaTransmitida =
      statusAtual === "transmitida" ||
      !!decFresh?.recibo_validado_em ||
      !!decFresh?.arquivo_recibo_url ||
      !!decFresh?.numero_recibo ||
      !!decFresh?.data_transmissao;

    if (tipo === "declaracao") {
      updates.arquivo_declaracao_url = storage_path;
      updates.arquivo_declaracao_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_declaracao_uploaded_at = nowIso;
      updates.declaracao_validada_em = nowIso;
      updates.declaracao_extracao = extracao;
      // Só promove para "declaracao_pronta" se NÃO houver qualquer sinal de transmissão.
      // Isso evita regressão de "transmitida" → "declaracao_pronta" em uploads paralelos.
      if (!jaTransmitida && ["aguardando_documentos", "documentacao_recebida"].includes(statusAtual)) {
        updates.status = "declaracao_pronta";
      }
      if (extracao?.tipo_resultado && ["restituicao", "pagamento", "nenhum"].includes(extracao.tipo_resultado)) {
        updates.tipo_resultado = extracao.tipo_resultado;
      }
      if (typeof extracao?.valor_resultado === "number") {
        updates.valor_resultado = extracao.valor_resultado;
      }
    } else if (tipo === "recibo") {
      updates.arquivo_recibo_url = storage_path;
      updates.arquivo_recibo_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_recibo_uploaded_at = nowIso;
      updates.recibo_validado_em = nowIso;
      updates.recibo_extracao = extracao;
      updates.numero_recibo = String(extracao.numero_recibo);
      if (extracao?.data_transmissao) {
        updates.data_transmissao = new Date(extracao.data_transmissao).toISOString();
      }
      if (statusAtual !== "transmitida") {
        updates.status = "transmitida";
        virouTransmitida = true;
      } else if (!decFresh?.recibo_validado_em) {
        virouTransmitida = true;
      }
    } else if (tipo === "mei") {
      updates.arquivo_mei_url = storage_path;
      updates.arquivo_mei_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_mei_uploaded_at = nowIso;
      updates.mei_validado_em = nowIso;
      updates.mei_extracao = extracao;
    } else if (tipo === "darf") {
      updates.arquivo_darf_url = storage_path;
      updates.arquivo_darf_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_darf_uploaded_at = nowIso;
      updates.darf_validado_em = nowIso;
      updates.darf_extracao = extracao;
    }

    const { error: upErr } = await admin
      .from("declaracoes")
      .update(updates)
      .eq("id", declaracao_id);
    if (upErr) {
      console.error("Update error", upErr);
      return fail("Erro ao atualizar declaração: " + upErr.message);
    }

    // Espelha o arquivo do contador no checklist_documentos
    try {
      const nomeDocumentoMap: Record<typeof tipo, string> = {
        declaracao: "Declaração IRPF (PDF)",
        recibo: "Recibo da Receita (PDF)",
        mei: "Declaração MEI (DASN-SIMEI)",
        darf: "DARF IRPF (PDF)",
      };
      const nomeDocumento = nomeDocumentoMap[tipo];
      const arquivoNomeFinal = (arquivo_nome || storage_path.split("/").pop()) ?? null;

      const { data: existente } = await admin
        .from("checklist_documentos")
        .select("id")
        .eq("declaracao_id", declaracao_id)
        .eq("categoria", "contador")
        .eq("nome_documento", nomeDocumento)
        .maybeSingle();

      if (existente?.id) {
        await admin
          .from("checklist_documentos")
          .update({
            arquivo_url: storage_path,
            arquivo_nome: arquivoNomeFinal,
            data_recebimento: nowIso,
            status: "recebido",
          })
          .eq("id", existente.id);
      } else {
        await admin.from("checklist_documentos").insert({
          declaracao_id,
          categoria: "contador",
          nome_documento: nomeDocumento,
          obrigatorio: false,
          status: "recebido",
          arquivo_url: storage_path,
          arquivo_nome: arquivoNomeFinal,
          data_recebimento: nowIso,
        });
      }
    } catch (e) {
      console.error("Falha ao espelhar arquivo do contador no checklist", e);
    }

    // Auditoria
    const sufixoMetodo = metodoValidacao === "regex" ? "automaticamente" : metodoValidacao === "manual" ? "manualmente pelo contador" : "por IA";
    const atividadeMap: Record<typeof tipo, { tipo: string; descricao: string }> = {
      declaracao: { tipo: "declaracao_validada", descricao: `Declaração validada ${sufixoMetodo}.` },
      recibo: { tipo: "recibo_validado", descricao: `Recibo da Receita Federal validado ${sufixoMetodo} (nº ${extracao?.numero_recibo ?? "?"}).` },
      mei: { tipo: "mei_validado", descricao: `Declaração MEI (DASN-SIMEI) validada ${sufixoMetodo}.` },
      darf: { tipo: "darf_validado", descricao: `DARF IRPF validado ${sufixoMetodo} (código ${extracao?.codigo_receita ?? "?"}, R$ ${extracao?.valor_total ?? 0}).` },
    };
    await admin.from("declaracao_atividades").insert({
      declaracao_id,
      tipo: atividadeMap[tipo].tipo,
      descricao: atividadeMap[tipo].descricao,
      usuario_nome: usuario.nome || null,
    });


    // Notificações ao virar transmitida
    if (virouTransmitida) {
      // Buscar dados do escritório
      const { data: esc } = await admin
        .from("escritorios")
        .select("nome, nome_fantasia")
        .eq("id", usuario.escritorio_id)
        .single();
      const nomeEscritorio = esc?.nome_fantasia || esc?.nome || "Seu contador";

      // Notificação in-app
      await admin.from("notificacoes").insert({
        escritorio_id: usuario.escritorio_id,
        titulo: "✅ Declaração transmitida",
        mensagem: `${cliente.nome} — recibo nº ${extracao.numero_recibo} validado.`,
        link_destino: `/declaracoes/${declaracao_id}`,
      });

      // Email ao cliente
      if (cliente.email) {
        try {
          const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_KEY}`,
              apikey: SERVICE_KEY,
            },
            body: JSON.stringify({
              templateName: "declaracao-transmitida",
              recipientEmail: cliente.email,
              templateData: {
                nomeCliente: cliente.nome,
                nomeEscritorio,
                anoBase: String(dec.ano_base),
                numeroRecibo: extracao.numero_recibo,
              },
            }),
          });
          if (!emailRes.ok) console.error("Email status", emailRes.status, await emailRes.text());
        } catch (e) {
          console.error("Email error", e);
        }
      }

      // WhatsApp (best-effort, ignora se não configurado)
      if (cliente.telefone) {
        try {
          const msg = `Olá ${cliente.nome}! 🎉 Sua declaração de IRPF ${dec.ano_base} foi transmitida com sucesso.\n\nRecibo nº ${extracao.numero_recibo}.\n\n— ${nomeEscritorio}`;
          await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-service`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_KEY}`,
              apikey: SERVICE_KEY,
            },
            body: JSON.stringify({
              action: "send-text",
              telefone: cliente.telefone,
              mensagem: msg,
              cliente_id: cliente.id,
              escritorio_id: usuario.escritorio_id,
            }),
          });
        } catch (e) {
          console.error("WhatsApp error", e);
        }
      }
    }

    return ok({
      tipo,
      virouTransmitida,
      extracao,
      metodo_validacao: metodoValidacao,
      novo_status: updates.status ?? dec.status,
    });
  } catch (e) {
    console.error("Erro inesperado", e);
    return json({ error: (e as Error).message || "Erro interno" }, 500);
  }
});
