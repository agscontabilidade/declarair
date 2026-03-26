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
    const { token } = await req.json();

    if (!token) {
      throw new Error('Token é obrigatório');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: convite, error } = await supabaseAdmin
      .from('convites_cliente')
      .select('id, escritorio_id, nome_sugerido, cpf_sugerido, email_sugerido, mensagem_personalizada, expira_em')
      .eq('token', token)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (error || !convite) {
      return new Response(
        JSON.stringify({ valido: false, motivo: 'Link inválido ou expirado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch office info for branding
    const { data: escritorio } = await supabaseAdmin
      .from('escritorios')
      .select('id, nome, logo_url, cor_primaria, cor_fundo_portal, nome_portal')
      .eq('id', convite.escritorio_id)
      .single();

    return new Response(
      JSON.stringify({
        valido: true,
        convite: {
          id: convite.id,
          escritorio_id: convite.escritorio_id,
          nome_sugerido: convite.nome_sugerido,
          cpf_sugerido: convite.cpf_sugerido,
          email_sugerido: convite.email_sugerido,
          mensagem_personalizada: convite.mensagem_personalizada,
        },
        escritorio,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao validar token';
    return new Response(
      JSON.stringify({ valido: false, motivo: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
