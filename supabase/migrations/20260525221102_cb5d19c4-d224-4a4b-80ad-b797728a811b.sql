
-- ============================================================
-- FASE 2: Bloquear LISTING anônimo em buckets públicos
-- (download via URL pública continua funcionando — não passa por RLS)
-- ============================================================

-- avatars
DROP POLICY IF EXISTS "Public can view avatars"           ON storage.objects;
DROP POLICY IF EXISTS "Avatares são visíveis publicamente" ON storage.objects;

CREATE POLICY "Avatars listing restricted to authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- logos-escritorios
DROP POLICY IF EXISTS "Logos are publicly accessible"          ON storage.objects;
DROP POLICY IF EXISTS "Logos são visíveis publicamente"       ON storage.objects;

CREATE POLICY "Logos listing restricted to authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'logos-escritorios');

-- public-assets
DROP POLICY IF EXISTS "Public Assets Read Access" ON storage.objects;

CREATE POLICY "Public assets listing restricted to authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'public-assets');
