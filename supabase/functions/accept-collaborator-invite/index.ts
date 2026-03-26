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
    const { convite_id, user_id, email, nome, escritorio_id, papel } = await req.json();

    if (!convite_id || !user_id || !email || !nome || !escritorio_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the invite is still valid
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

    // Create usuario record
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: user_id,
        email,
        nome,
        escritorio_id,
        papel: papel || 'colaborador',
        ativo: true,
      });

    if (usuarioError) {
      console.error('Error creating usuario:', usuarioError);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + usuarioError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id,
        role: 'colaborador',
      });

    if (roleError) {
      console.error('Error adding role:', roleError);
    }

    // Mark invite as used
    await supabaseAdmin
      .from('colaborador_convites')
      .update({
        usado: true,
        usado_em: new Date().toISOString(),
      })
      .eq('id', convite_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
