-- 20260531_social_notifications.sql
--
-- Notificaciones sociales estilo Twitter/FB: avisar al DUEÑO del post cuando
-- alguien comenta o reacciona. Se hacen por TRIGGER (no desde el server action)
-- porque la policy de `notification` solo permite insertar con auth.uid()=user_id,
-- y acá el actor (comentador/reaccionador) inserta la notif de OTRO usuario.
-- SECURITY DEFINER + search_path fijo para insertar de forma segura.

-- ─── Comentario → notif al dueño del post ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner UUID;
  v_actor TEXT;
BEGIN
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;  -- no auto-notif
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (
    v_owner, 'comment', 'Nuevo comentario',
    COALESCE(v_actor, 'Alguien') || ' comentó tu publicación',
    '/app/muro/' || NEW.post_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comment_notify ON comment;
CREATE TRIGGER trg_comment_notify
  AFTER INSERT ON comment
  FOR EACH ROW EXECUTE FUNCTION trg_notify_comment();

-- ─── Reacción a un post → notif al dueño ──────────────────────────────
CREATE OR REPLACE FUNCTION trg_notify_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner UUID;
  v_actor TEXT;
BEGIN
  IF NEW.target_type <> 'post' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.target_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (
    v_owner, 'reaction', 'Nueva reacción',
    'A ' || COALESCE(v_actor, 'alguien') || ' le gustó tu publicación',
    '/app/muro/' || NEW.target_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reaction_notify ON reaction;
CREATE TRIGGER trg_reaction_notify
  AFTER INSERT ON reaction
  FOR EACH ROW EXECUTE FUNCTION trg_notify_reaction();
