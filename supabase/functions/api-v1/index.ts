import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function authenticate(req: Request) {
  const apiKey = req.headers.get('X-API-Key');

  if (!apiKey) {
    return { error: 'API Key ausente. Envie no header X-API-Key.', status: 401 };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const keyHash = await hashApiKey(apiKey);

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, escritorio_id, permissoes, expira_em')
    .eq('key_hash', keyHash)
    .eq('ativo', true)
    .single();

  if (error || !keyData) {
    return { error: 'API Key inválida ou revogada.', status: 401 };
  }

  if (keyData.expira_em && new Date(keyData.expira_em) < new Date()) {
    return { error: 'API Key expirada.', status: 401 };
  }

  // Update last usage (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ ultimo_uso: new Date().toISOString() })
    .eq('id', keyData.id)
    .then(() => {});

  return { escritorioId: keyData.escritorio_id, permissoes: keyData.permissoes };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Extract the resource path after the function name
  const pathParts = url.pathname.split('/').filter(Boolean);
  // pathParts: ["api-v1", "clientes"] or ["api-v1", "clientes", "uuid"]
  const resource = pathParts[1] || '';
  const resourceId = pathParts[2] || null;
  const method = req.method;

  try {
    const auth = await authenticate(req);
    if ('error' in auth) {
      return jsonResponse({ error: auth.error }, auth.status);
    }

    const { escritorioId } = auth;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── CLIENTES ──
    if (resource === 'clientes') {
      if (method === 'GET' && !resourceId) {
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const search = url.searchParams.get('search') || '';

        let q = supabase
          .from('clientes')
          .select('id, nome, cpf, email, telefone, data_nascimento, status_onboarding, created_at', { count: 'exact' })
          .eq('escritorio_id', escritorioId)
          .order('created_at', { ascending: false })
          .range(page * limit, page * limit + limit - 1);

        if (search) {
          q = q.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        const { data, count, error } = await q;
        if (error) throw error;
        return jsonResponse({ data, total: count, page, limit });
      }

      if (method === 'GET' && resourceId) {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nome, cpf, email, telefone, data_nascimento, status_onboarding, created_at')
          .eq('id', resourceId)
          .eq('escritorio_id', escritorioId)
          .single();
        if (error) throw error;
        if (!data) return jsonResponse({ error: 'Cliente não encontrado' }, 404);
        return jsonResponse({ data });
      }

      if (method === 'POST') {
        const body = await req.json();
        if (!body.nome || !body.cpf) {
          return jsonResponse({ error: 'Campos obrigatórios: nome, cpf' }, 400);
        }
        const { data, error } = await supabase
          .from('clientes')
          .insert({ nome: body.nome, cpf: body.cpf, email: body.email, telefone: body.telefone, data_nascimento: body.data_nascimento, escritorio_id: escritorioId })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ data }, 201);
      }
    }

    // ── DECLARAÇÕES ──
    if (resource === 'declaracoes') {
      if (method === 'GET' && !resourceId) {
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        const { data, count, error } = await supabase
          .from('declaracoes')
          .select('id, ano_base, status, tipo_resultado, valor_resultado, data_transmissao, numero_recibo, created_at, clientes(id, nome, cpf)', { count: 'exact' })
          .eq('escritorio_id', escritorioId)
          .order('created_at', { ascending: false })
          .range(page * limit, page * limit + limit - 1);
        if (error) throw error;
        return jsonResponse({ data, total: count, page, limit });
      }

      if (method === 'GET' && resourceId) {
        const { data, error } = await supabase
          .from('declaracoes')
          .select('id, ano_base, status, tipo_resultado, valor_resultado, data_transmissao, numero_recibo, observacoes_internas, created_at, clientes(id, nome, cpf)')
          .eq('id', resourceId)
          .eq('escritorio_id', escritorioId)
          .single();
        if (error) throw error;
        if (!data) return jsonResponse({ error: 'Declaração não encontrada' }, 404);
        return jsonResponse({ data });
      }

      if (method === 'POST') {
        const body = await req.json();
        if (!body.cliente_id || !body.ano_base) {
          return jsonResponse({ error: 'Campos obrigatórios: cliente_id, ano_base' }, 400);
        }
        const { data, error } = await supabase
          .from('declaracoes')
          .insert({ cliente_id: body.cliente_id, ano_base: body.ano_base, escritorio_id: escritorioId, contador_id: body.contador_id || null })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ data }, 201);
      }
    }

    // ── COBRANÇAS ──
    if (resource === 'cobrancas') {
      if (method === 'GET' && !resourceId) {
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        const { data, count, error } = await supabase
          .from('cobrancas')
          .select('id, descricao, valor, status, data_vencimento, data_pagamento, created_at, clientes(id, nome)', { count: 'exact' })
          .eq('escritorio_id', escritorioId)
          .order('created_at', { ascending: false })
          .range(page * limit, page * limit + limit - 1);
        if (error) throw error;
        return jsonResponse({ data, total: count, page, limit });
      }

      if (method === 'GET' && resourceId) {
        const { data, error } = await supabase
          .from('cobrancas')
          .select('id, descricao, valor, status, data_vencimento, data_pagamento, created_at, clientes(id, nome)')
          .eq('id', resourceId)
          .eq('escritorio_id', escritorioId)
          .single();
        if (error) throw error;
        if (!data) return jsonResponse({ error: 'Cobrança não encontrada' }, 404);
        return jsonResponse({ data });
      }

      if (method === 'POST') {
        const body = await req.json();
        if (!body.cliente_id || !body.descricao || !body.valor || !body.data_vencimento) {
          return jsonResponse({ error: 'Campos obrigatórios: cliente_id, descricao, valor, data_vencimento' }, 400);
        }
        const { data, error } = await supabase
          .from('cobrancas')
          .insert({ cliente_id: body.cliente_id, descricao: body.descricao, valor: body.valor, data_vencimento: body.data_vencimento, escritorio_id: escritorioId, declaracao_id: body.declaracao_id || null })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ data }, 201);
      }
    }

    return jsonResponse({ error: 'Endpoint não encontrado. Endpoints disponíveis: /clientes, /declaracoes, /cobrancas' }, 404);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[api-v1] Erro:', error);
    return jsonResponse({ error: message }, 500);
  }
});
