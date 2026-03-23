CREATE OR REPLACE FUNCTION public.handle_new_accountant_signup(
  p_user_id UUID,
  p_nome TEXT,
  p_nome_escritorio TEXT,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escritorio_id UUID;
  v_result JSON;
BEGIN
  INSERT INTO escritorios (nome)
  VALUES (p_nome_escritorio)
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
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_accountant_signup TO authenticated;