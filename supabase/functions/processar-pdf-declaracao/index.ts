// Edge function: valida PDF anexado (Declaração / Recibo / MEI / DARF),
// extrai dados via Lovable AI, atualiza o status da declaração e dispara notificações.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runAiExtraction } from "./ai-fallback.ts";

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

const CODIGOS_DARF_IRPF_PF = ["0211", "4600", "6015"];




Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

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

    // Path traversal guard: storage_path deve estar dentro do namespace do escritório
    if (!storage_path.startsWith(`${usuario.escritorio_id}/`)) {
      return json({ error: "Acesso negado ao arquivo" }, 403);
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
    const bytes = new Uint8Array(arrayBuf);

    // Tipos das extrações (mantidos para tipagem do `extracao` consolidado)
    interface ExtracaoDeclaracao {
      eh_declaracao_irpf: boolean;
      cpf: string;
      nome: string;
      ano_exercicio: number;
      motivo_rejeicao: string | null;
    }
    interface ExtracaoRecibo {
      eh_recibo_rfb: boolean;
      numero_recibo: string;
      cpf: string;
      ano_exercicio: number;
      data_transmissao: string;
      tipo_resultado: 'restituicao' | 'pagamento' | 'nenhum';
      valor_resultado: number;
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

    // ========== Pipeline: Lovable AI > manual ==========
    let extracao: Partial<ExtracaoDeclaracao & ExtracaoRecibo & ExtracaoMei & ExtracaoDarf> = {};
    let metodoValidacao: "ia" | "manual" = "ia";


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

    // 1) Confirmação manual enviada pelo contador — pula o pipeline
    if (manual_confirmacao) {
      metodoValidacao = "manual";
      const mc = manual_confirmacao;
      // Validações básicas por tipo
      if (tipo === "declaracao") {
        extracao = {
          eh_declaracao_irpf: true,
          cpf: cpfClienteDigits,
          nome: cliente.nome,
          ano_exercicio: anoBaseNum,
          motivo_rejeicao: null,
        };
      } else if (tipo === "recibo") {
        if (!mc.numero_recibo || !mc.data_transmissao) {
          return fail("Confirmação manual: número do recibo e data de transmissão são obrigatórios");
        }
        if (!mc.tipo_resultado || !["restituicao", "pagamento", "nenhum"].includes(mc.tipo_resultado)) {
          return fail("Confirmação manual: informe o tipo de resultado");
        }
        if (mc.tipo_resultado !== "nenhum" && (typeof mc.valor_resultado !== "number" || mc.valor_resultado < 0)) {
          return fail("Confirmação manual: informe o valor (R$)");
        }
        extracao = {
          eh_recibo_rfb: true,
          numero_recibo: String(mc.numero_recibo).trim(),
          cpf: cpfClienteDigits,
          ano_exercicio: anoBaseNum,
          data_transmissao: mc.data_transmissao,
          tipo_resultado: mc.tipo_resultado,
          valor_resultado: mc.tipo_resultado === "nenhum" ? 0 : Number(mc.valor_resultado || 0),
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
      console.log(`[manual] ${tipo} validado MANUALMENTE pelo contador`);
    } else {
      console.log(`[ia] ${tipo} enviando PDF (${bytes.byteLength} bytes) para Lovable AI (multimodal)`);
      const aiRes = await runAiExtraction(bytes, tipo, anoBaseNum, cliente.cpf || "");
      console.log(`[ia] ${tipo} ok=${aiRes.ok} tempo_ms=${aiRes.elapsedMs}${aiRes.ok ? "" : ` reason=${aiRes.reason}`}`);

      if (aiRes.ok) {
        extracao = aiRes.data as typeof extracao;
        metodoValidacao = "ia";
      } else {
        return manualReview(
          `IA não conseguiu validar automaticamente (${aiRes.reason}). Confirme os dados manualmente para registrar.`
        );
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
      // NÃO altera status aqui. A promoção para "declaracao_pronta" é feita em
      // UPDATE condicional separado (abaixo) para evitar race condition em uploads
      // paralelos de declaração + recibo (READ COMMITTED não vê commit concorrente).
      // Resultado (restituição/pagamento) é extraído do RECIBO, não daqui.
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
      if (extracao?.tipo_resultado && ["restituicao", "pagamento", "nenhum"].includes(extracao.tipo_resultado)) {
        updates.tipo_resultado = extracao.tipo_resultado;
      }
      if (typeof extracao?.valor_resultado === "number") {
        updates.valor_resultado = extracao.valor_resultado;
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
    console.log(
      `[final] tipo=${tipo} metodo=${metodoValidacao} ano=${(extracao as { ano_exercicio?: number; ano_calendario?: number }).ano_exercicio ?? (extracao as { ano_calendario?: number }).ano_calendario ?? "?"} resultado=${(extracao as { tipo_resultado?: string }).tipo_resultado ?? "-"} valor=${(extracao as { valor_resultado?: number }).valor_resultado ?? "-"} novo_status=${updates.status ?? dec.status}`,
    );

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
    const sufixoMetodo = metodoValidacao === "ia"
      ? "automaticamente via IA"
      : "manualmente pelo contador";
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

      // Notificações ao cliente (e-mail/WhatsApp) NÃO são disparadas aqui.
      // O envio ao cliente só ocorre quando o contador clica no botão de envio manual (aviãozinho).
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
