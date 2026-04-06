import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

const PLAN_CONFIG: Record<string, { limite: number; storage: number; usuarios: number }> = {
  pro: { limite: 3, storage: 102400, usuarios: 5 },
};

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const admin = getSupabaseAdmin();
  const subscription = invoice.subscription as string;
  
  if (!subscription) return;

  // Get subscription details
  const sub = await stripe.subscriptions.retrieve(subscription);
  const escritorioId = sub.metadata?.escritorio_id;
  const plano = sub.metadata?.plano;

  if (!escritorioId) {
    console.error("No escritorio_id in subscription metadata");
    return;
  }

  // Update assinatura status
  await admin
    .from("assinaturas")
    .update({ status: "active" })
    .eq("stripe_subscription_id", subscription);

  // Update escritorio plan
  if (plano && PLAN_CONFIG[plano]) {
    const config = PLAN_CONFIG[plano];
    await admin
      .from("escritorios")
      .update({
        plano,
        limite_declaracoes: config.limite,
        storage_limite_mb: config.storage,
        usuarios_limite: config.usuarios,
      })
      .eq("id", escritorioId);
  }

  // Record payment
  await admin.from("pagamentos_assinatura").insert({
    escritorio_id: escritorioId,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    status: "paid",
    valor: (invoice.amount_paid || 0) / 100,
    data_vencimento: new Date((invoice.due_date || invoice.created) * 1000).toISOString().split("T")[0],
    data_pagamento: new Date().toISOString().split("T")[0],
    forma_pagamento: "STRIPE",
    provider: "stripe",
  });

  // Log
  await admin.from("system_logs").insert({
    tipo: "stripe_payment_received",
    mensagem: `Pagamento recebido: ${(invoice.amount_paid || 0) / 100} BRL`,
    metadata: { invoice_id: invoice.id, escritorio_id: escritorioId, plano },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const admin = getSupabaseAdmin();
  const subscription = invoice.subscription as string;
  if (!subscription) return;

  const sub = await stripe.subscriptions.retrieve(subscription);
  const escritorioId = sub.metadata?.escritorio_id;
  if (!escritorioId) return;

  // Update assinatura as overdue
  await admin
    .from("assinaturas")
    .update({ status: "overdue" })
    .eq("stripe_subscription_id", subscription);

  // Record failed payment
  await admin.from("pagamentos_assinatura").insert({
    escritorio_id: escritorioId,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    status: "failed",
    valor: (invoice.amount_due || 0) / 100,
    data_vencimento: new Date((invoice.due_date || invoice.created) * 1000).toISOString().split("T")[0],
    forma_pagamento: "STRIPE",
    provider: "stripe",
  });

  // Create notification
  await admin.from("notificacoes").insert({
    escritorio_id: escritorioId,
    titulo: "⚠️ Pagamento falhou",
    mensagem: "Seu pagamento não foi processado. Atualize suas informações de pagamento.",
    link_destino: "/meus-planos",
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdmin();
  const escritorioId = subscription.metadata?.escritorio_id;
  if (!escritorioId) return;

  await admin
    .from("assinaturas")
    .update({ status: "cancelled", cancelado_em: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id);

  await admin
    .from("escritorios")
    .update({ plano: "gratuito", limite_declaracoes: 1, storage_limite_mb: 500, usuarios_limite: 1 })
    .eq("id", escritorioId);

  await admin.from("notificacoes").insert({
    escritorio_id: escritorioId,
    titulo: "📌 Assinatura cancelada",
    mensagem: "Sua assinatura foi cancelada. Você voltou ao plano Free.",
    link_destino: "/meus-planos",
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdmin();
  const escritorioId = subscription.metadata?.escritorio_id;
  if (!escritorioId) return;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "overdue",
    canceled: "cancelled",
    unpaid: "overdue",
    incomplete: "pending",
    incomplete_expired: "cancelled",
    trialing: "active",
    paused: "paused",
  };

  const mappedStatus = statusMap[subscription.status] || subscription.status;

  await admin
    .from("assinaturas")
    .update({
      status: mappedStatus,
      proxima_cobranca: new Date(subscription.current_period_end * 1000).toISOString().split("T")[0],
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const admin = getSupabaseAdmin();
  const escritorioId = paymentIntent.metadata?.escritorio_id;
  const type = paymentIntent.metadata?.type;
  
  if (type === "declaracao_extra" && escritorioId) {
    const quantidade = parseInt(paymentIntent.metadata?.quantidade || "1");
    
    // Increment limit
    const { data: escritorio } = await admin
      .from("escritorios")
      .select("limite_declaracoes")
      .eq("id", escritorioId)
      .single();

    if (escritorio) {
      await admin
        .from("escritorios")
        .update({ limite_declaracoes: (escritorio.limite_declaracoes || 0) + quantidade })
        .eq("id", escritorioId);
    }

    // Record extra purchase
    await admin.from("declaracoes_extras").insert({
      escritorio_id: escritorioId,
      quantidade,
      valor_unitario: 4.90,
      valor_total: quantidade * 4.90,
    });

    await admin.from("notificacoes").insert({
      escritorio_id: escritorioId,
      titulo: "✅ Declarações extras adicionadas",
      mensagem: `${quantidade} declaração(ões) extra(s) foram adicionadas ao seu plano.`,
      link_destino: "/meus-planos",
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (WEBHOOK_SECRET && signature) {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        WEBHOOK_SECRET
      );
    } else {
      // Fallback: parse the event without signature verification (dev/sandbox)
      event = JSON.parse(body) as Stripe.Event;
      console.warn("⚠️ Webhook signature not verified - no STRIPE_WEBHOOK_SECRET set");
    }

    console.log(`Stripe event received: ${event.type}`);

    switch (event.type) {
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Stripe webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
