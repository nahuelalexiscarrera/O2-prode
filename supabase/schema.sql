-- ┌────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Supabase Schema                                    │
-- │  Agente 8 · Data Modeler · 2026-05-18                          │
-- │  PostgreSQL 15+ · Row-Level Security activado                  │
-- └────────────────────────────────────────────────────────────────┘

-- ─── Extensions ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- search (futuro)

-- ─── Enums ──────────────────────────────────────────────────────────
CREATE TYPE phase_t AS ENUM ('groups', 'round-of-16', 'quarter', 'semi', 'final');
CREATE TYPE match_status_t AS ENUM ('scheduled', 'live', 'finished', 'postponed');
CREATE TYPE user_level_t AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE achievement_category_t AS ENUM ('skill', 'consistency', 'social', 'position');
CREATE TYPE reaction_target_t AS ENUM ('post', 'comment');
CREATE TYPE visibility_t AS ENUM ('public', 'private');
CREATE TYPE notification_type_t AS ENUM (
  'onboarding-incomplete', 'match-upcoming', 'phase-start', 'match-result',
  'reaction', 'comment', 'achievement-unlocked', 'close-to-podium',
  'position-change', 'weekly-digest', 'tournament-end', 'share-reminder'
);
CREATE TYPE share_template_t AS ENUM ('summary', 'position', 'match', 'achievement');
CREATE TYPE share_channel_t AS ENUM ('instagram', 'whatsapp', 'download', 'more');

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Foundational tables                                            │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE tournament (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  short_name    TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  phase_config  JSONB NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE groups (
  id            TEXT PRIMARY KEY,            -- 'A', 'B', ..., 'L'
  tournament_id UUID NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  letter        TEXT NOT NULL,
  UNIQUE(tournament_id, letter)
);

CREATE TABLE team (
  code     TEXT PRIMARY KEY,                  -- ISO alpha-2 lowercase
  name     TEXT NOT NULL,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL
);

CREATE TABLE player (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  full_name TEXT NOT NULL,
  team_code TEXT NOT NULL REFERENCES team(code) ON DELETE CASCADE
);

CREATE TABLE match (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  phase         phase_t NOT NULL,
  group_id      TEXT REFERENCES groups(id) ON DELETE SET NULL,
  home_code     TEXT NOT NULL REFERENCES team(code),
  away_code     TEXT NOT NULL REFERENCES team(code),
  kickoff_at    TIMESTAMPTZ NOT NULL,
  venue_city    TEXT,
  status        match_status_t NOT NULL DEFAULT 'scheduled',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_kickoff ON match(kickoff_at);
CREATE INDEX idx_match_status ON match(status) WHERE status != 'finished';
CREATE INDEX idx_match_phase ON match(phase);

CREATE TABLE match_result (
  match_id              UUID PRIMARY KEY REFERENCES match(id) ON DELETE CASCADE,
  home_score            SMALLINT NOT NULL CHECK (home_score >= 0 AND home_score <= 20),
  away_score            SMALLINT NOT NULL CHECK (away_score >= 0 AND away_score <= 20),
  top_scorer_player_id  UUID REFERENCES player(id) ON DELETE SET NULL,
  finished_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Users & auth                                                   │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE invite_code (
  code        TEXT PRIMARY KEY,
  created_by  UUID,  -- admin user; references auth.users
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_by     UUID,  -- references auth.users
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "user" (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  initials             TEXT NOT NULL,
  avatar_url           TEXT,
  phone                TEXT,
  level                user_level_t NOT NULL DEFAULT '1',
  total_points         INTEGER NOT NULL DEFAULT 0,
  position             INTEGER NOT NULL DEFAULT 0,
  -- Posición de la semana pasada: el cron weekly-positions la usa para el delta
  -- semanal del logro P04 "Remontada" (migración 20260605_audit_fixes).
  position_last_week   INTEGER,
  joined_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Registro abierto (Sprint 8): el invite dejó de ser obligatorio.
  -- Se conserva el FK para el histórico de quienes sí usaron código.
  invite_code_used     TEXT REFERENCES invite_code(code),
  -- Referidos (migración 20260605_referrals): código propio que el socio comparte
  -- y el referidor que lo trajo. Alimenta el logro S05 "Tribu".
  referral_code        TEXT,
  referred_by          UUID REFERENCES "user"(id) ON DELETE SET NULL,
  notification_prefs   JSONB NOT NULL DEFAULT '{"matchReminders":true,"results":true,"socialReactions":false,"weeklyDigest":true}',
  visibility           visibility_t NOT NULL DEFAULT 'public',
  is_admin             BOOLEAN NOT NULL DEFAULT false,  -- superusuario: modera muro, sube fotos de premios
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_user_position ON "user"(position) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_total_points ON "user"(total_points DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_referral_code ON "user"(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_user_referred_by ON "user"(referred_by) WHERE referred_by IS NOT NULL;

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Predictions                                                    │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE prediction (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  match_id          UUID NOT NULL REFERENCES match(id) ON DELETE CASCADE,
  home_score        SMALLINT NOT NULL CHECK (home_score >= 0 AND home_score <= 20),
  away_score        SMALLINT NOT NULL CHECK (away_score >= 0 AND away_score <= 20),
  points_earned     INTEGER,                              -- null until match settled
  points_breakdown  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_prediction_user ON prediction(user_id);
CREATE INDEX idx_prediction_match ON prediction(match_id);
CREATE INDEX idx_prediction_unsettled ON prediction(match_id) WHERE points_earned IS NULL;

CREATE TABLE special_prediction (
  user_id                   UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  tournament_id             UUID NOT NULL REFERENCES tournament(id),
  champion_code             TEXT NOT NULL REFERENCES team(code),
  runner_up_code            TEXT NOT NULL REFERENCES team(code),
  -- v1: el goleador queda para v2 (migración 20260605_special_pred_v1 dropeó el
  -- NOT NULL). upsertSpecialPrediction no lo setea → debe ser nullable o el alta
  -- de la predicción especial falla en una DB creada desde este schema.
  top_scorer_player_id      UUID REFERENCES player(id),
  group_stage_best_code     TEXT NOT NULL REFERENCES team(code),
  revelation_code           TEXT NOT NULL REFERENCES team(code),
  locked_at                 TIMESTAMPTZ,
  points_earned             INTEGER,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Social: posts, comments, reactions                             │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE post (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (LENGTH(body) > 0 AND LENGTH(body) <= 280),
  embed_type      TEXT CHECK (embed_type IN ('prediction', 'match')),
  embed_ref_id    UUID,
  image_url       TEXT,                                  -- 2026-05-19: imagen opcional (Supabase Storage)
  image_width     SMALLINT,
  image_height    SMALLINT,
  reaction_count  INTEGER NOT NULL DEFAULT 0,
  comment_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Supabase Storage bucket `post-images` (creado vía dashboard o migration aparte):
--   public read: true (autenticación a nivel app vía RLS de post)
--   upload: solo por usuario autenticado, path: {user_id}/{post_id}.{ext}
--   max size: 5MB
--   formats: image/jpeg, image/png, image/webp

CREATE INDEX idx_post_created ON post(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_user ON post(user_id);

CREATE TABLE comment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (LENGTH(body) > 0 AND LENGTH(body) <= 280),
  reaction_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comment_post ON comment(post_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE reaction (
  target_type   reaction_target_t NOT NULL,
  target_id     UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (target_type, target_id, user_id)
);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Achievements                                                   │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE achievement_catalog (
  id             TEXT PRIMARY KEY,                       -- 'A01', 'C01', ...
  category       achievement_category_t NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT NOT NULL,
  icon_ref       TEXT NOT NULL,
  points_bonus   INTEGER NOT NULL DEFAULT 0,
  trigger_key    TEXT NOT NULL
);

CREATE TABLE user_achievement (
  user_id          UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_id   TEXT NOT NULL REFERENCES achievement_catalog(id),
  unlocked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shared           BOOLEAN NOT NULL DEFAULT FALSE,
  progress         SMALLINT,
  PRIMARY KEY (user_id, achievement_id)
);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Ranking snapshots                                              │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE ranking_snapshot (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament(id),
  week_number   SMALLINT NOT NULL,
  snapshot_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entries       JSONB NOT NULL,                         -- inline para query rápida
  UNIQUE (tournament_id, week_number)
);

CREATE INDEX idx_ranking_week ON ranking_snapshot(week_number DESC);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Notifications & push                                           │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type        notification_type_t NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  deep_link   TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON notification(user_id, created_at DESC);
CREATE INDEX idx_notification_unread ON notification(user_id) WHERE read_at IS NULL;

CREATE TABLE push_subscription (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh_key    TEXT NOT NULL,
  auth_key      TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Telemetry: share intents                                       │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE share_intent (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  template     share_template_t NOT NULL,
  channel      share_channel_t NOT NULL,
  context_id   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_intent_user ON share_intent(user_id, created_at DESC);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  RLS Policies                                                   │
-- └─────────────────────────────────────────────────────────────────┘

-- All user-data tables have RLS on
ALTER TABLE "user"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction          ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_prediction  ENABLE ROW LEVEL SECURITY;
ALTER TABLE post                ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievement    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification        ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscription   ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_intent        ENABLE ROW LEVEL SECURITY;

-- Reference/tournament tables: datos PÚBLICOS del torneo. RLS activada con
-- lectura abierta (USING true) — si se activa RLS sin policy, los socios reciben
-- 0 filas (home sin "próximo partido", /prode sin partidos). Ver migración
-- 20260530_reference_tables_rls.sql.
ALTER TABLE tournament          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team                ENABLE ROW LEVEL SECURITY;
ALTER TABLE player              ENABLE ROW LEVEL SECURITY;
ALTER TABLE match               ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_result        ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_snapshot    ENABLE ROW LEVEL SECURITY;

-- Helper de moderación: ¿el usuario actual es admin? SECURITY DEFINER para poder
-- leer "user" sin chocar con sus propias RLS. Definido antes de las policies que
-- lo usan (post / comment / storage).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT u.is_admin FROM "user" u WHERE u.id = auth.uid()), false);
$$;

CREATE POLICY "Lectura pública torneo"     ON tournament          FOR SELECT USING (true);
CREATE POLICY "Lectura pública grupos"     ON groups              FOR SELECT USING (true);
CREATE POLICY "Lectura pública equipos"    ON team                FOR SELECT USING (true);
CREATE POLICY "Lectura pública jugadores"  ON player              FOR SELECT USING (true);
CREATE POLICY "Lectura pública partidos"   ON match               FOR SELECT USING (true);
CREATE POLICY "Lectura pública resultados" ON match_result        FOR SELECT USING (true);
CREATE POLICY "Lectura pública logros"     ON achievement_catalog FOR SELECT USING (true);
CREATE POLICY "Socios leen ranking"        ON ranking_snapshot    FOR SELECT USING (auth.role() = 'authenticated');

-- Common pattern: authenticated socios SELECT all, INSERT/UPDATE/DELETE own only
CREATE POLICY "Socios pueden leer todos los users públicos"
  ON "user" FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "Cada user actualiza su propio perfil"
  ON "user" FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Socios leen predicciones públicas"
  ON prediction FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM match WHERE id = match_id AND status = 'finished')
         OR EXISTS (SELECT 1 FROM "user" WHERE id = prediction.user_id AND visibility = 'public'))
  );

CREATE POLICY "User inserta sus predicciones"
  ON prediction FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User actualiza sus predicciones (si no cerró el partido)"
  ON prediction FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM match WHERE id = match_id AND (kickoff_at - INTERVAL '20 minutes') > NOW())
  );

-- Posts y comments: lectura abierta a socios; CRUD del dueño
CREATE POLICY "Socios leen posts no borrados"
  ON post FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "User crea sus posts"
  ON post FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Borra post: dueño o admin"
  ON post FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Socios leen comentarios"
  ON comment FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "User crea comentarios"
  ON comment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Borra comentario: dueño o admin"
  ON comment FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Socios ven todas las reacciones"
  ON reaction FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "User reacciona / des-reacciona"
  ON reaction FOR ALL
  USING (auth.uid() = user_id);

-- Notification: solo el dueño ve sus notifs
CREATE POLICY "User ve sus notifs"
  ON notification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User marca leídas"
  ON notification FOR UPDATE
  USING (auth.uid() = user_id);
-- NOTA: notification no tiene policy de INSERT a propósito. Las notifs propias
-- (logros) se insertan con service_role desde processAchievements(); las
-- sociales vía trigger SECURITY DEFINER; las del cron con service_role.

-- Logros desbloqueados: lectura para socios (visibles en perfiles), inserción
-- del propio. SIN estas policies, processAchievements() falla por RLS y los
-- logros nunca se desbloquean ni suman puntos.
CREATE POLICY "Socios leen logros"
  ON user_achievement FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "User desbloquea sus logros"
  ON user_achievement FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Functions                                                      │
-- └─────────────────────────────────────────────────────────────────┘

-- Calcula puntos de una predicción dada (sin grabar)
-- Implementa scoring del Agente 2 §7 (lo agresivo)
CREATE OR REPLACE FUNCTION fn_calculate_points(p_prediction_id UUID)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_home_pred SMALLINT; v_away_pred SMALLINT;
  v_home_real SMALLINT; v_away_real SMALLINT;
  v_phase     phase_t;
  v_mult      NUMERIC;
  v_base      INTEGER := 0;
  v_diff_pred INTEGER;
  v_diff_real INTEGER;
BEGIN
  SELECT p.home_score, p.away_score, mr.home_score, mr.away_score, m.phase
    INTO v_home_pred, v_away_pred, v_home_real, v_away_real, v_phase
  FROM prediction p
  JOIN match m ON m.id = p.match_id
  JOIN match_result mr ON mr.match_id = m.id
  WHERE p.id = p_prediction_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- Multiplicador por fase
  v_mult := CASE v_phase
    WHEN 'groups'      THEN 1
    WHEN 'round-of-16' THEN 2
    WHEN 'quarter'     THEN 3
    WHEN 'semi'        THEN 4
    WHEN 'final'       THEN 5
  END;

  -- Acierto exacto
  IF v_home_pred = v_home_real AND v_away_pred = v_away_real THEN
    v_base := 8;
  ELSE
    -- Ganador correcto
    IF (v_home_pred > v_away_pred AND v_home_real > v_away_real)
       OR (v_home_pred < v_away_pred AND v_home_real < v_away_real)
    THEN
      v_base := 3;
    ELSIF v_home_pred = v_away_pred AND v_home_real = v_away_real THEN
      -- Empate sin score exacto
      v_base := 1;
    END IF;

    -- Bonus diferencia de gol (cuando no acertó exacto)
    v_diff_pred := v_home_pred - v_away_pred;
    v_diff_real := v_home_real - v_away_real;
    IF v_diff_pred = v_diff_real AND v_base > 0 THEN
      v_base := v_base + 2;
    END IF;
  END IF;

  RETURN ROUND(v_base * v_mult)::INTEGER;
END $$;

-- Procesa todos los puntos de las predicciones de un match recién settled
CREATE OR REPLACE FUNCTION fn_settle_match(p_match_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_pred RECORD;
  v_points INTEGER;
BEGIN
  FOR v_pred IN
    SELECT id, user_id FROM prediction WHERE match_id = p_match_id AND points_earned IS NULL
  LOOP
    v_points := fn_calculate_points(v_pred.id);
    UPDATE prediction
       SET points_earned = v_points,
           updated_at = NOW()
     WHERE id = v_pred.id;

    UPDATE "user"
       SET total_points = total_points + v_points
     WHERE id = v_pred.user_id;
  END LOOP;

  -- Recalcular posiciones (Agente 9 implementa más sofisticado)
  PERFORM fn_recalculate_positions();
END $$;

-- Recalcula ranking global
CREATE OR REPLACE FUNCTION fn_recalculate_positions()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, joined_at ASC) AS pos
    FROM "user"
    WHERE deleted_at IS NULL
  )
  UPDATE "user" u SET position = r.pos FROM ranked r WHERE u.id = r.id;
END $$;

-- Trigger: cuando un match pasa a 'finished', invocar settle
CREATE OR REPLACE FUNCTION trg_match_finished()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    PERFORM fn_settle_match(NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_match_status_change
  AFTER UPDATE OF status ON match
  FOR EACH ROW EXECUTE FUNCTION trg_match_finished();

-- Trigger: mantener post.reaction_count y comment_count consistentes
-- SECURITY DEFINER: el conteo updatea post/comment aunque quien reacciona no sea
-- el dueño (si no, la RLS de post/comment bloquea el UPDATE y el contador no sube).
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
      UPDATE post SET reaction_count = reaction_count - 1 WHERE id = OLD.target_id;
    ELSE
      UPDATE comment SET reaction_count = reaction_count - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_reaction_count_change
  AFTER INSERT OR DELETE ON reaction
  FOR EACH ROW EXECUTE FUNCTION trg_reaction_count();

-- Notificaciones sociales (Twitter/FB): avisar al dueño del post al recibir
-- comentario o reacción. SECURITY DEFINER porque el actor inserta la notif de
-- otro usuario (la policy de notification solo permite auth.uid()=user_id).
CREATE OR REPLACE FUNCTION trg_notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_actor TEXT;
BEGIN
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (v_owner, 'comment', 'Nuevo comentario',
          COALESCE(v_actor, 'Alguien') || ' comentó tu publicación',
          '/app/muro/' || NEW.post_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comment_notify ON comment;
CREATE TRIGGER trg_comment_notify
  AFTER INSERT ON comment
  FOR EACH ROW EXECUTE FUNCTION trg_notify_comment();

CREATE OR REPLACE FUNCTION trg_notify_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_actor TEXT;
BEGIN
  IF NEW.target_type <> 'post' THEN RETURN NEW; END IF;
  SELECT user_id INTO v_owner FROM post WHERE id = NEW.target_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT name INTO v_actor FROM "user" WHERE id = NEW.user_id;
  INSERT INTO notification (user_id, type, title, body, deep_link)
  VALUES (v_owner, 'reaction', 'Nueva reacción',
          'A ' || COALESCE(v_actor, 'alguien') || ' le gustó tu publicación',
          '/app/muro/' || NEW.target_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reaction_notify ON reaction;
CREATE TRIGGER trg_reaction_notify
  AFTER INSERT ON reaction
  FOR EACH ROW EXECUTE FUNCTION trg_notify_reaction();

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  Materialized views (refresh on demand)                         │
-- └─────────────────────────────────────────────────────────────────┘

-- Resumen del usuario para el share endpoint (Agente 5)
CREATE MATERIALIZED VIEW mv_user_summary AS
SELECT
  u.id           AS user_id,
  u.name         AS user_name,
  u.initials,
  u.avatar_url,
  u.level,
  u.total_points,
  u.position,
  sp.champion_code,
  sp.runner_up_code,
  sp.top_scorer_player_id,
  p.name         AS top_scorer_name,
  p.team_code    AS top_scorer_team
FROM "user" u
LEFT JOIN special_prediction sp ON sp.user_id = u.id
LEFT JOIN player p ON p.id = sp.top_scorer_player_id
WHERE u.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_user_summary_pk ON mv_user_summary(user_id);

-- Ranking global con metadata para el feed
CREATE MATERIALIZED VIEW mv_ranking_global AS
SELECT
  u.position,
  u.id           AS user_id,
  u.name         AS user_name,
  u.initials,
  u.avatar_url,
  u.level,
  u.total_points AS points
FROM "user" u
WHERE u.deleted_at IS NULL
ORDER BY u.position;

CREATE UNIQUE INDEX idx_mv_ranking_global_pk ON mv_ranking_global(user_id);
CREATE INDEX idx_mv_ranking_global_pos ON mv_ranking_global(position);

-- Refresh manual (Agente 9 llama tras fn_settle_match)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global;
