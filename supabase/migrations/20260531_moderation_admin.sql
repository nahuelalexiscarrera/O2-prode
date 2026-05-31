-- 20260531_moderation_admin.sql
--
-- Moderación del muro + concepto de admin/superusuario.
--   1. Columna is_admin en "user" + helper is_admin().
--   2. Borrado (soft) de comentarios: dueño O admin.
--   3. Borrado (soft) de posts: ahora también el admin (antes solo el dueño).
--   4. comment_count: descontar también en el soft-delete (UPDATE de deleted_at),
--      no solo en INSERT / hard-DELETE.
--   5. Bucket de Storage `post-images` + policies (subida solo admin → fotos de
--      premios; lectura pública). Antes el bucket no existía y la subida fallaba.

-- ─── 1. Admin ─────────────────────────────────────────────────────────
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- SECURITY DEFINER: puede leer "user" sin chocar con las RLS al evaluar policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT u.is_admin FROM "user" u WHERE u.id = auth.uid()), false);
$$;

-- Admin inicial (dueño del proyecto).
UPDATE "user" SET is_admin = true WHERE email = 'nahuel.alexis.carrera@gmail.com';

-- ─── 2. Borrado de comentarios (dueño o admin) ────────────────────────
DROP POLICY IF EXISTS "Borra comentario: dueño o admin" ON comment;
CREATE POLICY "Borra comentario: dueño o admin"
  ON comment FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- ─── 3. Borrado de posts (dueño o admin) ──────────────────────────────
DROP POLICY IF EXISTS "User borra sus posts (soft)" ON post;
DROP POLICY IF EXISTS "Borra post: dueño o admin" ON post;
CREATE POLICY "Borra post: dueño o admin"
  ON post FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- ─── 4. comment_count consistente también en soft-delete ──────────────
CREATE OR REPLACE FUNCTION trg_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE post SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE post SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_comment_count_change ON comment;
CREATE TRIGGER trg_comment_count_change
  AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON comment
  FOR EACH ROW EXECUTE FUNCTION trg_comment_count();

-- ─── 5. Storage: bucket post-images (subida admin, lectura pública) ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "post-images lectura pública" ON storage.objects;
CREATE POLICY "post-images lectura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "post-images subida admin" ON storage.objects;
CREATE POLICY "post-images subida admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND public.is_admin());

DROP POLICY IF EXISTS "post-images borrado admin" ON storage.objects;
CREATE POLICY "post-images borrado admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND public.is_admin());
