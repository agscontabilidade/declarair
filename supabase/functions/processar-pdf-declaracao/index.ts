// Edge function: valida PDF anexado (Declaração ou Recibo) com IA,
// atualiza o status da declaração e dispara notificações ao cliente.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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
}

function digits(s: string | null | undefined) {
  return (s || "").replace(/\D/g, "");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

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
    const { declaracao_id, tipo, storage_path, arquivo_nome } = body;
    if (!declaracao_id || !tipo || !storage_path) {
      return json({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (tipo !== "declaracao" && tipo !== "recibo") {
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

    // Prompt
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

    const promptDeclaracao = {
      eh_declaracao_irpf: "boolean — true somente se for de fato uma Declaração de Ajuste Anual do IRPF (DIRPF) emitida pelo programa da Receita Federal",
      cpf: "string — CPF do declarante apenas dígitos (11)",
      nome: "string — nome completo do declarante",
      ano_exercicio: "number — ano-exercício (ex.: 2026)",
      tipo_resultado: "'restituicao'|'pagamento'|'nenhum'",
      valor_resultado: "number — valor em reais (sem sinal); 0 se nenhum",
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
    const schema = tipo === "declaracao" ? promptDeclaracao : promptRecibo;

    const systemPrompt = `Você é um validador rigoroso de documentos fiscais brasileiros (IRPF).
Você receberá um PDF anexado. Analise visual e textualmente.
Responda SOMENTE um JSON válido, sem texto adicional, sem markdown.
Esquema esperado: ${JSON.stringify(schema)}.
Seja conservador: se houver QUALQUER dúvida sobre autenticidade ou tipo do documento, marque como false e explique em motivo_rejeicao.`;

    const userPrompt =
      tipo === "declaracao"
        ? "Identifique se este PDF é a Declaração do IRPF (DIRPF) e extraia os dados do declarante e o resultado."
        : "Identifique se este PDF é o Recibo de Entrega da DIRPF emitido pela Receita Federal e extraia o número do recibo, CPF, ano-exercício e data de transmissão.";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return fail("Limite de IA atingido. Tente novamente em alguns minutos.");
      if (aiRes.status === 402) return fail("Créditos de IA esgotados. Contate o suporte.");
      return fail("Falha ao analisar o PDF com IA");
    }
    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let extracao: Partial<ExtracaoDeclaracao & ExtracaoRecibo>;
    try {
      extracao = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      extracao = m ? JSON.parse(m[0]) : {};
    }

    // Validação cruzada
    const cpfArquivo = digits(extracao?.cpf);
    const cpfCliente = digits(cliente.cpf);
    const anoArquivo = Number(extracao?.ano_exercicio);
    const anoBase = Number(dec.ano_base);

    if (tipo === "declaracao") {
      if (!extracao?.eh_declaracao_irpf) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como Declaração do IRPF");
      }
    } else {
      if (!extracao?.eh_recibo_rfb) {
        return fail(extracao?.motivo_rejeicao || "PDF não reconhecido como Recibo da Receita Federal");
      }
      if (!extracao?.numero_recibo) {
        return fail("Número do recibo não pôde ser extraído do PDF");
      }
    }
    if (cpfArquivo && cpfCliente && cpfArquivo !== cpfCliente) {
      return fail(`CPF do PDF (${cpfArquivo}) não confere com o do cliente (${cpfCliente})`);
    }
    if (anoArquivo && anoBase && anoArquivo !== anoBase) {
      return fail(`Ano do PDF (${anoArquivo}) não confere com a declaração (${anoBase})`);
    }

    // Atualiza declaração
    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {};
    let virouTransmitida = false;

    if (tipo === "declaracao") {
      updates.arquivo_declaracao_url = storage_path;
      updates.arquivo_declaracao_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_declaracao_uploaded_at = nowIso;
      updates.declaracao_validada_em = nowIso;
      updates.declaracao_extracao = extracao;
      // Promove status para "declaracao_pronta" se ainda estava antes
      if (["aguardando_documentos", "documentacao_recebida"].includes(dec.status as string)) {
        updates.status = "declaracao_pronta";
      }
      // Resultado se ainda não foi preenchido pelo cálculo
      if (extracao?.tipo_resultado && ["restituicao", "pagamento", "nenhum"].includes(extracao.tipo_resultado)) {
        updates.tipo_resultado = extracao.tipo_resultado;
      }
      if (typeof extracao?.valor_resultado === "number") {
        updates.valor_resultado = extracao.valor_resultado;
      }
    } else {
      updates.arquivo_recibo_url = storage_path;
      updates.arquivo_recibo_nome = arquivo_nome || storage_path.split("/").pop();
      updates.arquivo_recibo_uploaded_at = nowIso;
      updates.recibo_validado_em = nowIso;
      updates.recibo_extracao = extracao;
      updates.numero_recibo = String(extracao.numero_recibo);
      if (extracao?.data_transmissao) {
        updates.data_transmissao = new Date(extracao.data_transmissao).toISOString();
      }
      // Marcar transmitida (idempotente)
      if (dec.status !== "transmitida") {
        updates.status = "transmitida";
        virouTransmitida = true;
      } else if (!dec.recibo_validado_em) {
        // Já estava transmitida manualmente, mas é a primeira vez que validamos recibo
        virouTransmitida = true;
      }
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
    // (para aparecer no Drive e no modal "Ver documentos")
    try {
      const nomeDocumento = tipo === "declaracao"
        ? "Declaração IRPF (PDF)"
        : "Recibo da Receita (PDF)";
      const arquivoNomeFinal = (arquivo_nome || storage_path.split("/").pop()) ?? null;

      // Tenta atualizar entrada existente
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
      // Não bloqueia o fluxo principal
      console.error("Falha ao espelhar arquivo do contador no checklist", e);
    }

    // Auditoria
    await admin.from("declaracao_atividades").insert({
      declaracao_id,
      tipo: tipo === "recibo" ? "recibo_validado" : "declaracao_validada",
      descricao:
        tipo === "recibo"
          ? `Recibo da Receita Federal validado por IA (nº ${extracao.numero_recibo}).`
          : `Declaração validada por IA.`,
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
      novo_status: updates.status ?? dec.status,
    });
  } catch (e) {
    console.error("Erro inesperado", e);
    return json({ error: (e as Error).message || "Erro interno" }, 500);
  }
});
