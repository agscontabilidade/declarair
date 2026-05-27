// Envia lembretes de prazo de IR em massa para clientes com declaração em aguardando_documentos.
// - Email: enfileira na pgmq 'transactional_emails' (dispatcher process-email-queue drena com rate-limit).
// - WhatsApp: chama whatsapp-service action=send-message por cliente, com delay 400ms.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  canal: z.enum(["email", "whatsapp"]),
  prazoFinal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "prazoFinal deve ser YYYY-MM-DD"),
  mensagem: z.string().max(2000).optional().default(""),
  clienteIds: z.array(z.string().uuid()).min(1).max(1000),
});

const PORTAL_BASE_URL = "https://declarair.com.br";
const WHATSAPP_ADDON_ID = "6a5bab9f-a9d1-4ae4-9925-8fd8a25fbf3f";
const MAX_WHATSAPP_BATCH = 300;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatPrazoBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function renderMensagemWhatsApp(opts: {
  nome: string;
  prazoBR: string;
  escritorio: string;
  custom: string;
  anoBase: number;
}): string {
  const head = `Olá *${opts.nome}*,\n\nLembrete: ainda não recebemos seus documentos para a declaração de IR ${opts.anoBase}.\n\n📅 *Prazo final:* ${opts.prazoBR}`;
  const body = opts.custom?.trim() ? `\n\n${opts.custom.trim()}` : `\n\nEnvie seus documentos o quanto antes para evitar multas.`;
  const foot = `\n\n— ${opts.escritorio}`;
  return head + body + foot;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autorizado" }, 401);
  }
  const userToken = authHeader.slice(7);

  const admin = createClient(supabaseUrl, serviceKey);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser(userToken);
  if (userErr || !user) return jsonResponse({ error: "Sessão inválida" }, 401);

  const { data: usuario, error: usuarioErr } = await admin
    .from("usuarios")
    .select("id, escritorio_id, papel, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (usuarioErr || !usuario || !usuario.ativo) {
    return jsonResponse({ error: "Apenas usuários do escritório podem disparar lembretes" }, 403);
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten() }, 400);
    }
    body = parsed.data;
  } catch {
    return jsonResponse({ error: "JSON inválido" }, 400);
  }

  // WhatsApp: checa addon ativo
  if (body.canal === "whatsapp") {
    if (body.clienteIds.length > MAX_WHATSAPP_BATCH) {
      return jsonResponse({
        error: `Disparo WhatsApp limitado a ${MAX_WHATSAPP_BATCH} clientes por vez. Divida em lotes.`,
      }, 400);
    }
    const { data: addon } = await admin
      .from("escritorio_addons")
      .select("id, status")
      .eq("escritorio_id", usuario.escritorio_id)
      .eq("addon_id", WHATSAPP_ADDON_ID)
      .eq("status", "ativo")
      .maybeSingle();
    if (!addon) {
      return jsonResponse({ error: "addon_inativo", message: "Addon WhatsApp não está ativo no plano." }, 403);
    }
  }

  // Dados do escritório
  const { data: escritorio } = await admin
    .from("escritorios")
    .select("id, nome, nome_fantasia")
    .eq("id", usuario.escritorio_id)
    .single();
  const nomeEscritorio = escritorio?.nome_fantasia || escritorio?.nome || "Seu contador";

  // Busca clientes elegíveis: aguardando_documentos no ano corrente
  const anoCorrente = new Date().getFullYear();
  const { data: clientes, error: cliErr } = await admin
    .from("clientes")
    .select("id, nome, email, telefone, declaracoes!inner(id, ano_base, status)")
    .eq("escritorio_id", usuario.escritorio_id)
    .in("id", body.clienteIds)
    .eq("declaracoes.ano_base", anoCorrente)
    .eq("declaracoes.status", "aguardando_documentos");
  if (cliErr) {
    console.error("Erro ao buscar clientes:", cliErr);
    return jsonResponse({ error: "Erro ao buscar clientes" }, 500);
  }

  const prazoBR = formatPrazoBR(body.prazoFinal);
  const enfileirados: string[] = [];
  const pulados: Array<{ clienteId: string; motivo: string }> = [];

  // IDs solicitados mas não retornados = não elegíveis
  const elegiveis = new Set((clientes || []).map((c) => c.id));
  for (const id of body.clienteIds) {
    if (!elegiveis.has(id)) pulados.push({ clienteId: id, motivo: "nao_elegivel" });
  }

  for (const cli of clientes || []) {
    const decl = Array.isArray(cli.declaracoes) ? cli.declaracoes[0] : cli.declaracoes;
    const declaracaoId = decl?.id ?? null;

    if (body.canal === "email") {
      if (!cli.email) {
        pulados.push({ clienteId: cli.id, motivo: "sem_email" });
        continue;
      }
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateName: "lembrete-prazo-ir",
            recipientEmail: cli.email,
            idempotencyKey: `lembrete-${declaracaoId || cli.id}-${body.prazoFinal}`,
            templateData: {
              nomeCliente: cli.nome,
              nomeEscritorio,
              prazoFinal: prazoBR,
              anoBase: anoCorrente,
              linkPortal: `${PORTAL_BASE_URL}/cliente/dashboard`,
              mensagemPersonalizada: body.mensagem || "",
            },
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`send-transactional-email ${res.status}: ${txt.slice(0, 200)}`);
        }
        await res.json().catch(() => ({}));
        enfileirados.push(cli.id);
        await admin.from("lembretes_enviados").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cli.id,
          declaracao_id: declaracaoId,
          canal: "email",
          prazo_final: body.prazoFinal,
          mensagem: body.mensagem || null,
          enviado_por: user.id,
          status: "enfileirado",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("enqueue_email falhou", cli.id, msg);
        pulados.push({ clienteId: cli.id, motivo: "erro_fila" });
        await admin.from("lembretes_enviados").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cli.id,
          declaracao_id: declaracaoId,
          canal: "email",
          prazo_final: body.prazoFinal,
          mensagem: body.mensagem || null,
          enviado_por: user.id,
          status: "falhou",
          erro: msg.slice(0, 500),
        });
      }
    } else {
      // whatsapp
      if (!cli.telefone) {
        pulados.push({ clienteId: cli.id, motivo: "sem_telefone" });
        continue;
      }
      const message = renderMensagemWhatsApp({
        nome: cli.nome,
        prazoBR,
        escritorio: nomeEscritorio,
        custom: body.mensagem || "",
        anoBase: anoCorrente,
      });
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-service?action=send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            apikey: anonKey,
          },
          body: JSON.stringify({ phone: cli.telefone, message, clienteId: cli.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `status ${res.status}`);
        enfileirados.push(cli.id);
        await admin.from("lembretes_enviados").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cli.id,
          declaracao_id: declaracaoId,
          canal: "whatsapp",
          prazo_final: body.prazoFinal,
          mensagem: body.mensagem || null,
          enviado_por: user.id,
          status: "enfileirado",
        });
        // rate-limit Evolution
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("whatsapp falhou", cli.id, msg);
        pulados.push({ clienteId: cli.id, motivo: "erro_whatsapp" });
        await admin.from("lembretes_enviados").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cli.id,
          declaracao_id: declaracaoId,
          canal: "whatsapp",
          prazo_final: body.prazoFinal,
          mensagem: body.mensagem || null,
          enviado_por: user.id,
          status: "falhou",
          erro: msg.slice(0, 500),
        });
      }
    }
  }

  return jsonResponse({
    canal: body.canal,
    enfileirados: enfileirados.length,
    pulados,
    total: body.clienteIds.length,
  });
});
