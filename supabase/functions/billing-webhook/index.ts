import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Validate webhook token
function validateWebhook(req: Request): { valid: boolean; error?: string } {
  const asaasToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (!asaasToken) {
    console.error("[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado");
    return { valid: false, error: "Token não configurado no servidor" };
  }

  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const asaasHeader = req.headers.get("asaas-access-token");
  const queryToken = url.searchParams.get("access_token");

  // Support: Authorization Bearer, asaas-access-token header, or query param
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isValid = bearerToken === asaasToken || asaasHeader === asaasToken || queryToken === asaasToken;

  if (!isValid) {
    console.error("[WEBHOOK] Token inválido ou ausente");
  }

  return { valid: isValid, error: isValid ? undefined : "Token inválido" };
}

async function handlePaymentCreated(payment: any, admin: any) {
  // Find escritorio by externalReference or customer
  const escritorioId = payment.externalReference;
  if (!escritorioId) {
    console.warn("No externalReference in payment, skipping");
    return;
  }

  // Check for idempotency
  const { data: existing } = await admin
    .from("pagamentos_assinatura")
    .select("id")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  if (existing) {
    console.log("Payment already exists, skipping:", payment.id);
    return;
  }

  await admin.from("pagamentos_assinatura").insert({
    escritorio_id: escritorioId,
    asaas_payment_id: payment.id,
    status: "pending",
    valor: payment.value,
    data_vencimento: payment.dueDate,
    forma_pagamento: payment.billingType,
  });

  console.log("Payment created:", payment.id);
}

async function handlePaymentReceived(payment: any, admin: any) {
  // Update payment status
  await admin
    .from("pagamentos_assinatura")
    .update({
      status: "paid",
      data_pagamento: payment.paymentDate || new Date().toISOString().split("T")[0],
    })
    .eq("asaas_payment_id", payment.id);

  // Activate escritorio subscription
  const escritorioId = payment.externalReference;
  if (escritorioId) {
    await admin
      .from("assinaturas")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("escritorio_id", escritorioId);

    // Create notification
    await admin.from("notificacoes").insert({
      escritorio_id: escritorioId,
      titulo: "Pagamento confirmado",
      mensagem: `Pagamento de R$ ${payment.value?.toFixed(2)} confirmado. Seu plano está ativo.`,
      link_destino: "/planos",
    });
  }

  console.log("Payment received:", payment.id);
}

async function handlePaymentOverdue(payment: any, admin: any) {
  // Update payment status
  await admin
    .from("pagamentos_assinatura")
    .update({ status: "overdue" })
    .eq("asaas_payment_id", payment.id);

  // Mark subscription as overdue
  const escritorioId = payment.externalReference;
  if (escritorioId) {
    await admin
      .from("assinaturas")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("escritorio_id", escritorioId);

    // Create notification
    await admin.from("notificacoes").insert({
      escritorio_id: escritorioId,
      titulo: "⚠️ Pagamento em atraso",
      mensagem:
        "Seu pagamento está em atraso. Regularize para manter o acesso completo à plataforma.",
      link_destino: "/planos",
    });
  }

  console.log("Payment overdue:", payment.id);
}

async function handlePaymentRefunded(payment: any, admin: any) {
  await admin
    .from("pagamentos_assinatura")
    .update({ status: "refunded" })
    .eq("asaas_payment_id", payment.id);

  console.log("Payment refunded:", payment.id);
}

async function handleSubscriptionDeleted(subscription: any, admin: any) {
  await admin
    .from("assinaturas")
    .update({
      status: "cancelled",
      cancelado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("asaas_subscription_id", subscription.id);

  // Revert to free plan
  const escritorioId = subscription.externalReference;
  if (escritorioId) {
    await admin
      .from("escritorios")
      .update({
        plano: "gratuito",
        limite_declaracoes: 5,
        storage_limite_mb: 500,
        usuarios_limite: 1,
      })
      .eq("id", escritorioId);

    await admin.from("notificacoes").insert({
      escritorio_id: escritorioId,
      titulo: "Assinatura cancelada",
      mensagem: "Sua assinatura foi cancelada. Você foi revertido ao plano gratuito.",
      link_destino: "/planos",
    });
  }

  console.log("Subscription deleted:", subscription.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!validateWebhook(req)) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body.event;
    const payment = body.payment;
    const subscription = body.subscription;

    console.log("Webhook event:", event, "ID:", payment?.id || subscription?.id);

    const admin = getAdmin();

    switch (event) {
      case "PAYMENT_CREATED":
        if (payment) await handlePaymentCreated(payment, admin);
        break;
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        if (payment) await handlePaymentReceived(payment, admin);
        break;
      case "PAYMENT_OVERDUE":
        if (payment) await handlePaymentOverdue(payment, admin);
        break;
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK":
        if (payment) await handlePaymentRefunded(payment, admin);
        break;
      case "PAYMENT_DELETED":
        // No action needed
        break;
      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED":
        if (subscription) await handleSubscriptionDeleted(subscription, admin);
        break;
      default:
        console.log("Unhandled event:", event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
