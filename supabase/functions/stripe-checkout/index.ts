import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

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

  const admin = getSupabaseAdmin();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("escritorio_id, nome, email, papel")
    .eq("id", user.id)
    .single();
  if (!usuario) throw new Error("User not found");

  const { data: escritorio } = await admin
    .from("escritorios")
    .select("id, nome, cnpj, email, telefone, stripe_customer_id, plano")
    .eq("id", usuario.escritorio_id)
    .single();
  if (!escritorio) throw new Error("Office not found");

  return { userId: user.id, usuario, escritorio, admin };
}

// ── Price config ──
const PRICES: Record<string, { amount: number; name: string; limite: number; storage: number; usuarios: number }> = {
  pro: { amount: 2990, name: "Pro", limite: 3, storage: 102400, usuarios: 5 },
};

const ADDON_PRICES: Record<string, { amount: number; name: string }> = {
  whatsapp: { amount: 1990, name: "WhatsApp Automático" },
  api_publica: { amount: 2990, name: "API Pública" },
  whitelabel: { amount: 4990, name: "Whitelabel" },
};

// ── Ensure Stripe customer ──
async function ensureStripeCustomer(escritorio: any, admin: any) {
  if (escritorio.stripe_customer_id) {
    return escritorio.stripe_customer_id;
  }
  const customer = await stripe.customers.create({
    name: escritorio.nome,
    email: escritorio.email || undefined,
    phone: escritorio.telefone || undefined,
    metadata: { escritorio_id: escritorio.id, cnpj: escritorio.cnpj || "" },
  });
  await admin
    .from("escritorios")
    .update({ stripe_customer_id: customer.id })
    .eq("id", escritorio.id);
  return customer.id;
}

// ── Create subscription ──
async function createSubscription(
  escritorio: any,
  admin: any,
  body: { plano: string; paymentMethod: string }
) {
  const planoConfig = PRICES[body.plano];
  if (!planoConfig) throw new Error("Plano inválido");

  const customerId = await ensureStripeCustomer(escritorio, admin);

  // Find or create product+price
  const productName = `DeclaraIR ${planoConfig.name}`;
  let products = await stripe.products.search({ query: `name:'${productName}' active:'true'` });
  let product = products.data[0];
  if (!product) {
    product = await stripe.products.create({ name: productName, metadata: { plano: body.plano } });
  }

  let prices = await stripe.prices.list({ product: product.id, active: true, type: "recurring", limit: 5 });
  let price = prices.data.find(p => p.unit_amount === planoConfig.amount && p.currency === "brl" && p.recurring?.interval === "month");
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: planoConfig.amount,
      currency: "brl",
      recurring: { interval: "month" },
    });
  }

  // Payment method handling
  const paymentMethodTypes = body.paymentMethod === "pix" ? ["pix"] : ["card"];

  // Create subscription with Payment Intent (transparent checkout)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      payment_method_types: paymentMethodTypes as any,
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: { escritorio_id: escritorio.id, plano: body.plano },
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  // Save subscription in DB
  await admin.from("assinaturas").upsert(
    {
      escritorio_id: escritorio.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: price.id,
      plano: body.plano,
      status: "pending",
      valor: planoConfig.amount / 100,
      ciclo: "MONTHLY",
      provider: "stripe",
      proxima_cobranca: new Date(subscription.current_period_end * 1000).toISOString().split("T")[0],
    },
    { onConflict: "escritorio_id" }
  );

  // Return client secret for frontend to complete payment
  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    plano: body.plano,
  };
}

// ── Cancel subscription ──
async function cancelSubscription(escritorio: any, admin: any) {
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .eq("provider", "stripe")
    .single();

  if (!assinatura?.stripe_subscription_id) {
    throw new Error("Nenhuma assinatura ativa encontrada");
  }

  await stripe.subscriptions.cancel(assinatura.stripe_subscription_id);

  await admin
    .from("assinaturas")
    .update({ status: "cancelled", cancelado_em: new Date().toISOString() })
    .eq("id", assinatura.id);

  await admin
    .from("escritorios")
    .update({ plano: "gratuito", limite_declaracoes: 1, storage_limite_mb: 500, usuarios_limite: 1 })
    .eq("id", escritorio.id);

  return { success: true };
}

// ── Get subscription ──
async function getSubscription(escritorio: any, admin: any) {
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .maybeSingle();

  return { assinatura, planoAtual: escritorio.plano };
}

// ── Get payments ──
async function getPayments(escritorio: any, admin: any) {
  const { data: pagamentos } = await admin
    .from("pagamentos_assinatura")
    .select("*")
    .eq("escritorio_id", escritorio.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return { pagamentos: pagamentos || [] };
}

// ── Activate addon ──
async function activateAddon(
  escritorio: any,
  admin: any,
  body: { addonSlug: string }
) {
  const addonConfig = ADDON_PRICES[body.addonSlug];
  if (!addonConfig) throw new Error("Addon inválido");

  const customerId = await ensureStripeCustomer(escritorio, admin);

  // Find or create addon product+price
  const productName = `DeclaraIR Addon - ${addonConfig.name}`;
  let products = await stripe.products.search({ query: `name:'${productName}' active:'true'` });
  let product = products.data[0];
  if (!product) {
    product = await stripe.products.create({ name: productName, metadata: { addon: body.addonSlug } });
  }

  let prices = await stripe.prices.list({ product: product.id, active: true, type: "recurring", limit: 5 });
  let price = prices.data.find(p => p.unit_amount === addonConfig.amount && p.currency === "brl" && p.recurring?.interval === "month");
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: addonConfig.amount,
      currency: "brl",
      recurring: { interval: "month" },
    });
  }

  // Check if there's an active subscription to add the addon to
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("stripe_subscription_id")
    .eq("escritorio_id", escritorio.id)
    .eq("status", "active")
    .eq("provider", "stripe")
    .maybeSingle();

  let subscriptionItemId: string;

  if (assinatura?.stripe_subscription_id) {
    // Add as a new subscription item to existing subscription
    const item = await stripe.subscriptionItems.create({
      subscription: assinatura.stripe_subscription_id,
      price: price.id,
      metadata: { addon: body.addonSlug, escritorio_id: escritorio.id },
    });
    subscriptionItemId = item.id;
  } else {
    // Create a separate subscription for the addon
    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      metadata: { escritorio_id: escritorio.id, addon: body.addonSlug },
    });
    subscriptionItemId = sub.items.data[0].id;
  }

  // Get the addon from DB
  const { data: addon } = await admin
    .from("addons")
    .select("id")
    .ilike("nome", `%${body.addonSlug}%`)
    .single();

  if (addon) {
    await admin.from("escritorio_addons").upsert(
      {
        escritorio_id: escritorio.id,
        addon_id: addon.id,
        status: "ativo",
        ativado_em: new Date().toISOString(),
        stripe_subscription_item_id: subscriptionItemId,
      },
      { onConflict: "escritorio_id,addon_id", ignoreDuplicates: false }
    );
  }

  return { success: true, subscriptionItemId };
}

// ── Deactivate addon ──
async function deactivateAddon(
  escritorio: any,
  admin: any,
  body: { addonSlug: string }
) {
  const { data: addon } = await admin
    .from("addons")
    .select("id")
    .ilike("nome", `%${body.addonSlug}%`)
    .single();

  if (!addon) throw new Error("Addon não encontrado");

  const { data: escritorioAddon } = await admin
    .from("escritorio_addons")
    .select("id, stripe_subscription_item_id")
    .eq("escritorio_id", escritorio.id)
    .eq("addon_id", addon.id)
    .eq("status", "ativo")
    .single();

  if (!escritorioAddon) throw new Error("Addon não está ativo");

  // Remove from Stripe
  if (escritorioAddon.stripe_subscription_item_id) {
    try {
      await stripe.subscriptionItems.del(escritorioAddon.stripe_subscription_item_id, {
        proration_behavior: "create_prorations",
      });
    } catch (e) {
      console.error("Failed to remove Stripe subscription item:", e);
    }
  }

  await admin
    .from("escritorio_addons")
    .update({ status: "inativo", desativado_em: new Date().toISOString() })
    .eq("id", escritorioAddon.id);

  return { success: true };
}

// ── Create customer portal session ──
async function createPortalSession(escritorio: any) {
  const customerId = escritorio.stripe_customer_id;
  if (!customerId) throw new Error("Customer não encontrado");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/meus-planos`,
  });

  return { url: session.url };
}

// ── Buy extra declarations ──
async function buyExtraDeclaracoes(
  escritorio: any,
  admin: any,
  body: { quantidade: number }
) {
  const customerId = await ensureStripeCustomer(escritorio, admin);
  const amount = body.quantidade * 990; // R$ 9,90 each

  const productName = "DeclaraIR - Declaração Extra";
  let products = await stripe.products.search({ query: `name:'${productName}' active:'true'` });
  let product = products.data[0];
  if (!product) {
    product = await stripe.products.create({ name: productName, metadata: { type: "declaracao_extra" } });
  }

  // Create one-time price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 990,
    currency: "brl",
  });

  // Create a one-time invoice
  await stripe.invoiceItems.create({
    customer: customerId,
    price: price.id,
    quantity: body.quantidade,
    description: `${body.quantidade} declaração(ões) extra(s)`,
  });

  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    collection_method: "send_invoice",
    days_until_due: 3,
    metadata: { escritorio_id: escritorio.id, type: "declaracao_extra", quantidade: String(body.quantidade) },
  });

  await stripe.invoices.finalizeInvoice(invoice.id);

  // Create a payment intent for immediate payment
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "brl",
    customer: customerId,
    payment_method_types: ["card", "pix"],
    metadata: { escritorio_id: escritorio.id, type: "declaracao_extra", quantidade: String(body.quantidade) },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
    quantidade: body.quantidade,
  };
}

// ── Router ──
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
      case "create-subscription": {
        const body = await req.json();
        result = await createSubscription(escritorio, admin, body);
        break;
      }
      case "cancel-subscription":
        result = await cancelSubscription(escritorio, admin);
        break;
      case "get-subscription":
        result = await getSubscription(escritorio, admin);
        break;
      case "get-payments":
        result = await getPayments(escritorio, admin);
        break;
      case "activate-addon": {
        const body = await req.json();
        result = await activateAddon(escritorio, admin, body);
        break;
      }
      case "deactivate-addon": {
        const body = await req.json();
        result = await deactivateAddon(escritorio, admin, body);
        break;
      }
      case "create-portal-session":
        result = await createPortalSession(escritorio);
        break;
      case "buy-extra-declaracoes": {
        const body = await req.json();
        result = await buyExtraDeclaracoes(escritorio, admin, body);
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
