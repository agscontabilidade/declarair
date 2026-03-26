import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CONTA_AZUL_API_URL = 'https://api.contaazul.com/v1';
const CONTA_AZUL_AUTH_URL = 'https://api.contaazul.com/oauth2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function renovarToken(supabase: ReturnType<typeof createClient>, config: Record<string, unknown>) {
  const response = await fetch(`${CONTA_AZUL_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.refresh_token_encrypted as string,
      client_id: config.client_id as string,
      client_secret: config.client_secret_encrypted as string,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[contaazul-sync] Token refresh failed:', errorBody);
    throw new Error('Erro ao renovar token do Conta Azul');
  }

  const tokens = await response.json();

  await supabase
    .from('integracoes_contaazul')
    .update({
      access_token_encrypted: tokens.access_token,
      refresh_token_encrypted: tokens.refresh_token,
      token_expira_em: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', config.id as string);

  return tokens.access_token;
}

async function getAccessToken(supabase: ReturnType<typeof createClient>, config: Record<string, unknown>): Promise<string> {
  if (config.token_expira_em && new Date(config.token_expira_em as string) > new Date()) {
    return config.access_token_encrypted as string;
  }
  return await renovarToken(supabase, config);
}

async function sincronizarClientes(supabase: ReturnType<typeof createClient>, escritorioId: string, accessToken: string) {
  const response = await fetch(`${CONTA_AZUL_API_URL}/customers?size=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[contaazul-sync] Fetch customers failed:', errorBody);
    throw new Error('Erro ao buscar clientes do Conta Azul');
  }

  const clientesCA = await response.json();
  let importados = 0;
  let atualizados = 0;

  for (const clienteCA of clientesCA) {
    if (!clienteCA.document || clienteCA.document.length < 11) continue;

    const cpfLimpo = clienteCA.document.replace(/\D/g, '');

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('escritorio_id', escritorioId)
      .eq('cpf', cpfLimpo)
      .maybeSingle();

    const dadosCliente = {
      nome: clienteCA.name,
      email: clienteCA.email || null,
      telefone: clienteCA.phone?.number || null,
      conta_azul_id: clienteCA.id,
    };

    if (clienteExistente) {
      await supabase
        .from('clientes')
        .update(dadosCliente)
        .eq('id', clienteExistente.id);
      atualizados++;
    } else {
      await supabase
        .from('clientes')
        .insert({
          ...dadosCliente,
          escritorio_id: escritorioId,
          cpf: cpfLimpo,
        });
      importados++;
    }
  }

  await supabase
    .from('integracoes_contaazul')
    .update({ ultima_sincronizacao: new Date().toISOString() })
    .eq('escritorio_id', escritorioId);

  return { importados, atualizados, total: clientesCA.length };
}

async function exportarCliente(supabase: ReturnType<typeof createClient>, clienteId: string, accessToken: string) {
  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single();

  if (error || !cliente) throw new Error('Cliente não encontrado');

  const method = cliente.conta_azul_id ? 'PUT' : 'POST';
  const endpoint = cliente.conta_azul_id
    ? `${CONTA_AZUL_API_URL}/customers/${cliente.conta_azul_id}`
    : `${CONTA_AZUL_API_URL}/customers`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: cliente.nome,
      document: cliente.cpf,
      email: cliente.email,
      person_type: 'NATURAL',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[contaazul-sync] Export customer failed:', errorBody);
    throw new Error('Erro ao exportar cliente para Conta Azul');
  }

  const clienteCA = await response.json();

  await supabase
    .from('clientes')
    .update({ conta_azul_id: clienteCA.id })
    .eq('id', clienteId);

  return { conta_azul_id: clienteCA.id };
}

async function obterAuthUrl(config: Record<string, unknown>, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: config.client_id as string,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'sales',
  });
  return `${CONTA_AZUL_AUTH_URL}/authorize?${params.toString()}`;
}

async function trocarCodigoPorToken(
  supabase: ReturnType<typeof createClient>,
  config: Record<string, unknown>,
  code: string,
  redirectUri: string,
) {
  const response = await fetch(`${CONTA_AZUL_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.client_id as string,
      client_secret: config.client_secret_encrypted as string,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[contaazul-sync] Token exchange failed:', errorBody);
    throw new Error('Erro ao trocar código por token');
  }

  const tokens = await response.json();

  await supabase
    .from('integracoes_contaazul')
    .update({
      access_token_encrypted: tokens.access_token,
      refresh_token_encrypted: tokens.refresh_token,
      token_expira_em: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      ativo: true,
    })
    .eq('id', config.id as string);

  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = await getSupabaseAdmin();
    const body = await req.json();
    const { acao, escritorio_id, cliente_id, code, redirect_uri } = body;

    if (!escritorio_id) {
      return new Response(JSON.stringify({ error: 'escritorio_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For save_credentials, we create/update the config row
    if (acao === 'save_credentials') {
      const { client_id, client_secret } = body;
      
      const { data: existing } = await supabase
        .from('integracoes_contaazul')
        .select('id')
        .eq('escritorio_id', escritorio_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('integracoes_contaazul')
          .update({ client_id, client_secret_encrypted: client_secret })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('integracoes_contaazul')
          .insert({ escritorio_id, client_id, client_secret_encrypted: client_secret });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get config for all other actions
    const { data: config, error: configError } = await supabase
      .from('integracoes_contaazul')
      .select('*')
      .eq('escritorio_id', escritorio_id)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Integração não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: Record<string, unknown>;

    switch (acao) {
      case 'get_auth_url': {
        const authUrl = await obterAuthUrl(config, redirect_uri || `${supabaseUrl}/functions/v1/contaazul-sync`);
        result = { auth_url: authUrl };
        break;
      }

      case 'exchange_code': {
        result = await trocarCodigoPorToken(supabase, config, code, redirect_uri || `${supabaseUrl}/functions/v1/contaazul-sync`);
        break;
      }

      case 'sincronizar_clientes': {
        const accessToken = await getAccessToken(supabase, config);
        const syncResult = await sincronizarClientes(supabase, escritorio_id, accessToken);
        result = syncResult;
        break;
      }

      case 'exportar_cliente': {
        if (!cliente_id) throw new Error('cliente_id obrigatório');
        const accessToken = await getAccessToken(supabase, config);
        result = await exportarCliente(supabase, cliente_id, accessToken);
        break;
      }

      case 'desconectar': {
        await supabase
          .from('integracoes_contaazul')
          .update({
            ativo: false,
            access_token_encrypted: null,
            refresh_token_encrypted: null,
            token_expira_em: null,
          })
          .eq('id', config.id);
        result = { success: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('[contaazul-sync] Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
