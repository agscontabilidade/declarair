import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BRASIL_API_URL = 'https://brasilapi.com.br/api';

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

    console.log('[consulta-rfb] Consultando CPF:', cpfLimpo.substring(0, 3) + '***');

    // Consultar BrasilAPI - CPF endpoint
    const rfbResponse = await fetch(`${BRASIL_API_URL}/cpf/v1/${cpfLimpo}`);

    let rfbData: Record<string, unknown>;
    let situacao: string;
    let interpretacao: Record<string, unknown>;

    if (rfbResponse.ok) {
      rfbData = await rfbResponse.json();
      situacao = (rfbData.situacao as string) || 'Desconhecida';
      interpretacao = interpretarResultado(rfbData, cpfLimpo);
    } else if (rfbResponse.status === 404) {
      // CPF não encontrado - tratar como situação desconhecida
      rfbData = { erro: 'CPF não encontrado', status: 404 };
      situacao = 'Não encontrado';
      interpretacao = {
        situacao_cadastral: 'Não encontrado',
        risco_malha_fina: 'medio',
        alertas: ['⚠️ CPF não localizado na base da Receita Federal. Verifique se o número está correto.'],
        nome: 'Não informado',
        cpf_consultado: cpfLimpo,
      };
    } else {
      // Erro da API - serviço indisponível
      rfbData = { erro: `API retornou status ${rfbResponse.status}` };
      situacao = 'Erro na consulta';
      interpretacao = {
        situacao_cadastral: 'Indisponível',
        risco_malha_fina: 'desconhecido',
        alertas: ['⚠️ Serviço da Receita Federal temporariamente indisponível. Tente novamente mais tarde.'],
        nome: 'Indisponível',
        cpf_consultado: cpfLimpo,
      };
    }

    // Criar cliente Supabase com token do usuário
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Determinar status_rfb baseado na interpretação
    const risco = interpretacao.risco_malha_fina as string;
    const statusRfb = risco === 'alto' ? 'em_malha' 
      : risco === 'medio' ? 'com_pendencias'
      : risco === 'baixo' ? 'processada'
      : 'em_processamento';

    // Atualizar registro existente se consulta_id fornecido
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

function interpretarResultado(dados: Record<string, unknown>, cpf: string) {
  const situacao = ((dados.situacao as string) || '').toLowerCase();
  const alertas: string[] = [];

  if (situacao.includes('suspens') || situacao.includes('cancel')) {
    alertas.push('⚠️ CPF com situação irregular na Receita Federal');
  } else if (situacao.includes('pendente') || situacao.includes('nulo')) {
    alertas.push('⚠️ CPF com pendências cadastrais');
  } else if (situacao.includes('titular falecido')) {
    alertas.push('🚨 CPF de titular falecido - Não pode declarar IR');
  }

  const riscoMalhaFina = alertas.length > 0 
    ? (alertas.some(a => a.includes('🚨')) ? 'alto' : 'medio')
    : 'baixo';

  return {
    situacao_cadastral: dados.situacao || 'Desconhecida',
    risco_malha_fina: riscoMalhaFina,
    alertas,
    nome: dados.nome || 'Não informado',
    data_nascimento: dados.nascimento || 'Não informada',
    cpf_consultado: cpf,
  };
}
