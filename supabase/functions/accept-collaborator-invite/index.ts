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
    // 1. Validate JWT — caller must be the authenticated user accepting the invite
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authenticatedUserId = claimsData.claims.sub as string;
    const authenticatedEmail = (claimsData.claims.email as string | undefined)?.toLowerCase() ?? null;

    // 2. Read only the convite_id from the body. Everything else comes from the invite record.
    const { convite_id } = await req.json();
    if (!convite_id) {
      return new Response(JSON.stringify({ error: 'convite_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Verify invite is valid and unused
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

    // 4. Ensure the authenticated user's email matches the invite's target email
    const conviteEmail = (convite.email as string).toLowerCase();
    if (authenticatedEmail && authenticatedEmail !== conviteEmail) {
      return new Response(JSON.stringify({ error: 'Email autenticado não corresponde ao convite' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Derive ALL sensitive fields from the invite record — never from the body
    const escritorio_id = convite.escritorio_id as string;
    const email = convite.email as string;
    const nome = convite.nome as string;
    const papel = (convite.papel as string) || 'colaborador';
    const user_id = authenticatedUserId;

    // 6. Create usuario record
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
      console.error('Error creating usuario:', usuarioError);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + usuarioError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Add user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id,
        role: 'colaborador',
      });

    if (roleError) {
      console.error('Error adding role:', roleError);
    }

    // 8. Assign permissions if present in the invite
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
        console.error('Error assigning permissions:', permError);
      }
    }

    // 9. Mark invite as used
    await supabaseAdmin
      .from('colaborador_convites')
      .update({
        usado: true,
        usado_em: new Date().toISOString(),
      })
      .eq('id', convite_id);

    // 10. Audit log
    await supabaseAdmin.rpc('registrar_log_auditoria', {
      p_tipo: 'convite_aceito',
      p_evento: 'colaborador_registrado',
      p_dados: { user_id, escritorio_id, convite_id, email },
      p_status: 'sucesso',
      p_mensagem: `${nome} aceitou o convite de colaborador.`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
