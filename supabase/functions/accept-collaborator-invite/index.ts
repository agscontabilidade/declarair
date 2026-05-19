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
    // Only convite_id + senha are accepted from the client.
    // Everything else (escritorio_id, email, nome, papel, permissoes) is derived
    // exclusively from the invite record, eliminating tenant-hijack vectors.
    const { convite_id, senha } = await req.json();

    if (!convite_id || !senha) {
      return new Response(JSON.stringify({ error: 'convite_id e senha são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof senha !== 'string' || senha.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Validate invite
    const { data: convite, error: conviteError } = await supabaseAdmin
      .from('colaborador_convites')
      .select('*')
      .eq('id', convite_id)
      .eq('usado', false)
      .single();

    if (conviteError || !convite) {
      return new Response(JSON.stringify({ error: 'Convite inválido ou já utilizado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(convite.expira_em) < new Date()) {
      return new Response(JSON.stringify({ error: 'Convite expirado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Derive ALL sensitive fields from the invite record
    const escritorio_id = convite.escritorio_id as string;
    const email = convite.email as string;
    const nome = convite.nome as string;
    const papel = (convite.papel as string) || 'colaborador';

    // 3. Create auth user with admin API (auto-confirmed, like register-from-invite)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, tipo_usuario: 'contador' },
    });

    if (authError || !authData.user) {
      console.error('[accept-collaborator-invite] Auth error:', authError);
      const msg = authError?.message || 'Erro ao criar conta';
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user_id = authData.user.id;

    // 4. Create usuario record
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: user_id,
        email,
        nome,
        escritorio_id,
        papel,
        ativo: true,
      });

    if (usuarioError) {
      // Rollback the auth user so the invite can be retried
      await supabaseAdmin.auth.admin.deleteUser(user_id);
      console.error('[accept-collaborator-invite] usuarios error:', usuarioError);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + usuarioError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Add user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id, role: 'colaborador' });

    if (roleError) {
      console.error('[accept-collaborator-invite] role error:', roleError);
    }

    // 6. Assign permissions if present
    if (convite.permissoes && Array.isArray(convite.permissoes) && convite.permissoes.length > 0) {
      const permissoesToInsert = convite.permissoes.map((pId: string) => ({
        user_id,
        permissao_id: pId,
        escritorio_id,
      }));

      const { error: permError } = await supabaseAdmin
        .from('usuario_permissoes')
        .insert(permissoesToInsert);

      if (permError) {
        console.error('[accept-collaborator-invite] permissions error:', permError);
      }
    }

    // 7. Mark invite as used
    await supabaseAdmin
      .from('colaborador_convites')
      .update({ usado: true, usado_em: new Date().toISOString() })
      .eq('id', convite_id);

    // 8. Audit log
    await supabaseAdmin.rpc('registrar_log_auditoria', {
      p_tipo: 'convite_aceito',
      p_evento: 'colaborador_registrado',
      p_dados: { user_id, escritorio_id, convite_id, email },
      p_status: 'sucesso',
      p_mensagem: `${nome} aceitou o convite de colaborador.`,
    });

    return new Response(JSON.stringify({ success: true, user_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[accept-collaborator-invite] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
