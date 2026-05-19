-- F5: convites_cliente — restringir policies a 'authenticated' (eram 'public')
DROP POLICY IF EXISTS "Colaboradores podem atualizar convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem criar convites do escritorio"     ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem remover convites do escritorio"   ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem ver convites do escritorio"       ON public.convites_cliente;

CREATE POLICY "Colaboradores podem ver convites do escritorio"
  ON public.convites_cliente FOR SELECT
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem criar convites do escritorio"
  ON public.convites_cliente FOR INSERT
  TO authenticated
  WITH CHECK (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem atualizar convites do escritorio"
  ON public.convites_cliente FOR UPDATE
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id())
  WITH CHECK (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Colaboradores podem remover convites do escritorio"
  ON public.convites_cliente FOR DELETE
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

-- F6: usuario_permissoes — impedir auto-grant e restringir a 'authenticated'
DROP POLICY IF EXISTS "Accountants can manage permissions of their office" ON public.usuario_permissoes;
DROP POLICY IF EXISTS "Users can view permissions of their office"         ON public.usuario_permissoes;

CREATE POLICY "Accountants can manage permissions of their office"
  ON public.usuario_permissoes FOR ALL
  TO authenticated
  USING (
    escritorio_id = get_user_escritorio_id()
    AND (
      has_role(auth.uid(), 'dono'::app_role)
      OR user_tem_permissao('usuarios.manage')
    )
  )
  WITH CHECK (
    escritorio_id = get_user_escritorio_id()
    AND (
      has_role(auth.uid(), 'dono'::app_role)
      OR user_tem_permissao('usuarios.manage')
    )
    -- Bloqueia auto-promoção: ninguém pode escrever permissão para si mesmo
    -- exceto o dono (que tem todas as permissões por papel).
    AND (
      has_role(auth.uid(), 'dono'::app_role)
      OR user_id <> auth.uid()
    )
  );

CREATE POLICY "Users can view permissions of their office"
  ON public.usuario_permissoes FOR SELECT
  TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

-- F7: auditoria_atividades — remover policy mal-escrita.
-- Service role faz bypass de RLS por padrão; sem policies legítimas, qualquer
-- chamada autenticada normal é negada por default-deny — exatamente o que queremos.
DROP POLICY IF EXISTS "Apenas administradores podem ver auditoria" ON public.auditoria_atividades;

CREATE POLICY "Admins do sistema veem auditoria"
  ON public.auditoria_atividades FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- F9: storage public-assets — restringir upload a admin/dono apenas
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;

CREATE POLICY "Admin upload public-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'dono'::app_role)
    )
  );

CREATE POLICY "Admin update public-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'dono'::app_role)
    )
  );

CREATE POLICY "Admin delete public-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'dono'::app_role)
    )
  );