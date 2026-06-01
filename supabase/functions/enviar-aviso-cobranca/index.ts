// Envia avisos de cobrança (pendentes/atrasadas) em massa por email/WhatsApp.
// - Email: chama send-transactional-email (template aviso-cobranca) que enfileira na pgmq.
// - WhatsApp: chama whatsapp-service action=send-message por cliente, com delay 400ms.
// - Segurança: filtra apenas cobranças do escritório do usuário e status pendente/atrasado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  canal: z.enum(["email", "whatsapp"]),
  cobrancaIds: z.array(z.string().uuid()).min(1).max(500),
  mensagem: z.string().max(2000).optional().default(""),
  cc: z.array(z.string().email()).max(10).optional().default([]),
});

const PORTAL_BASE_URL = "https://declarair.com.br";
const WHATSAPP_ADDON_ID = "6a5bab9f-a9d1-4ae4-9925-8fd8a25fbf3f";
const MAX_WHATSAPP_BATCH = 300;
const WA_DELAY_MS = 400;

const DEFAULT_WA_TEMPLATE =
  "Olá *{nome}*,\n\n" +
  "Lembrete sobre a cobrança *{descricao}*:\n\n" +
  "💰 *Valor:* R$ {valor}\n" +
  "📅 *Vencimento:* {vencimento}\n" +
  "{linha_atraso}\n\n" +
  "{mensagem_adicional}\n\n" +
  "— {escritorio}";

const DEFAULT_EMAIL_ASSUNTO =
  "Lembrete de cobrança — R$ {valor} (venc. {vencimento})";
const DEFAULT_EMAIL_CORPO =
  "Olá {nome},\n\n" +
  "Este é um lembrete sobre a cobrança *{descricao}* no valor de R$ {valor}, com vencimento em {vencimento}.\n\n" +
  "{mensagem_adicional}\n\n" +
  "Caso o pagamento já tenha sido efetuado, desconsidere este aviso.\n\n" +
  "— {escritorio}";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatBRL(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function diasAtraso(venc: string | null | undefined): number {
  if (!venc) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(`${venc.split("T")[0]}T00:00:00`);
  const diff = Math.floor((hoje.getTime() - v.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

interface RenderCtx {
  nome: string;
  descricao: string;
  valor: string;
  vencimento: string;
  diasAtraso: number;
  escritorio: string;
  chavePix: string;
  mensagemAdicional: string;
}

function applyPlaceholders(tpl: string, ctx: RenderCtx): string {
  const linhaAtraso = ctx.diasAtraso > 0
    ? `⏰ *Em atraso há ${ctx.diasAtraso} dia(s).*`
    : "";
  const expand = (s: string) =>
    s
      .replaceAll("{nome}", ctx.nome)
      .replaceAll("{descricao}", ctx.descricao)
      .replaceAll("{valor}", ctx.valor)
      .replaceAll("{vencimento}", ctx.vencimento)
      .replaceAll("{dias_atraso}", String(ctx.diasAtraso))
      .replaceAll("{linha_atraso}", linhaAtraso)
      .replaceAll("{escritorio}", ctx.escritorio)
      .replaceAll("{chave_pix}", ctx.chavePix || "");
  const mensagemAdicionalExpandida = expand(ctx.mensagemAdicional || "");
  return expand(tpl)
    .replaceAll("{mensagem_adicional}", mensagemAdicionalExpandida)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, escritorio_id, papel, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (!usuario || !usuario.ativo) {
    return jsonResponse({ error: "Apenas usuários do escritório podem disparar avisos" }, 403);
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

  // Verifica addon WhatsApp ativo
  if (body.canal === "whatsapp") {
    if (body.cobrancaIds.length > MAX_WHATSAPP_BATCH) {
      return jsonResponse({
        error: `Disparo WhatsApp limitado a ${MAX_WHATSAPP_BATCH} cobranças por vez.`,
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

  // Dados do escritório (templates + nome + chave pix)
  const { data: escritorio } = await admin
    .from("escritorios")
    .select(
      "id, nome, nome_fantasia, chave_pix, cobranca_aviso_whatsapp_template, cobranca_aviso_email_assunto, cobranca_aviso_email_corpo"
    )
    .eq("id", usuario.escritorio_id)
    .single();
  const nomeEscritorio = escritorio?.nome_fantasia || escritorio?.nome || "Seu contador";
  const chavePix = escritorio?.chave_pix || "";
  const waTpl = (escritorio?.cobranca_aviso_whatsapp_template || DEFAULT_WA_TEMPLATE).trim();
  const emailAssuntoTpl = (escritorio?.cobranca_aviso_email_assunto || DEFAULT_EMAIL_ASSUNTO).trim();
  const emailCorpoTpl = (escritorio?.cobranca_aviso_email_corpo || DEFAULT_EMAIL_CORPO).trim();

  // Carrega cobranças do escritório, somente pendente/atrasado
  const { data: cobrancas, error: cErr } = await admin
    .from("cobrancas")
    .select("id, cliente_id, descricao, valor, data_vencimento, status, clientes!inner(id, nome, email, telefone)")
    .eq("escritorio_id", usuario.escritorio_id)
    .in("id", body.cobrancaIds)
    .in("status", ["pendente", "atrasado"]);

  if (cErr) {
    console.error("Erro ao buscar cobranças:", cErr);
    return jsonResponse({ error: "Erro ao buscar cobranças" }, 500);
  }

  const enfileirados: string[] = [];
  const pulados: Array<{ cobrancaId: string; motivo: string }> = [];

  const elegiveis = new Set((cobrancas || []).map((c) => c.id));
  for (const id of body.cobrancaIds) {
    if (!elegiveis.has(id)) pulados.push({ cobrancaId: id, motivo: "nao_elegivel" });
  }

  for (const cob of cobrancas || []) {
    const cliente = Array.isArray(cob.clientes) ? cob.clientes[0] : cob.clientes;
    if (!cliente) {
      pulados.push({ cobrancaId: cob.id, motivo: "cliente_nao_encontrado" });
      continue;
    }

    const dias = diasAtraso(cob.data_vencimento);
    const ctx: RenderCtx = {
      nome: cliente.nome || "contribuinte",
      descricao: cob.descricao || "Serviço contábil",
      valor: formatBRL(cob.valor),
      vencimento: formatDateBR(cob.data_vencimento),
      diasAtraso: dias,
      escritorio: nomeEscritorio,
      chavePix,
      mensagemAdicional: (body.mensagem || "").trim(),
    };

    if (body.canal === "email") {
      if (!cliente.email) {
        pulados.push({ cobrancaId: cob.id, motivo: "sem_email" });
        continue;
      }
      const assunto = applyPlaceholders(emailAssuntoTpl, ctx);
      const corpo = applyPlaceholders(emailCorpoTpl, ctx);
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateName: "aviso-cobranca",
            recipientEmail: cliente.email,
            escritorioId: usuario.escritorio_id,
            idempotencyKey: `aviso-cob-${cob.id}-${new Date().toISOString().slice(0, 10)}`,
            subject: assunto,
            templateData: {
              nomeCliente: cliente.nome,
              nomeEscritorio,
              descricao: cob.descricao || "Serviço contábil",
              valor: ctx.valor,
              dataVencimento: ctx.vencimento,
              diasAtraso: dias,
              chavePix,
              linkPortal: `${PORTAL_BASE_URL}/cliente/dashboard`,
              mensagemPersonalizada: corpo,
              statusLabel: dias > 0 ? "Cobrança em Atraso" : "Cobrança Pendente",
            },
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`send-transactional-email ${res.status}: ${txt.slice(0, 200)}`);
        }
        await res.json().catch(() => ({}));
        enfileirados.push(cob.id);
        await admin.from("mensagens_enviadas").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cliente.id,
          canal: "email",
          conteudo_final: `${assunto}\n\n${corpo}`,
          status: "enfileirado",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("aviso-cobranca email falhou", cob.id, msg);
        pulados.push({ cobrancaId: cob.id, motivo: "erro_fila" });
        await admin.from("mensagens_enviadas").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cliente.id,
          canal: "email",
          conteudo_final: `${assunto}\n\n${corpo}`,
          status: "falhou",
        });
      }
    } else {
      // whatsapp
      if (!cliente.telefone) {
        pulados.push({ cobrancaId: cob.id, motivo: "sem_telefone" });
        continue;
      }
      const message = applyPlaceholders(waTpl, ctx);
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-service?action=send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            apikey: anonKey,
          },
          body: JSON.stringify({ phone: cliente.telefone, message, clienteId: cliente.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `status ${res.status}`);
        enfileirados.push(cob.id);
        await admin.from("mensagens_enviadas").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cliente.id,
          canal: "whatsapp",
          conteudo_final: message,
          status: "enviado",
        });
        // rate-limit Evolution
        await new Promise((r) => setTimeout(r, WA_DELAY_MS));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("aviso-cobranca whatsapp falhou", cob.id, msg);
        pulados.push({ cobrancaId: cob.id, motivo: "erro_whatsapp" });
        await admin.from("mensagens_enviadas").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: cliente.id,
          canal: "whatsapp",
          conteudo_final: message,
          status: "falhou",
        });
      }
    }
  }

  return jsonResponse({
    canal: body.canal,
    enfileirados: enfileirados.length,
    pulados,
  });
});
