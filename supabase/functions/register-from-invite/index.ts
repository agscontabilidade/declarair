import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, nome, cpf, email, telefone, senha } = await req.json();

    if (!token || !nome || !cpf || !email || !senha) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Validate invite
    const { data: convite, error: conviteError } = await supabaseAdmin
      .from('convites_cliente')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (conviteError || !convite) {
      throw new Error('Link de convite inválido ou expirado');
    }

    // 2. Check if CPF already exists in this office
    const cpfLimpo = cpf.replace(/\D/g, '');
    const { data: clienteExistente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('cpf', cpfLimpo)
      .eq('escritorio_id', convite.escritorio_id)
      .single();

    if (clienteExistente) {
      throw new Error('Este CPF já está cadastrado neste escritório');
    }

    // 3. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, tipo: 'cliente' },
    });

    if (authError || !authData.user) {
      console.error('[register-from-invite] Auth error:', authError);
      throw new Error('Erro ao criar conta: ' + (authError?.message || 'desconhecido'));
    }

    // 4. Create client record
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .insert({
        escritorio_id: convite.escritorio_id,
        auth_user_id: authData.user.id,
        nome,
        cpf: cpfLimpo,
        email,
        telefone: telefone || null,
        status_onboarding: 'concluido',
      })
      .select()
      .single();

    if (clienteError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('[register-from-invite] Client error:', clienteError);
      throw new Error('Erro ao criar cliente: ' + clienteError.message);
    }

    // 5. Create declaration for current year
    const anoAtual = new Date().getFullYear();
    await supabaseAdmin
      .from('declaracoes')
      .insert({
        escritorio_id: convite.escritorio_id,
        cliente_id: cliente.id,
        ano_base: anoAtual - 1,
        status: 'aguardando_documentos',
      });

    // 6. Mark invite as used
    await supabaseAdmin
      .from('convites_cliente')
      .update({
        usado: true,
        usado_em: new Date().toISOString(),
        usado_por_cliente_id: cliente.id,
      })
      .eq('id', convite.id);

    // 7. Notify the office
    await supabaseAdmin
      .from('notificacoes')
      .insert({
        escritorio_id: convite.escritorio_id,
        titulo: '👤 Novo cliente cadastrado',
        mensagem: `${nome} se cadastrou através do link de convite.`,
        link_destino: `/clientes/${cliente.id}`,
      });

    return new Response(
      JSON.stringify({ success: true, cliente_id: cliente.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar conta';
    console.error('[register-from-invite] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
