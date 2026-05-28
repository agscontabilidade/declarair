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
    const { token, nome, cpf, email, telefone, senha } = await req.json();

    if (!token || !nome || !cpf || !email || !senha) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );


    // 1. Validate invite (link permanente e reutilizável — basta existir)
    const { data: convite, error: conviteError } = await supabaseAdmin
      .from('convites_cliente')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (conviteError || !convite) {
      throw new Error('Este link de convite é inválido ou foi removido. Peça um novo link ao seu contador.');
    }

    // 2. Check if CPF already exists in this office
    const cpfLimpo = cpf.replace(/\D/g, '');
    const { data: clienteExistente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('cpf', cpfLimpo)
      .eq('escritorio_id', convite.escritorio_id)
      .maybeSingle();

    if (clienteExistente) {
      throw new Error('Este CPF já está cadastrado neste escritório. Faça login ou peça ajuda ao seu contador.');
    }

    // 3. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, tipo: 'cliente' },
    });

    if (authError || !authData.user) {
      console.error('[register-from-invite] Auth error:', JSON.stringify(authError));
      const raw = (authError?.message || '').toLowerCase();
      let friendly = 'Não foi possível criar sua conta. Tente novamente em alguns instantes.';
      if (raw.includes('already') && raw.includes('registered')) {
        friendly = 'Este email já possui uma conta. Faça login ou use "Esqueci minha senha" para recuperar o acesso.';
      } else if (raw.includes('password') && raw.includes('least')) {
        friendly = 'A senha precisa ter pelo menos 8 caracteres.';
      } else if (raw.includes('password') && raw.includes('weak')) {
        friendly = 'Senha muito fraca. Use letras, números e pelo menos 8 caracteres.';
      } else if (raw.includes('invalid') && raw.includes('email')) {
        friendly = 'O email informado parece inválido. Verifique e tente novamente.';
      } else if (raw.includes('rate') && raw.includes('limit')) {
        friendly = 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
      }
      throw new Error(friendly);
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
      console.error('[register-from-invite] Client error:', JSON.stringify(clienteError));
      throw new Error('Não foi possível concluir seu cadastro. Fale com seu contador para verificar seus dados.');
    }

    // 5. Create declaration for current year (não bloqueia o cadastro se falhar)
    try {
      const anoAtual = new Date().getFullYear();
      await supabaseAdmin
        .from('declaracoes')
        .insert({
          escritorio_id: convite.escritorio_id,
          cliente_id: cliente.id,
          ano_base: anoAtual,
          status: 'aguardando_documentos',
        });
    } catch (e) {
      console.error('[register-from-invite] Declaracao insert ignored:', e);
    }

    // 5b. Checklist obrigatório removido — documentos são livres.

    // 6. Link permanece reutilizável — não marcamos como usado.

    // 7. Notify the office (best-effort, não bloqueia)
    try {
      await supabaseAdmin
        .from('notificacoes')
        .insert({
          escritorio_id: convite.escritorio_id,
          titulo: '👤 Novo cliente cadastrado',
          mensagem: `${nome} se cadastrou através do link de convite.`,
          link_destino: `/clientes/${cliente.id}`,
        });
    } catch (e) {
      console.error('[register-from-invite] Notificacao insert ignored:', e);
    }

    // 8. Audit log (best-effort)
    try {
      await supabaseAdmin.rpc('registrar_log_auditoria', {
        p_tipo: 'convite_aceito',
        p_evento: 'cliente_registrado',
        p_dados: { cliente_id: cliente.id, escritorio_id: convite.escritorio_id, convite_id: convite.id },
        p_status: 'sucesso',
        p_mensagem: `${nome} aceitou o convite.`
      });
    } catch (e) {
      console.error('[register-from-invite] Audit log ignored:', e);
    }

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
