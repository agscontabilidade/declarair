import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cpf, consulta_id } = await req.json();

    if (!cpf) {
      throw new Error('CPF é obrigatório');
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos');
    }

    // Validate CPF algorithmically
    if (!validarCPF(cpfLimpo)) {
      throw new Error('CPF inválido (dígitos verificadores incorretos)');
    }

    console.log('[consulta-rfb] Consultando CPF:', cpfLimpo.substring(0, 3) + '***');

    let situacao: string;
    let interpretacao: Record<string, unknown>;
    let rfbData: Record<string, unknown>;

    // Try multiple endpoints to get CPF status
    const result = await tentarConsultaCPF(cpfLimpo);

    if (result.success) {
      rfbData = result.data;
      situacao = (rfbData.situacao as string) || 'Regular';
      interpretacao = interpretarResultado(rfbData, cpfLimpo);
    } else {
      // All APIs unavailable — perform algorithmic validation only
      // CPF passed validation, so it's structurally valid
      rfbData = {
        cpf: cpfLimpo,
        validacao_algoritmica: true,
        nota: 'Consulta à Receita Federal indisponível no momento',
      };
      situacao = 'Não consultado (API indisponível)';
      interpretacao = {
        situacao_cadastral: 'CPF válido (verificação algorítmica)',
        risco_malha_fina: 'desconhecido',
        alertas: [
          'ℹ️ O serviço de consulta à Receita Federal está temporariamente indisponível.',
          '✅ CPF é válido algoritmicamente (dígitos verificadores corretos).',
          '💡 Para verificar a situação cadastral completa, acesse: https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao',
        ],
        nome: 'Não disponível (consulta externa indisponível)',
        cpf_consultado: cpfLimpo,
      };
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Determine status_rfb
    const risco = interpretacao.risco_malha_fina as string;
    const statusRfb = risco === 'alto' ? 'em_malha'
      : risco === 'medio' ? 'com_pendencias'
      : risco === 'baixo' ? 'processada'
      : 'em_processamento';

    // Update existing record if consulta_id provided
    if (consulta_id) {
      const { error: updateError } = await supabase
        .from('malha_fina_consultas')
        .update({
          status_rfb: statusRfb,
          ultimo_resultado: (interpretacao.alertas as string[])?.length > 0
            ? (interpretacao.alertas as string[])[0]
            : `Situação cadastral: ${situacao}`,
          ultima_consulta: new Date().toISOString(),
          resultado_json: { ...rfbData, interpretacao },
          situacao_cadastral: situacao,
          data_consulta: new Date().toISOString(),
        })
        .eq('id', consulta_id);

      if (updateError) {
        console.error('[consulta-rfb] Erro ao atualizar:', updateError);
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, interpretacao, dados_rfb: rfbData, status_rfb: statusRfb }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar CPF';
    console.error('[consulta-rfb] Erro:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Try multiple API sources for CPF consultation
async function tentarConsultaCPF(cpf: string): Promise<{ success: boolean; data: Record<string, unknown> }> {
  // Attempt 1: BrasilAPI CPF v1
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cpf}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    // Consume body to avoid leak
    await res.text();
  } catch (e) {
    console.log('[consulta-rfb] BrasilAPI CPF falhou:', e);
  }

  // Attempt 2: ReceitaWS (public endpoint, may also be unavailable)
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cpf/${cpf}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.status || data.status !== 'ERROR') {
        return { success: true, data: { ...data, situacao: data.situacao || data.status || 'Regular' } };
      }
    }
    await res.text();
  } catch (e) {
    console.log('[consulta-rfb] ReceitaWS falhou:', e);
  }

  return { success: false, data: {} };
}

// Algorithmic CPF validation (mod 11)
function validarCPF(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false; // All same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

function interpretarResultado(dados: Record<string, unknown>, cpf: string) {
  const situacao = ((dados.situacao as string) || '').toLowerCase();
  const alertas: string[] = [];

  if (situacao.includes('regular')) {
    alertas.push('✅ CPF regular na Receita Federal');
  } else if (situacao.includes('suspens') || situacao.includes('cancel')) {
    alertas.push('🚨 CPF com situação irregular na Receita Federal');
  } else if (situacao.includes('pendente') || situacao.includes('nulo')) {
    alertas.push('⚠️ CPF com pendências cadastrais');
  } else if (situacao.includes('titular falecido')) {
    alertas.push('🚨 CPF de titular falecido - Não pode declarar IR');
  } else {
    alertas.push(`ℹ️ Situação cadastral: ${dados.situacao || 'Não informada'}`);
  }

  const riscoMalhaFina = alertas.some(a => a.includes('🚨')) ? 'alto'
    : alertas.some(a => a.includes('⚠️')) ? 'medio'
    : 'baixo';

  return {
    situacao_cadastral: dados.situacao || 'Regular',
    risco_malha_fina: riscoMalhaFina,
    alertas,
    nome: dados.nome || 'Não informado',
    data_nascimento: dados.nascimento || 'Não informada',
    cpf_consultado: cpf,
  };
}
