import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { asaasRequest, getAsaasConfig, isProduction } from "../_shared/asaas-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getSupabaseUser(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabaseUser(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const userId = user.id;

  // Get escritorio info
  const admin = getSupabaseAdmin();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("escritorio_id, nome, email, papel")
    .eq("id", userId)
    .single();

  if (!usuario) throw new Error("User not found");

  const { data: escritorio } = await admin
    .from("escritorios")
    .select("id, nome, cnpj, email, telefone, asaas_customer_id, plano")
    .eq("id", usuario.escritorio_id)
    .single();

  if (!escritorio) throw new Error("Office not found");

  return { userId, usuario, escritorio, admin };
}

// --- Handlers ---

async function createCustomer(escritorio: any, admin: any) {
  if (escritorio.asaas_customer_id) {
    return { customerId: escritorio.asaas_customer_id };
  }

  const customer = await asaasRequest("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: escritorio.nome,
      cpfCnpj: (escritorio.cnpj || "").replace(/\D/g, ""),
      email: escritorio.email,
      phone: escritorio.telefone,
      externalReference: escritorio.id,
    }),
  });

  await admin
    .from("escritorios")
    .update({ asaas_customer_id: customer.id })
    .eq("id", escritorio.id);

  return { customerId: customer.id };
}

const PLANOS_CONFIG: Record<string, { valor: number; nome: string; limite: number; storage: number; usuarios: number }> = {
  starter: { valor: 29.9, nome: "Starter", limite: 10, storage: 10240, usuarios: 1 },
  profissional: { valor: 49.9, nome: "Profissional", limite: 20, storage: 30720, usuarios: 5 },
  enterprise: { valor: 199.9, nome: "Enterprise", limite: 9999, storage: 102400, usuarios: 9999 },
};

async function createSubscription(
  escritorio: any,
  admin: any,
  body: { plano: string; billingType: string; creditCard?: any; creditCardHolderInfo?: any }
) {
  const planoConfig = PLANOS_CONFIG[body.plano];
  if (!planoConfig) throw new Error("Plano inválido");

  // Ensure customer exists
  let customerId = escritorio.asaas_customer_id;
  if (!customerId) {
    const result = await createCustomer(escritorio, admin);
    customerId = result.customerId;
  }

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const dueDateStr = nextDueDate.toISOString().split("T")[0];

  const subscriptionPayload: any = {
    customer: customerId,
    billingType: body.billingType,
    value: planoConfig.valor,
    nextDueDate: dueDateStr,
    cycle: "MONTHLY",
    description: `Plano ${planoConfig.nome} - DeclaraIR`,
    externalReference: escritorio.id,
  };

  if (body.billingType === "CREDIT_CARD" && body.creditCard) {
    subscriptionPayload.creditCard = body.creditCard;
    subscriptionPayload.creditCardHolderInfo = body.creditCardHolderInfo;
  }

  const subscription = await asaasRequest("/subscriptions", {
    method: "POST",
    body: JSON.stringify(subscriptionPayload),
  });

  // Save subscription internally
  await admin.from("assinaturas").upsert(
    {
      escritorio_id: escritorio.id,
      asaas_subscription_id: subscription.id,
      plano: body.plano,
      status: "active",
      valor: planoConfig.valor,
      ciclo: "MONTHLY",
      proxima_cobranca: dueDateStr,
    },
    { onConflict: "escritorio_id" }
  );

  // Update escritorio plan
  await admin
    .from("escritorios")
    .update({
      plano: body.plano,
      limite_declaracoes: planoConfig.limite,
      storage_limite_mb: planoConfig.storage,
      usuarios_limite: planoConfig.usuarios,
    })
    .eq("id", escritorio.id);

  // Get first payment info
  let paymentInfo = null;
  if (body.billingType === "PIX" || body.billingType === "BOLETO") {
    // Wait a bit for payment creation
    await new Promise((r) => setTimeout(r, 2000));
    const payments = await asaasRequest(`/subscriptions/${subscription.id}/payments`);
    if (payments.data?.length > 0) {
      const payment = payments.data[0];
      
      if (body.billingType === "PIX") {
        try {
          const pix = await asaasRequest(`/payments/${payment.id}/pixQrCode`);
          paymentInfo = {
            paymentId: payment.id,
            pixQrCode: pix.payload,
            pixQrCodeUrl: pix.encodedImage,
          };

          await admin.from("pagamentos_assinatura").insert({
            escritorio_id: escritorio.id,
            assinatura_id: null,
            asaas_payment_id: payment.id,
            status: "pending",
            valor: planoConfig.valor,
            data_vencimento: dueDateStr,
            forma_pagamento: "PIX",
            pix_qrcode: pix.payload,
            pix_qrcode_url: pix.encodedImage,
          });
        } catch (e) {
          console.error("PIX QR error:", e);
        }
      } else if (body.billingType === "BOLETO") {
        paymentInfo = {
          paymentId: payment.id,
          boletoUrl: payment.bankSlipUrl,
          boletoLinhaDigitavel: payment.nossoNumero,
        };

        await admin.from("pagamentos_assinatura").insert({
          escritorio_id: escritorio.id,
          assinatura_id: null,
          asaas_payment_id: payment.id,
          status: "pending",
          valor: planoConfig.valor,
          data_vencimento: dueDateStr,
          forma_pagamento: "BOLETO",
          boleto_url: payment.bankSlipUrl,
          boleto_linha_digitavel: payment.nossoNumero,
        });
      }
    }
  }

  // Auto-register webhook if not already done
  try {
    await registerWebhook(escritorio);
    console.log("Webhook auto-registered for escritorio:", escritorio.id);
  } catch (webhookErr) {
    console.error("Failed to auto-register webhook (non-blocking):", webhookErr);
  }

  return {
    subscriptionId: subscription.id,
    plano: body.plano,
    status: "active",
    paymentInfo,
  };
}

async function cancelSubscription(escritorio: any, admin: any) {
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .single();

  if (!assinatura?.asaas_subscription_id) {
    throw new Error("Nenhuma assinatura ativa encontrada");
  }

  await asaasRequest(`/subscriptions/${assinatura.asaas_subscription_id}`, {
    method: "DELETE",
  });

  await admin
    .from("assinaturas")
    .update({ status: "cancelled", cancelado_em: new Date().toISOString() })
    .eq("id", assinatura.id);

  await admin
    .from("escritorios")
    .update({ plano: "gratuito", limite_declaracoes: 5, storage_limite_mb: 500, usuarios_limite: 1 })
    .eq("id", escritorio.id);

  return { success: true };
}

async function getPayments(escritorio: any, admin: any) {
  const { data: pagamentos } = await admin
    .from("pagamentos_assinatura")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return { pagamentos: pagamentos || [] };
}

const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/billing-webhook`;

const WEBHOOK_EVENTS = [
  "PAYMENT_CREATED",
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK",
  "PAYMENT_DELETED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
];

async function listWebhooks() {
  const data = await asaasRequest("/webhooks");
  return { webhooks: data?.data || [] };
}

async function registerWebhook(escritorio: any) {
  // Check for existing webhook with same URL
  const existing = await asaasRequest("/webhooks");
  const alreadyRegistered = (existing?.data || []).find(
    (w: any) => w.url === WEBHOOK_URL && w.enabled
  );
  if (alreadyRegistered) {
    return { success: true, message: "Webhook já registrado", webhook: alreadyRegistered };
  }

  const webhookPayload: any = {
    name: "DeclaraIR Billing Webhook",
    url: WEBHOOK_URL,
    email: escritorio.email || "",
    enabled: true,
    interrupted: false,
    sendType: "SEQUENTIALLY",
    events: WEBHOOK_EVENTS,
  };

  // Include auth token for webhook validation
  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (webhookToken) {
    webhookPayload.authToken = webhookToken;
  }

  const webhook = await asaasRequest("/webhooks", {
    method: "POST",
    body: JSON.stringify(webhookPayload),
  });

  return { success: true, message: "Webhook registrado com sucesso", webhook };
}

async function getSubscription(escritorio: any, admin: any) {
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .maybeSingle();

  return { assinatura, planoAtual: escritorio.plano };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const { escritorio, admin } = await authenticateUser(req);

    let result;

    switch (action) {
      case "create-customer":
        result = await createCustomer(escritorio, admin);
        break;
      case "create-subscription": {
        const body = await req.json();
        result = await createSubscription(escritorio, admin, body);
        break;
      }
      case "cancel-subscription":
        result = await cancelSubscription(escritorio, admin);
        break;
      case "get-payments":
        result = await getPayments(escritorio, admin);
        break;
      case "get-subscription":
        result = await getSubscription(escritorio, admin);
        break;
      case "register-webhook":
        result = await registerWebhook(escritorio);
        break;
      case "list-webhooks":
        result = await listWebhooks();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Billing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
