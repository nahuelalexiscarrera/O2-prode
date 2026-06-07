-- 20260606_social_notif_prefs.sql
--
-- Wave 1 (A3): las notificaciones in-app de like/comentario las insertan estos
-- triggers SIN mirar la preferencia del socio → "Social: OFF" no silenciaba nada
-- (y el default es OFF, así que casi todos recibían lo que pidieron NO recibir).
-- Ahora el trigger solo notifica si el DUEÑO tiene socialReactions activo.

CREATE OR REPLACE FUNCTION trg_notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_actor TEXT; v_pref BOOLEAN;
BEGIN
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  -- Respetar la preferencia del dueño (default false si la clave no existe).
  SELECT COALESCE((notification_prefs->>'socialReactions')::boolean, false)
    INTO v_pref FROM "user" WHERE id = v_owner;
  IF NOT v_pref THEN RETURN NEW; END IF;
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (v_owner, 'comment', 'Nuevo comentario',
          COALESCE(v_actor, 'Alguien') || ' comentó tu publicación',
          '/app/muro/' || NEW.post_id);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION trg_notify_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_actor TEXT; v_pref BOOLEAN;
BEGIN
  IF NEW.target_type <> 'post' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.target_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE((notification_prefs->>'socialReactions')::boolean, false)
    INTO v_pref FROM "user" WHERE id = v_owner;
  IF NOT v_pref THEN RETURN NEW; END IF;
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (v_owner, 'reaction', 'Nueva reacción',
          'A ' || COALESCE(v_actor, 'alguien') || ' le gustó tu publicación',
          '/app/muro/' || NEW.target_id);
  RETURN NEW;
END $$;

-- Los triggers (trg_comment_notify / trg_reaction_notify) siguen apuntando a
-- estas funciones; CREATE OR REPLACE no requiere recrearlos.
