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

    const { declaracao_id, tipo, force_refresh, arquivo_path } = await req.json();

    if (!declaracao_id) throw new Error("declaracao_id é obrigatório");

    // Get user's escritorio
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("escritorio_id")
      .eq("id", user.id)
      .single();

    if (!usuario) throw new Error("Usuário não encontrado");

    // ============= MODO: validate_owner =============
    if (tipo === "validate_owner") {
      if (!arquivo_path) throw new Error("arquivo_path é obrigatório");

      const { data: decl } = await supabase
        .from("declaracoes")
        .select("clientes(nome, cpf)")
        .eq("id", declaracao_id)
        .eq("escritorio_id", usuario.escritorio_id)
        .single();

      if (!decl?.clientes) throw new Error("Declaração não encontrada");

      const cpfEsperado = onlyDigits((decl.clientes as { cpf?: string }).cpf || "");
      const nomeEsperado = (decl.clientes as { nome?: string }).nome || "";

      if (!cpfEsperado || cpfEsperado.length !== 11) {
        // Sem CPF cadastrado: não bloqueia
        return new Response(JSON.stringify({
          ok: true, skipped: true, motivo: "cliente_sem_cpf"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userMsg = await buildAnaliseCaixaMessage(
        supabase,
        arquivo_path,
        `Cliente esperado: ${nomeEsperado} - CPF ${cpfEsperado}`
      );

      const validatePrompt = `Você é um extrator de dados de declarações IRPF. Analise o PDF anexo (primeira página) e extraia o CPF e o nome do declarante titular.
Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem texto extra:
{"cpf":"00000000000","nome":"NOME COMPLETO"}
- CPF deve conter APENAS os 11 dígitos (sem pontos/traços).
- Se não encontrar CPF do titular, retorne {"cpf":null,"nome":null}.
- Não confunda CPF de dependentes/cônjuge com o do titular.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: validatePrompt },
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (!aiResp.ok) {
        const errTxt = await aiResp.text();
        console.error("Validate AI error:", errTxt);
        throw new Error("Falha ao validar PDF");
      }

      const aiData = await aiResp.json();
      const content: string = aiData.choices?.[0]?.message?.content || "";
      let extracted: { cpf?: string | null; nome?: string | null } = {};
      try {
        const cleaned = content.replace(/```json|```/g, "").trim();
        extracted = JSON.parse(cleaned);
      } catch {
        extracted = {};
      }

      const cpfPdf = onlyDigits(extracted.cpf || "");
      const nomePdf = (extracted.nome || "").trim();

      if (!cpfPdf || cpfPdf.length !== 11) {
        return new Response(JSON.stringify({
          ok: false,
          motivo: "unreadable",
          cpf_esperado: cpfEsperado,
          nome_esperado: nomeEsperado,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (cpfPdf !== cpfEsperado) {
        return new Response(JSON.stringify({
          ok: false,
          motivo: "mismatch",
          cpf_pdf: cpfPdf,
          nome_pdf: nomePdf,
          cpf_esperado: cpfEsperado,
          nome_esperado: nomeEsperado,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        ok: true,
        cpf_pdf: cpfPdf,
        nome_pdf: nomePdf,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // ============= FIM validate_owner =============

    // Check for existing analysis if not forcing refresh
    if (!force_refresh) {
      const { data: existing } = await supabase
        .from("declaracao_analises")
        .select("*")
        .eq("declaracao_id", declaracao_id)
        .eq("tipo", tipo || "analise")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Return existing as a stream-like or just JSON
        return new Response(JSON.stringify({ 
          choices: [{ delta: { content: existing.resultado_texto }, finish_reason: "stop" }],
          cached: true,
          updated_at: existing.updated_at
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get declaration + form data
    const { data: declaracao } = await supabase
      .from("declaracoes")
      .select("*, clientes(id, nome, cpf)")
      .eq("id", declaracao_id)
      .eq("escritorio_id", usuario.escritorio_id)
      .single();

    if (!declaracao) throw new Error("Declaração não encontrada");

    // Fetch Client Memories
    const { data: memorias } = await supabase
      .from("cliente_memorias")
      .select("conteudo, categoria")
      .eq("cliente_id", declaracao.clientes.id)
      .order("created_at", { ascending: false });

    const memoryContext = memorias?.length 
      ? `\n## MEMÓRIA SOBRE ESTE CLIENTE (Análises Anteriores)\n${memorias.map(m => `- [${m.categoria || 'Geral'}] ${m.conteudo}`).join('\n')}\n`
      : "";

    const { data: formulario } = await supabase
      .from("formulario_ir")
      .select("*")
      .eq("declaracao_id", declaracao_id)
      .single();

    const isAnaliseCaixa = tipo === "analise_caixa";

    // Build context for AI
    const context = buildContext(declaracao, formulario) + memoryContext;
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
        model: tipo === "deducoes" ? "google/gemini-2.5-flash" : "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      // ... error handling
      throw new Error("Erro na API de IA");
    }

    // Para salvar automaticamente, precisamos interceptar o stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        // Buffer SSE acumulado entre chunks para nunca quebrar uma linha JSON
        let sseBuffer = "";

        const processBuffer = (flush = false) => {
          let nl: number;
          while ((nl = sseBuffer.indexOf("\n")) !== -1) {
            let line = sseBuffer.slice(0, nl);
            sseBuffer = sseBuffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content || "";
              fullResponse += content;
            } catch (_e) {
              // Linha inválida — descarta sem corromper buffer
            }
          }
          if (flush && sseBuffer.trim().startsWith("data: ")) {
            const payload = sseBuffer.trim().slice(6);
            if (payload && payload !== "[DONE]") {
              try {
                const data = JSON.parse(payload);
                const content = data.choices?.[0]?.delta?.content || "";
                fullResponse += content;
              } catch (_e) { /* ignora */ }
            }
            sseBuffer = "";
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              processBuffer(true);
              if (fullResponse) {
                saveAnalysis(supabase, {
                  declaracao_id,
                  escritorio_id: usuario.escritorio_id,
                  tipo: tipo || "analise",
                  resultado_texto: fullResponse
                }).catch(err => console.error("Error saving analysis:", err));
              }
              controller.close();
              break;
            }

            controller.enqueue(value);
            sseBuffer += decoder.decode(value, { stream: true });
            processBuffer(false);
          }
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
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

// Tenta reparar JSON truncado/corrompido oriundo do streaming.
function repairTruncatedJson(raw: string): any {
  for (let end = raw.length; end > 50; end--) {
    const ch = raw[end - 1];
    if (ch !== ',' && ch !== '}' && ch !== ']' && ch !== '"' && ch !== ' ' && ch !== '\n') continue;
    let candidate = raw.slice(0, end).replace(/,\s*$/, '');
    let inString = false, escape = false;
    let openObj = 0, openArr = 0;
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{') openObj++;
      else if (c === '}') openObj--;
      else if (c === '[') openArr++;
      else if (c === ']') openArr--;
    }
    if (inString) candidate += '"';
    while (openArr-- > 0) candidate += ']';
    while (openObj-- > 0) candidate += '}';
    try { return JSON.parse(candidate); } catch { /* try shorter */ }
  }
  return null;
}

function safeNumber(n: unknown): number | null {
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

async function saveAnalysis(supabase: any, data: { declaracao_id: string; escritorio_id: string; tipo: string; resultado_texto: string }) {
  let jsonResult: any = null;
  const jsonMatch = data.resultado_texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    const raw = jsonMatch[1];
    try {
      jsonResult = JSON.parse(raw);
    } catch {
      try {
        jsonResult = JSON.parse(raw.replace(/,\s*([}\]])/g, '$1'));
      } catch {
        jsonResult = repairTruncatedJson(raw);
        if (jsonResult) console.warn("AI JSON was truncated; recovered via repair.");
        else console.warn("Could not parse JSON from AI response for saving");
      }
    }
  }

  const veredito = jsonResult?.conclusao?.veredito || jsonResult?.tipo || data.tipo;
  const resumo_visual = jsonResult ? {
    saldo: safeNumber(jsonResult.resumo?.saldo),
    estouro: typeof jsonResult.resumo?.estouro === 'boolean' ? jsonResult.resumo.estouro : null,
    total_origens: safeNumber(jsonResult.resumo?.total_origens),
    total_aplicacoes: safeNumber(jsonResult.resumo?.total_aplicacoes),
    riscos: jsonResult.riscos_count ? {
      alto: safeNumber(jsonResult.riscos_count.alto) ?? 0,
      medio: safeNumber(jsonResult.riscos_count.medio) ?? 0,
      baixo: safeNumber(jsonResult.riscos_count.baixo) ?? 0,
    } : null,
    patrimonio: jsonResult.patrimonio ? {
      anterior: safeNumber(jsonResult.patrimonio.anterior),
      atual: safeNumber(jsonResult.patrimonio.atual),
      variacao_valor: safeNumber(jsonResult.patrimonio.variacao_valor),
      variacao_perc: safeNumber(jsonResult.patrimonio.variacao_perc),
    } : null,
    veredito_msg: jsonResult.conclusao?.mensagem ?? null,
  } : null;

  const { error } = await supabase
    .from("declaracao_analises")
    .insert({
      declaracao_id: data.declaracao_id,
      escritorio_id: data.escritorio_id,
      tipo: data.tipo,
      resultado_texto: data.resultado_texto,
      resultado_json: jsonResult,
      veredito,
      resumo_visual,
      updated_at: new Date().toISOString()
    });

  if (error) console.error("Database error saving analysis:", error);

  if (jsonResult?.conclusao?.mensagem) {
    const { data: decl } = await supabase.from("declaracoes").select("cliente_id").eq("id", data.declaracao_id).single();
    if (decl?.cliente_id) {
      await supabase.from("cliente_memorias").insert({
        cliente_id: decl.cliente_id,
        escritorio_id: data.escritorio_id,
        categoria: 'fiscal_analysis',
        conteudo: `[${data.tipo}] Veredito: ${jsonResult.conclusao.veredito}. ${jsonResult.conclusao.mensagem}`
      });
    }
  }
}


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

### Estrutura obrigatória da resposta
1. Detalhamento textual técnico para cada risco.
2. Bloco JSON final (\`\`\`json) para dashboard:
\`\`\`json
{
  "tipo": "riscos",
  "riscos_count": { "alto": 0, "medio": 0, "baixo": 0 },
  "itens": [
    {"titulo": "...", "gravidade": "alta", "codigo": "010", "valor_estimado": 0.0}
  ]
}
\`\`\`

Para CADA risco, estruture no texto:
... (mantém o resto)
- DARF cód 0211 com total
6. **Base legal** (RIR/2018, Lei 9.250/95, IN RFB 2.077/22, IN RFB 1.500/14)

Cobertura mínima de verificação:
...
- Bens exterior Lei 14.754/23 não declarados

Anti-padrões: retificar antes de entender pendência | apresentar recibo sem CPF |
demorar > 30 dias após intimação (multa 75%) | pagar DARF sem retificar declaração.`;
  }

  if (tipo === "analise_caixa") {
    return base + `

## TAREFA: Análise de caixa pré-transmissão (PDF anexo)
Você está revisando o PDF da declaração de IRPF ANTES de transmitir à RFB. Sua missão:
identificar estouro de caixa, inconsistências patrimoniais e riscos.

### Estrutura obrigatória da resposta (360º Visual)
Sua resposta deve ter duas partes:
1. Uma análise textual detalhada, organizada por temas (Identificação, Origens vs Aplicações, Evolução Patrimonial, Riscos, Recomendações).
2. Um bloco JSON final (fenced com \`\`\`json) contendo os dados estruturados para os gráficos.

#### Parte 1: Detalhamento Temático
- Use cabeçalhos claros (H2 e H3).
- Cite SEMPRE a ficha e o valor exato extraído (ex.: "Ficha Bens e Direitos linha 4, código 11 imóvel R$ 350.000,00").
- Use 🚨 para risco alto, ⚠️ para médio, ✅ para item verificado ok.

#### Parte 2: Dados Estruturados (JSON)
No final da resposta, inclua EXATAMENTE este formato:
\`\`\`json
{
  "resumo": {
    "total_origens": 0.0,
    "total_aplicacoes": 0.0,
    "saldo": 0.0,
    "estouro": false,
    "percentual_utilizacao": 0.0
  },
  "origens": [
    {"label": "Rendimentos Tributáveis", "valor": 0.0},
    {"label": "Rendimentos Isentos", "valor": 0.0},
    {"label": "Alienações/Dívidas", "valor": 0.0}
  ],
  "aplicacoes": [
    {"label": "Δ Patrimonial", "valor": 0.0},
    {"label": "Impostos/Despesas", "valor": 0.0},
    {"label": "Dívidas Quitadas", "valor": 0.0}
  ],
  "patrimonio": {
    "anterior": 0.0,
    "atual": 0.0,
    "variacao_valor": 0.0,
    "variacao_perc": 0.0
  },
  "riscos_count": { "alto": 0, "medio": 0, "baixo": 0 },
  "detalhes": {
    "saldo": "Explicação curta sobre o saldo...",
    "patrimonio": "Explicação sobre a evolução...",
    "risco": "Por que o risco foi calculado assim...",
    "fluxo": "Análise rápida das barras de fluxo...",
    "origens": "Onde está a maior concentração de renda...",
    "analise_tecnica": "Resumo do que foi priorizado..."
  },
  "secoes_analise": [
    {
      "id": "identificacao",
      "titulo": "Identificação e Conformidade Cadastral",
      "icone": "user",
      "status": "ok" | "atencao" | "critico",
      "resumo": "Frase curta de 1 linha (máx 120 chars).",
      "pontos": ["Item objetivo curto 1", "Item objetivo curto 2"],
      "tooltip": "Explicação técnica do que foi verificado nesta seção"
    },
    {
      "id": "fluxo_caixa",
      "titulo": "Origens vs Aplicações",
      "icone": "wallet",
      "status": "ok",
      "resumo": "...",
      "pontos": ["..."],
      "tooltip": "..."
    },
    {
      "id": "patrimonio",
      "titulo": "Evolução Patrimonial",
      "icone": "trending",
      "status": "atencao",
      "resumo": "...",
      "pontos": ["..."],
      "tooltip": "..."
    },
    {
      "id": "riscos",
      "titulo": "Riscos de Malha Fina",
      "icone": "shield",
      "status": "critico",
      "resumo": "...",
      "pontos": ["..."],
      "tooltip": "..."
    }
  ],
  "recomendacoes": [
    {
      "prioridade": "alta" | "media" | "baixa",
      "acao": "Ação objetiva curta (até 80 chars)",
      "motivo": "Justificativa técnica curta",
      "base_legal": "RIR/2018 art X"
    }
  ],
  "conclusao": {
    "veredito": "transmitir" | "ajustar" | "nao_transmitir",
    "mensagem": "Frase única de fechamento (máx 200 chars)"
  }
}
\`\`\`

REGRAS DE OURO PARA O JSON:
- Pontos devem ser CURTOS, objetivos, sem parágrafos. Use bullets de 1 linha.
- Use ícones válidos: user, wallet, trending, shield, receipt, building, scale.
- Status: "ok" (verde ✅), "atencao" (amarelo ⚠️), "critico" (vermelho 🚨).
- Recomendações: máximo 6 itens, ordenadas por prioridade.
- A interface vai renderizar TUDO visualmente. NÃO repita os mesmos dados em texto markdown longo.
- Use markdown apenas se algo NÃO couber no JSON estruturado (ex: cálculo detalhado).


Regras para os cálculos:
- **Origens**: Somatório de rendimentos (todos), alienações e dívidas contraídas.
- **Aplicações**: Δ Bens (Ano Atual - Ano Anterior, se positivo) + Despesas pagas + Imposto pago + Dívidas quitadas.
- **Saldo**: Origens - Aplicações. Se Saldo < 0, então estouro = true.

Siga rigorosamente a base legal e as tabelas de 2026 fornecidas.`;
  }

  // tipo padrão: "analise" (geral)
  return base + `

## TAREFA: Análise fiscal completa do contribuinte
Você atua como agente "irpf-declaracao-completa".

### Estrutura obrigatória da resposta
1. Resumo da situação fiscal, recomendação de regime, deduções e riscos.
2. Bloco JSON final (\`\`\`json) para dashboard:
\`\`\`json
{
  "tipo": "analise",
  "regime": "simplificada" | "completa",
  "economia_estimada": 0.0,
  "rendimento_tributavel": 0.0,
  "comparativo": {
    "simplificada": {"base": 0.0, "ir": 0.0},
    "completa": {"base": 0.0, "ir": 0.0}
  },
  "riscos_count": { "alto": 0, "medio": 0, "baixo": 0 }
}
\`\`\`

Entregue no texto:
**1. Resumo da situação fiscal**
...
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
