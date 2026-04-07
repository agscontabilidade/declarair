import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) throw new Error("LOVABLE_API_KEY não configurada");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Token inválido");

    const { declaracao_id, tipo } = await req.json();

    if (!declaracao_id) throw new Error("declaracao_id é obrigatório");

    // Get user's escritorio
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("escritorio_id")
      .eq("id", user.id)
      .single();

    if (!usuario) throw new Error("Usuário não encontrado");

    // Get declaration + form data
    const { data: declaracao } = await supabase
      .from("declaracoes")
      .select("*, clientes(nome, cpf)")
      .eq("id", declaracao_id)
      .eq("escritorio_id", usuario.escritorio_id)
      .single();

    if (!declaracao) throw new Error("Declaração não encontrada");

    const { data: formulario } = await supabase
      .from("formulario_ir")
      .select("*")
      .eq("declaracao_id", declaracao_id)
      .single();

    // Build context for AI
    const context = buildContext(declaracao, formulario);
    const systemPrompt = getSystemPrompt(tipo || "analise");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro na API de IA");
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ia-fiscal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getSystemPrompt(tipo: string): string {
  const base = `Você é um assistente fiscal especializado em Imposto de Renda Pessoa Física (IRPF) no Brasil. 
Responda sempre em português brasileiro. Seja objetivo e prático.
Use a tabela progressiva IRPF vigente. Considere limites de deduções (educação: R$ 3.561,50/pessoa, PGBL: 12% da renda, médicas: sem limite).`;

  if (tipo === "deducoes") {
    return base + `\n\nAnalise os dados do contribuinte e sugira deduções que podem estar faltando. 
Liste cada sugestão com: tipo da dedução, valor estimado de economia, documentos necessários.
Foque em oportunidades reais baseadas no perfil fiscal apresentado.`;
  }

  if (tipo === "riscos") {
    return base + `\n\nAnalise os dados e identifique possíveis riscos de malha fina.
Para cada risco: descreva o problema, gravidade (baixa/média/alta), e ação corretiva recomendada.
Considere divergências comuns como: rendimentos vs DIRF, bens incompatíveis com renda, etc.`;
  }

  return base + `\n\nFaça uma análise fiscal completa do contribuinte. Inclua:
1. Resumo da situação fiscal
2. Recomendação: declaração simplificada ou completa (e por quê)
3. Deduções aproveitadas e possíveis otimizações
4. Alertas de risco (malha fina)
5. Orientações para o próximo ano`;
}

function buildContext(declaracao: any, formulario: any): string {
  const cliente = declaracao.clientes;
  let ctx = `## Dados do Contribuinte\n- Nome: ${cliente?.nome || "N/I"}\n- Ano-base: ${declaracao.ano_base}\n`;

  if (!formulario) {
    ctx += "\n⚠️ Formulário IR ainda não preenchido. Análise limitada aos dados da declaração.\n";
    ctx += `- Status: ${declaracao.status}\n`;
    if (declaracao.tipo_resultado) ctx += `- Resultado: ${declaracao.tipo_resultado} (R$ ${declaracao.valor_resultado || 0})\n`;
    return ctx;
  }

  if (formulario.estado_civil) ctx += `- Estado Civil: ${formulario.estado_civil}\n`;

  const deps = Array.isArray(formulario.dependentes) ? formulario.dependentes : [];
  ctx += `- Dependentes: ${deps.length}\n`;

  const rendEmp = Array.isArray(formulario.rendimentos_emprego) ? formulario.rendimentos_emprego : [];
  const totalRend = rendEmp.reduce((s: number, r: any) => s + (parseFloat(r.rendimento_bruto) || 0), 0);
  ctx += `\n## Rendimentos\n- Emprego: R$ ${totalRend.toFixed(2)} (${rendEmp.length} fonte(s))\n`;

  const rendAut = Array.isArray(formulario.rendimentos_autonomo) ? formulario.rendimentos_autonomo : [];
  if (rendAut.length > 0) {
    const totalAut = rendAut.reduce((s: number, r: any) => s + (parseFloat(r.valor) || 0), 0);
    ctx += `- Autônomo: R$ ${totalAut.toFixed(2)}\n`;
  }

  const rendAlug = Array.isArray(formulario.rendimentos_aluguel) ? formulario.rendimentos_aluguel : [];
  if (rendAlug.length > 0) {
    const totalAlug = rendAlug.reduce((s: number, r: any) => s + (parseFloat(r.valor_mensal) || 0) * 12, 0);
    ctx += `- Aluguel: R$ ${totalAlug.toFixed(2)}/ano\n`;
  }

  const medicas = Array.isArray(formulario.despesas_medicas) ? formulario.despesas_medicas : [];
  const totalMed = medicas.reduce((s: number, d: any) => s + (parseFloat(d.valor) || 0), 0);
  ctx += `\n## Deduções\n- Despesas Médicas: R$ ${totalMed.toFixed(2)} (${medicas.length} item(s))\n`;

  const educ = Array.isArray(formulario.despesas_educacao) ? formulario.despesas_educacao : [];
  const totalEduc = educ.reduce((s: number, d: any) => s + (parseFloat(d.valor) || 0), 0);
  ctx += `- Educação: R$ ${totalEduc.toFixed(2)} (${educ.length} item(s))\n`;

  const prev = formulario.previdencia_privada || {};
  if (prev.valor) ctx += `- Previdência Privada: R$ ${prev.valor} (${prev.tipo || "N/I"})\n`;

  const bens = Array.isArray(formulario.bens_direitos) ? formulario.bens_direitos : [];
  if (bens.length > 0) {
    const totalBens = bens.reduce((s: number, b: any) => s + (parseFloat(b.valor) || 0), 0);
    ctx += `\n## Bens e Direitos\n- ${bens.length} bem(ns) — Total: R$ ${totalBens.toFixed(2)}\n`;
  }

  const dividas = Array.isArray(formulario.dividas_onus) ? formulario.dividas_onus : [];
  if (dividas.length > 0) {
    const totalDiv = dividas.reduce((s: number, d: any) => s + (parseFloat(d.valor) || 0), 0);
    ctx += `\n## Dívidas\n- ${dividas.length} dívida(s) — Total: R$ ${totalDiv.toFixed(2)}\n`;
  }

  const perfil = formulario.perfil_fiscal || {};
  if (Object.keys(perfil).length > 0) {
    ctx += `\n## Perfil Fiscal\n`;
    Object.entries(perfil).forEach(([k, v]) => {
      ctx += `- ${k}: ${v}\n`;
    });
  }

  return ctx;
}
