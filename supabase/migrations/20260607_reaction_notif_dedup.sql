-- 20260607_reaction_notif_dedup.sql
--
-- Wave 2 (M8): cada INSERT en `reaction` genera una notificación. Como reaccionar
-- es un toggle (like → unlike → like) y un post viral recibe muchos likes, el
-- dueño podía recibir una avalancha de "A X le gustó tu publicación" por el mismo
-- post. Ahora deduplicamos: si ya existe una notificación de reacción NO LEÍDA y
-- reciente (última hora) para ese mismo post, no insertamos otra. Cuando el dueño
-- la lee (read_at), una reacción nueva vuelve a notificar.
--
-- Mantiene el chequeo de preferencia del dueño agregado en 20260606_social_notif_prefs.

CREATE OR REPLACE FUNCTION trg_notify_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_actor TEXT; v_pref BOOLEAN; v_link TEXT;
BEGIN
  IF NEW.target_type <> 'post' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.target_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;

  -- Respetar la preferencia del dueño (default false si la clave no existe).
  SELECT COALESCE((notification_prefs->>'socialReactions')::boolean, false)
    INTO v_pref FROM "user" WHERE id = v_owner;
  IF NOT v_pref THEN RETURN NEW; END IF;

  v_link := '/app/muro/' || NEW.target_id;

  -- Dedup anti-spam: ya hay una notif de reacción no leída y reciente para este
  -- post → no apilamos otra (M8).
  IF EXISTS (
    SELECT 1 FROM notification
    WHERE user_id = v_owner
      AND type = 'reaction'
      AND deep_link = v_link
      AND read_at IS NULL
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (v_owner, 'reaction', 'Nueva reacción',
          'A ' || COALESCE(v_actor, 'alguien') || ' le gustó tu publicación',
          v_link);
  RETURN NEW;
END $$;

-- El trigger (trg_reaction_notify) sigue apuntando a esta función;
-- CREATE OR REPLACE no requiere recrearlo.
