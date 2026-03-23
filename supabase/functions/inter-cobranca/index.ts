import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { cobranca_id, escritorio_id } = await req.json();

    if (!cobranca_id || !escritorio_id) {
      return new Response(JSON.stringify({ error: "cobranca_id e escritorio_id são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch Inter config
    const { data: configs } = await supabase
      .from("configuracoes_escritorio")
      .select("chave, valor")
      .eq("escritorio_id", escritorio_id);

    const cfg: Record<string, string> = {};
    (configs || []).forEach((c: { chave: string; valor: string | null }) => {
      cfg[c.chave] = c.valor || "";
    });

    if (!cfg.inter_client_id || !cfg.inter_client_secret) {
      return new Response(JSON.stringify({ error: "Credenciais do Inter não configuradas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch cobranca + cliente
    const { data: cobranca, error: cobErr } = await supabase
      .from("cobrancas")
      .select("*, clientes!cobrancas_cliente_id_fkey(nome, cpf, email)")
      .eq("id", cobranca_id)
      .single();

    if (cobErr || !cobranca) {
      return new Response(JSON.stringify({ error: "Cobrança não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. OAuth2 token
    const baseUrl = cfg.inter_ambiente === "producao"
      ? "https://cdpj.partners.bancointer.com.br"
      : "https://cdpj-sandbox.partners.bancointer.com.br";

    const tokenRes = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.inter_client_id,
        client_secret: cfg.inter_client_secret,
        scope: "boleto-cobranca.write boleto-cobranca.read",
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return new Response(JSON.stringify({ error: "Erro ao obter token do Inter", detail: errBody }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token } = await tokenRes.json();

    // 4. Create cobranca on Inter
    const cpfLimpo = (cobranca.clientes?.cpf || "").replace(/\D/g, "");

    const interPayload = {
      seuNumero: cobranca.id.slice(0, 15),
      valorNominal: cobranca.valor,
      dataVencimento: cobranca.data_vencimento,
      numDiasAgenda: 30,
      pagador: {
        cpfCnpj: cpfLimpo,
        tipoPessoa: cpfLimpo.length <= 11 ? "FISICA" : "JURIDICA",
        nome: cobranca.clientes?.nome || "Cliente",
        endereco: "Não informado",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01001000",
      },
    };

    const cobRes = await fetch(`${baseUrl}/cobranca/v3/cobrancas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interPayload),
    });

    if (!cobRes.ok) {
      const errBody = await cobRes.text();
      return new Response(JSON.stringify({ error: "Erro ao criar cobrança no Inter", detail: errBody }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await cobRes.json();

    // 5. Update cobranca in Supabase
    await supabase.from("cobrancas").update({
      cobranca_externa_id: result.codigoSolicitacao || result.nossoNumero || null,
      cobranca_externa_status: "A_RECEBER",
      pix_qrcode: result.pix?.pixCopiaECola || null,
      boleto_codigo_barras: result.codigoBarras || null,
      boleto_linha_digitavel: result.linhaDigitavel || null,
    }).eq("id", cobranca_id);

    return new Response(JSON.stringify({
      success: true,
      codigoSolicitacao: result.codigoSolicitacao,
      pixCopiaECola: result.pix?.pixCopiaECola,
      codigoBarras: result.codigoBarras,
      linhaDigitavel: result.linhaDigitavel,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
