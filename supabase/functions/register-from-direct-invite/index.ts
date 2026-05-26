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

    if (typeof senha !== 'string' || senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Trava global: bloqueio de novos cadastros (prazo IRPF)
    const { data: bloqueioCfg } = await supabaseAdmin.rpc('get_novos_cadastros_bloqueio');
    if (bloqueioCfg && typeof bloqueioCfg === 'object') {
      const cfg = bloqueioCfg as { enabled?: boolean; deadline?: string; mensagem?: string };
      if (cfg.enabled && cfg.deadline && new Date(cfg.deadline).getTime() <= Date.now()) {
        return new Response(
          JSON.stringify({ error: cfg.mensagem || 'Cadastro de novos clientes encerrado.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // 2. Resolve auth user: reuse existing if valid, otherwise create
    let userId: string | null = null;

    if (cliente.auth_user_id) {
      // Check if auth user still exists
      const { data: existing } = await supabaseAdmin.auth.admin.getUserById(cliente.auth_user_id);
      if (existing?.user && existing.user.email?.toLowerCase() === cliente.email.toLowerCase()) {
        // Recover inconsistent state: update password on existing user
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
          existing.user.id,
          { password: senha, email_confirm: true }
        );
        if (updErr) {
          console.error('[register-from-direct-invite] updateUserById error:', updErr);
          throw new Error('Erro ao atualizar senha: ' + updErr.message);
        }
        userId = existing.user.id;
      } else {
        // Auth user missing or email mismatch — clear stale link and recreate
        await supabaseAdmin
          .from('clientes')
          .update({ auth_user_id: null })
          .eq('id', cliente.id);
      }
    }

    if (!userId) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cliente.email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: cliente.nome, tipo: 'cliente' },
      });

      if (authError || !authData.user) {
        console.error('[register-from-direct-invite] Auth error:', authError);
        const msg = authError?.message || '';
        // If auth user already exists in Auth but wasn't linked, try to find and link it
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          const found = list?.users?.find(
            (u) => u.email?.toLowerCase() === cliente.email.toLowerCase()
          );
          if (found) {
            // Guard: do not hijack a staff account
            const { data: staffRow } = await supabaseAdmin
              .from('usuarios')
              .select('id')
              .eq('id', found.id)
              .maybeSingle();
            if (staffRow) {
              throw new Error('Este email já está em uso por um usuário do escritório. Use outro email para o cadastro do cliente ou peça ao responsável para alterar o email do convite.');
            }
            // Guard: do not break unique index by linking to an auth user already tied to another cliente
            const { data: otherCliente } = await supabaseAdmin
              .from('clientes')
              .select('id')
              .eq('auth_user_id', found.id)
              .neq('id', cliente.id)
              .maybeSingle();
            if (otherCliente) {
              throw new Error('Este email já está vinculado a outro cliente. Solicite ao seu contador um novo convite com um email diferente.');
            }
            const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
              found.id,
              { password: senha, email_confirm: true }
            );
            if (updErr) throw new Error('Erro ao atualizar senha: ' + updErr.message);
            userId = found.id;
          } else {
            throw new Error('Este email já está em uso por outra conta.');
          }
        } else {
          throw new Error('Erro ao criar conta: ' + (msg || 'desconhecido'));
        }
      } else {
        userId = authData.user.id;
      }
    }

    // Final safety: ensure userId is not already linked to another cliente row,
    // and not a staff account — prevents idx_clientes_auth_user violation.
    if (userId) {
      const { data: staffRow } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (staffRow) {
        throw new Error('Este email já está em uso por um usuário do escritório. Use outro email para o cadastro do cliente ou peça ao responsável para alterar o email do convite.');
      }
      const { data: otherCliente } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('auth_user_id', userId)
        .neq('id', cliente.id)
        .maybeSingle();
      if (otherCliente) {
        throw new Error('Este email já está vinculado a outro cliente. Solicite ao seu contador um novo convite com um email diferente.');
      }
    }


    // 3. Link auth user to client and finalize onboarding (idempotent)
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        auth_user_id: userId,
        token_convite: null,
        token_convite_expira_em: null,
        status_onboarding: 'concluido',
      })
      .eq('id', cliente.id);

    if (updateError) {
      console.error('[register-from-direct-invite] Update error:', updateError);
      throw new Error('Erro ao vincular conta: ' + updateError.message);
    }

    // 4. Ensure declaracao for current year (idempotent)
    const anoAtual = new Date().getFullYear();
    const { data: existingDecl } = await supabaseAdmin
      .from('declaracoes')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('ano_base', anoAtual)
      .maybeSingle();

    let declId = existingDecl?.id as string | undefined;

    if (!declId) {
      const { data: newDecl, error: declErr } = await supabaseAdmin
        .from('declaracoes')
        .insert({
          escritorio_id: cliente.escritorio_id,
          cliente_id: cliente.id,
          ano_base: anoAtual,
          status: 'aguardando_documentos',
        })
        .select('id')
        .single();
      if (declErr) console.error('[register-from-direct-invite] decl insert error:', declErr);
      declId = newDecl?.id;
    }

    // 5. Checklist obrigatório removido — documentos são livres.

    // 6. Notify office (best-effort)
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
