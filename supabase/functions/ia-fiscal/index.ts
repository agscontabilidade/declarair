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

    const isAnaliseCaixa = tipo === "analise_caixa";

    // Build context for AI
    const context = buildContext(declaracao, formulario);
    const systemPrompt = getSystemPrompt(tipo || "analise");

    // Para análise de caixa, anexa o PDF da declaração como imagem
    const userMessage: unknown = isAnaliseCaixa && declaracao.arquivo_analise_caixa_url
      ? await buildAnaliseCaixaMessage(supabase, declaracao.arquivo_analise_caixa_url, context)
      : context;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Roteamento por tipo: Pro p/ tarefas com PDF + cálculo + raciocínio jurídico-fiscal,
        // Flash p/ sugestões leves (deduções).
        model: tipo === "deducoes"
          ? "google/gemini-2.5-flash"
          : "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
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

// ===== Tabela 2026 IRPF e limites de dedução (single source of truth) =====
// Quando a RFB publicar IN nova, atualizar AQUI.
const BASE_2026 = `
## TABELA PROGRESSIVA IRPF 2026 (anual)
Faixa anual                         Alíquota   Parcela a deduzir
até R$ 28.125,84                    0%         R$ 0,00
R$ 28.125,85 a R$ 33.879,80         7,5%       R$ 2.109,44
R$ 33.879,81 a R$ 45.012,60         15%        R$ 4.650,43
R$ 45.012,61 a R$ 55.976,16         22,5%      R$ 8.026,38
acima de R$ 55.976,16               27,5%      R$ 10.824,85

## TABELA PROGRESSIVA MENSAL (carnê-leão / IRRF folha 2026)
até R$ 2.428,80                     0%         R$ 0,00
R$ 2.428,81 a R$ 2.826,65           7,5%       R$ 182,16
R$ 2.826,66 a R$ 3.751,05           15%        R$ 394,16
R$ 3.751,06 a R$ 4.664,68           22,5%      R$ 675,49
acima de R$ 4.664,68                27,5%      R$ 908,73

## DEDUÇÕES E LIMITES (2026)
- Dependente: R$ 2.275,08/ano (R$ 189,59/mês) — CPF obrigatório
- Desconto simplificado: R$ 16.754,34/ano (alternativa às deduções legais)
- Educação: R$ 3.561,50/ano por pessoa (somente regime regular: ensino infantil, fundamental, médio, superior, técnico, pós/mestrado/doutorado — NÃO inclui idiomas, MBA livre, cursos preparatórios)
- Despesas médicas: SEM LIMITE — exige recibo com CPF do paciente, CRM/CRO, valor, data
- PGBL: até 12% da renda tributável (com vínculo previdência oficial)
- Pensão alimentícia: integral SE houver decisão judicial/escritura pública
- Limite renda dependente pai/mãe: R$ 23.456,38/ano

## ALÍQUOTAS GANHO DE CAPITAL (Lei 13.259/2016)
até R$ 5.000.000        15%
R$ 5M a R$ 10M          17,5%
R$ 10M a R$ 30M         20%
acima de R$ 30M         22,5%

## ISENÇÕES GANHO CAPITAL (imóvel)
- Único imóvel até R$ 440.000 (Lei 9.250/95 art. 23) — sem outra isenção nos últimos 5 anos
- Reinvestimento residencial em 180 dias (Lei 11.196/05 art. 39)
- Imóvel adquirido até 1969 (RIR/2018 art. 132 II) — isenção total
- Pequeno imóvel rural até 50 ha (Lei 9.393/96)
- Veículo de uso pessoal < R$ 35.000 (Lei 9.250/95 art. 22)

## DARFs RELEVANTES
- 0190 — Carnê-leão (rendimento de PF/exterior, vto último dia útil mês+1)
- 0211 — IRPF anual ajuste (cota única em maio ou até 8 cotas, mín R$ 50)
- 4600 — Ganho de capital (imóvel, ações fora B3, cripto > R$ 35k/mês — vto mês+1)
- 6015 — Renda variável B3 mensal (swing > R$ 20k/mês, day trade, FII venda)

## CÓDIGOS DE PENDÊNCIA (e-CAC > Meu IRPF)
001 saldo a pagar | 002 restituição | 008 pagto a PJ
010 RENDIMENTO OMITIDO (DIRF/R-4010 do pagador não bate)
015 DEDUÇÃO COM SAÚDE indevida
050 GANHO DE CAPITAL não declarado
060 RENDA VARIÁVEL B3
070 DEPENDENTE (duplicado, > 24 anos sem ser estudante, pai/mãe acima do limite)
080 BENS NO EXTERIOR (Lei 14.754/2023)

REGRA DE OURO: nunca invente valor de tabela ou base legal. Se incerto, escreva
"verificar IN RFB vigente" em vez de chutar. Cite SEMPRE a base legal (RIR/2018,
Lei 9.250/95, IN RFB 2.077/22, Lei 13.259/16, Lei 14.754/23, Lei 11.196/05).
Use formato BRL: R$ 1.234,56.
`;

function getSystemPrompt(tipo: string): string {
  const base = `Você é um contador brasileiro sênior, 12 anos de experiência em IRPF.
Atende escritórios e contribuintes diretos. Responde em PT-BR, técnico e direto.
${BASE_2026}`;

  if (tipo === "deducoes") {
    return base + `

## TAREFA: Sugerir deduções faltantes
Analise o perfil do contribuinte e sugira deduções que podem estar sendo perdidas.
Para CADA sugestão, forneça:
- Tipo da dedução + base legal
- Valor estimado de economia em IR
- Documentos exigidos (com requisitos: CPF do paciente, NF, decisão judicial, etc.)
- Limite legal aplicável (educação por pessoa, PGBL 12%, etc.)

Anti-padrões a sinalizar:
- Recibo médico sem CPF do paciente (RFB rejeita)
- Plano de saúde com dependente que não consta na declaração
- Educação fora do regime regular (idiomas, MBA livre)
- PGBL sem vínculo com previdência oficial
- Pensão sem decisão judicial`;
  }

  if (tipo === "riscos") {
    return base + `

## TAREFA: Diagnóstico preventivo de malha fina
Você atua como agente "malha-fina-pf-diagnostico". Identifique riscos ANTES da transmissão
ou diagnostique pendências já intimadas pelo e-CAC.

Para CADA risco, estruture:
1. **Código provável** (010/015/050/060/070/080 — ver tabela acima)
2. **Causa típica** (ex.: "RPA de PJ esquecido — pagador informa em DIRF/R-4010")
3. **Gravidade** (baixa/média/alta — alta = > R$ 5.000 ou divergência clara com DIRF)
4. **Decisão sugerida**: RETIFICAR (cliente concorda) × DEFENDER (tem documento)
5. **Cálculo do ajuste** (quando aplicável):
   - IR adicional usando tabela 2026
   - Multa: 0,33%/dia, máx 20% do imposto
   - Selic acumulada do período
   - DARF cód 0211 com total
6. **Base legal** (RIR/2018, Lei 9.250/95, IN RFB 2.077/22, IN RFB 1.500/14)

Cobertura mínima de verificação:
- Rendimento omitido (DIRF/R-4010, multi-emprego, RPA, JCP, dividendos, aluguel PJ)
- Dedução indevida (saúde sem CPF, educação > limite, PGBL > 12%, pensão sem judicial)
- Dependente (em duas declarações, filho > 24 sem universidade, pai/mãe > R$ 23.456,38)
- Ganho de capital sem GCAP (imóvel, ações fora B3, cripto > R$ 35k/mês)
- Renda variável B3 sem DARF 6015 (swing > R$ 20k/mês, day trade)
- Carnê-leão omitido (PF que recebeu de PF/exterior sem DARF 0190)
- Bens exterior Lei 14.754/23 não declarados

Anti-padrões: retificar antes de entender pendência | apresentar recibo sem CPF |
demorar > 30 dias após intimação (multa 75%) | pagar DARF sem retificar declaração.`;
  }

  if (tipo === "analise_caixa") {
    return base + `

## TAREFA: Análise de caixa pré-transmissão (PDF anexo)
Você está revisando o PDF da declaração de IRPF ANTES de transmitir à RFB. Sua missão:
identificar estouro de caixa, inconsistências patrimoniais e riscos.

Atue como auditor experiente. Leia o PDF página a página. Cite SEMPRE a ficha e o valor
exato extraído (ex.: "Ficha Bens e Direitos linha 4, código 11 imóvel R$ 350.000,00").

### Estrutura obrigatória da resposta

**1. Identificação**
- Nome, CPF, ano-base, fontes detectadas no PDF (qtd informes IR, qtd bens, qtd deps)

**2. Origens × Aplicações** (FAÇA A CONTA, mostre o passo a passo)

\`\`\`
ORIGENS
+ Rendimentos tributáveis recebidos PJ ........ R$ ____  (Ficha __)
+ Rendimentos PF / exterior (carnê-leão) ...... R$ ____
+ Rendimentos isentos e não tributáveis ....... R$ ____
+ Rendimentos tributação exclusiva (13º, JCP). R$ ____
+ Alienações de bens (valor recebido) ......... R$ ____
+ Dívidas contraídas no ano ................... R$ ____
= TOTAL ORIGENS ............................... R$ ____

APLICAÇÕES
+ Variação patrimonial positiva (Δ Bens) ...... R$ ____
+ Despesas dedutíveis pagas (saúde+educ+pensão) R$ ____
+ Imposto pago no ano (IRRF + carnês + DARFs) . R$ ____
+ Dívidas quitadas no ano ..................... R$ ____
= TOTAL APLICAÇÕES ............................ R$ ____

SALDO = ORIGENS − APLICAÇÕES = R$ ____
\`\`\`

Se Aplicações > Origens → 🚨 **ESTOURO DE CAIXA de R$ ____** — explicar.
Se Saldo positivo grande → indicar como sobra (poupança? não declarada?).

**3. Evolução Patrimonial**
- Patrimônio em 31/12 do ano anterior vs ano atual (variação absoluta + %)
- Aquisições significativas (cite ficha + valor + origem provável)

**4. Riscos por categoria fiscal** (use os códigos de pendência):
   a) Rendimento omitido (cód 010): conferir com DIRF/R-4010 prováveis
   b) Dedução indevida (cód 015): saúde sem CPF? educação > R$ 3.561,50/pessoa? PGBL > 12%?
   c) Dependente (cód 070): duplicado? > 24 sem universidade? pais > R$ 23.456,38?
   d) Ganho de capital (cód 050): venda de bem com GCAP? isenção R$ 440k aplicada corretamente? redutores Lei 11.196/05 (imóveis pré-2017)?
   e) Renda variável (cód 060): swing > R$ 20k/mês com DARF 6015? day trade? FII em Bens? cripto > R$ 35k/mês com DARF 4600?
   f) Carnê-leão (cód 010): aluguel/serviço de PF sem DARF 0190?
   g) Bens exterior (cód 080): Lei 14.754/23, marcação a mercado, alíquota 15%?

Para cada risco: gravidade + base legal + ação corretiva concreta.

**5. Recomendações ao Contador** (lista numerada, ações executáveis)
   - Ex.: "Solicitar ao cliente recibo médico de R$ X com CPF do paciente"
   - Ex.: "Abrir GCAP para venda do imóvel R$ Y — verificar isenção art. 23 Lei 9.250/95"
   - Ex.: "Lançar DARF 0190 retroativo para aluguel jan-dez (Selic + multa)"

**6. Checklist final antes de transmitir**
\`\`\`
[ ] Origens × Aplicações fecha ou estouro explicado
[ ] Dependentes com CPF e dentro do limite
[ ] Médicas com CPF do paciente
[ ] Educação dentro do limite por pessoa
[ ] Bens em 31/12 batem com extrato/RENAVAM/escritura
[ ] Dívidas > R$ 5.000 declaradas
[ ] Ganho capital com GCAP + DARF 4600
[ ] Renda variável com DARF 6015 mensal
[ ] Bens exterior Lei 14.754/23
[ ] Simplificada × Completa simulada
\`\`\`

Regras:
- Sempre indique a ficha e o valor extraído do PDF — NUNCA invente número
- Sempre cite base legal — NUNCA afirme regra sem amparo
- Se um valor não estiver legível no PDF, escreva "[ilegível, conferir]"
- Use 🚨 para risco alto, ⚠️ para médio, ✅ para item verificado ok`;
  }

  // tipo padrão: "analise" (geral)
  return base + `

## TAREFA: Análise fiscal completa do contribuinte
Você atua como agente "irpf-declaracao-completa". Entregue:

**1. Resumo da situação fiscal**
- Perfil de renda (qtd fontes, faixa anual estimada)
- Composição patrimonial
- Status de documentação

**2. Recomendação Simplificada × Completa** — FAÇA A CONTA, não chute:
\`\`\`
RENDIMENTO TRIBUTÁVEL ANUAL: R$ ____

OPÇÃO A — SIMPLIFICADA
Desconto: R$ 16.754,34 (ou 20% da renda, o menor)
Base = ____   IR = ____

OPÇÃO B — COMPLETA
Deduções legais: R$ ____ (médicas + educ + pensão + PGBL + dependentes × R$ 2.275,08)
Base = ____   IR = ____

ESCOLHER: ____ (economia de R$ ____)
\`\`\`

**3. Deduções aproveitadas e otimizações**
- Cite cada dedução com base legal e limite
- Identifique deduções perdidas (com como capturar)

**4. Riscos de malha fina** (códigos 010/015/050/060/070/080 — ver acima)

**5. Plano de pagamento ou restituição**
- Saldo a pagar: cota única até maio OU até 8 cotas (mín R$ 50) — DARF 0211
- Restituição: ordem de prioridade RFB (idosos, PNE, professores, etc.)

**6. Orientações para o próximo ano** (carnê-leão mensal, GCAP, DARF 6015, etc.)

Cite SEMPRE base legal: RIR/2018, Lei 9.250/95, IN RFB 2.077/22, Lei 14.754/23.`;
}

function buildContext(declaracao: { ano_base: number; status: string; tipo_resultado?: string; valor_resultado?: number; clientes: { nome: string } }, formulario: Record<string, unknown> | null | undefined): string {
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
  const totalRend = rendEmp.reduce((s: number, r: { rendimento_bruto: string }) => s + (parseFloat(r.rendimento_bruto) || 0), 0);
  ctx += `\n## Rendimentos\n- Emprego: R$ ${totalRend.toFixed(2)} (${rendEmp.length} fonte(s))\n`;

  const rendAut = Array.isArray(formulario.rendimentos_autonomo) ? formulario.rendimentos_autonomo : [];
  if (rendAut.length > 0) {
    const totalAut = rendAut.reduce((s: number, r: { valor: string }) => s + (parseFloat(r.valor) || 0), 0);
    ctx += `- Autônomo: R$ ${totalAut.toFixed(2)}\n`;
  }

  const rendAlug = Array.isArray(formulario.rendimentos_aluguel) ? formulario.rendimentos_aluguel : [];
  if (rendAlug.length > 0) {
    const totalAlug = rendAlug.reduce((s: number, r: { valor_mensal: string }) => s + (parseFloat(r.valor_mensal) || 0) * 12, 0);
    ctx += `- Aluguel: R$ ${totalAlug.toFixed(2)}/ano\n`;
  }

  const medicas = Array.isArray(formulario.despesas_medicas) ? formulario.despesas_medicas : [];
  const totalMed = medicas.reduce((s: number, d: { valor: string }) => s + (parseFloat(d.valor) || 0), 0);
  ctx += `\n## Deduções\n- Despesas Médicas: R$ ${totalMed.toFixed(2)} (${medicas.length} item(s))\n`;

  const educ = Array.isArray(formulario.despesas_educacao) ? formulario.despesas_educacao : [];
  const totalEduc = educ.reduce((s: number, d: { valor: string }) => s + (parseFloat(d.valor) || 0), 0);
  ctx += `- Educação: R$ ${totalEduc.toFixed(2)} (${educ.length} item(s))\n`;

  const prev = formulario.previdencia_privada || {};
  if (prev.valor) ctx += `- Previdência Privada: R$ ${prev.valor} (${prev.tipo || "N/I"})\n`;

  const bens = Array.isArray(formulario.bens_direitos) ? formulario.bens_direitos : [];
  if (bens.length > 0) {
    const totalBens = bens.reduce((s: number, b: { valor: string }) => s + (parseFloat(b.valor) || 0), 0);
    ctx += `\n## Bens e Direitos\n- ${bens.length} bem(ns) — Total: R$ ${totalBens.toFixed(2)}\n`;
  }

  const dividas = Array.isArray(formulario.dividas_onus) ? formulario.dividas_onus : [];
  if (dividas.length > 0) {
    const totalDiv = dividas.reduce((s: number, d: { valor: string }) => s + (parseFloat(d.valor) || 0), 0);
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

// Constrói mensagem multimodal anexando o PDF da declaração para análise de caixa.
// O Gemini aceita PDFs diretamente via input do tipo file/document através de URL pública assinada.
async function buildAnaliseCaixaMessage(
  supabase: ReturnType<typeof createClient>,
  arquivoPath: string,
  context: string,
): Promise<unknown> {
  // Gera URL assinada (válida por 10 min) para o Gemini conseguir baixar o PDF
  const { data: signed, error: signErr } = await supabase.storage
    .from("documentos-clientes")
    .createSignedUrl(arquivoPath, 600);

  if (signErr || !signed?.signedUrl) {
    console.error("Erro ao gerar signed URL para análise de caixa:", signErr);
    return `${context}\n\n⚠️ Não foi possível acessar o PDF da declaração. Faça a análise apenas com base no contexto acima.`;
  }

  // Baixa o PDF e converte para base64 (formato multimodal aceito pelo gateway)
  try {
    const pdfRes = await fetch(signed.signedUrl);
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
    const buffer = await pdfRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return [
      {
        type: "text",
        text:
          `${context}\n\n## Tarefa\nAnalise o PDF anexo da declaração de IRPF deste contribuinte. ` +
          `Identifique estouro de caixa, evolução patrimonial e riscos antes da transmissão à RFB.`,
      },
      {
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${base64}` },
      },
    ];
  } catch (e) {
    console.error("Erro ao baixar/codificar PDF para análise de caixa:", e);
    return `${context}\n\n⚠️ Falha ao processar o PDF. Faça a análise apenas com base no contexto acima.`;
  }
}
