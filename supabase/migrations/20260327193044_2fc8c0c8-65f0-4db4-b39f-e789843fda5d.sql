
-- Update signup function to set proper free plan defaults
CREATE OR REPLACE FUNCTION public.handle_new_accountant_signup(p_user_id uuid, p_nome text, p_nome_escritorio text, p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_escritorio_id UUID;
  v_result JSON;
BEGIN
  INSERT INTO escritorios (nome, plano, limite_declaracoes, usuarios_limite, storage_limite_mb)
  VALUES (p_nome_escritorio, 'gratuito', 1, 1, 500)
  RETURNING id INTO v_escritorio_id;

  INSERT INTO usuarios (id, escritorio_id, nome, email, papel)
  VALUES (p_user_id, v_escritorio_id, p_nome, p_email, 'dono');

  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'dono');

  v_result := json_build_object(
    'escritorio_id', v_escritorio_id,
    'user_id', p_user_id,
    'success', true
  );

  RETURN v_result;
END;
$function$;
