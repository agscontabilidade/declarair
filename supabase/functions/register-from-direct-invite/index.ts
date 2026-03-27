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
    const { token, senha } = await req.json();

    if (!token || !senha) {
      throw new Error('Token e senha são obrigatórios');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Validate token - find client with this invite token
    const { data: clientes, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, email, escritorio_id, auth_user_id')
      .eq('token_convite', token)
      .gt('token_convite_expira_em', new Date().toISOString())
      .neq('status_onboarding', 'concluido');

    if (clienteError || !clientes || clientes.length === 0) {
      throw new Error('Link de convite inválido ou expirado');
    }

    const cliente = clientes[0];

    if (!cliente.email) {
      throw new Error('Cliente não possui email cadastrado');
    }

    if (cliente.auth_user_id) {
      throw new Error('Este cliente já possui uma conta');
    }

    // 2. Create auth user with email auto-confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cliente.email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: cliente.nome, tipo: 'cliente' },
    });

    if (authError || !authData.user) {
      console.error('[register-from-direct-invite] Auth error:', authError);
      throw new Error('Erro ao criar conta: ' + (authError?.message || 'desconhecido'));
    }

    // 3. Link auth user to client and clear token
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        auth_user_id: authData.user.id,
        token_convite: null,
        token_convite_expira_em: null,
        status_onboarding: 'concluido',
      })
      .eq('id', cliente.id);

    if (updateError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('[register-from-direct-invite] Update error:', updateError);
      throw new Error('Erro ao vincular conta: ' + updateError.message);
    }

    // 4. Notify office
    await supabaseAdmin
      .from('notificacoes')
      .insert({
        escritorio_id: cliente.escritorio_id,
        titulo: '👤 Cliente criou conta',
        mensagem: `${cliente.nome} criou sua conta através do convite direto.`,
        link_destino: `/clientes/${cliente.id}`,
      });

    return new Response(
      JSON.stringify({ success: true, cliente_id: cliente.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar conta';
    console.error('[register-from-direct-invite] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
