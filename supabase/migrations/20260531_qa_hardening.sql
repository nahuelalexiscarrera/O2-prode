-- 20260531_qa_hardening.sql
--
-- Dos bugs de integridad encontrados en el QA end-to-end:
--
-- 1) Contadores del muro entre usuarios. trg_comment_count / trg_reaction_count
--    hacen UPDATE sobre post/comment, pero corrían como el usuario actual → la
--    RLS de post/comment (solo dueño o admin) BLOQUEABA ese UPDATE cuando el que
--    comenta/reacciona NO es el dueño del post. Resultado: comment_count y
--    reaction_count se quedaban en 0 para interacciones entre socios. Se pasan a
--    SECURITY DEFINER (como ya lo son los triggers de notificación) para que el
--    conteo se mantenga sin importar quién dispara el evento.
--
-- 2) fn_add_points permitía a un socio AUTO-sumarse puntos llamando la RPC
--    directo (corre como el usuario; la RLS lo deja tocar su propia fila). Se
--    revoca la ejecución a anon/authenticated: ahora solo el service role la
--    ejecuta (processAchievements y los crons ya la llaman con service role).

-- ─── 1. Triggers de conteo → SECURITY DEFINER ─────────────────────────
CREATE OR REPLACE FUNCTION trg_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION trg_reaction_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE post SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
    ELSE
      UPDATE comment SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE post SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
    ELSE
      UPDATE comment SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;

-- ─── 2. fn_add_points: solo service role ──────────────────────────────
-- OJO: en Postgres las funciones tienen EXECUTE para PUBLIC por defecto, así que
-- revocar solo a `authenticated` NO alcanza (el rol sigue teniendo permiso vía
-- PUBLIC). Hay que revocar a PUBLIC y dar el grant explícito al service role.
REVOKE EXECUTE ON FUNCTION fn_add_points(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_add_points(uuid, integer) TO service_role;

-- ─── Backfill: recomputar contadores reales (por si quedaron desfasados) ─
UPDATE post p SET
  comment_count = (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL),
  reaction_count = (SELECT COUNT(*) FROM reaction r WHERE r.target_type = 'post' AND r.target_id = p.id);

UPDATE comment c SET
  reaction_count = (SELECT COUNT(*) FROM reaction r WHERE r.target_type = 'comment' AND r.target_id = c.id);
