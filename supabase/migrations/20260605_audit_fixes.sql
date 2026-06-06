-- 20260605_audit_fixes.sql
--
-- Arreglos surgidos de la auditoría de cierre:
--   1. Columna position_last_week (el cron weekly-positions la usa y sin ella
--      crashea con "column does not exist" cada corrida → P04 nunca evalúa).
--   2. special_prediction: tenía RLS habilitado SIN policies (deny-all) → el
--      socio no podía leer ni cargar su predicción especial.
--   3. share_intent: ídem (RLS sin policy). Se agregan policies de dueño.
--   4. Realtime: agregar post/comment/reaction a la publicación supabase_realtime
--      (sin esto los INSERT/UPDATE nunca llegan al cliente → banner "posts nuevos",
--      stream de comentarios y borrado en vivo no funcionan en prod).

-- ─── 1. position_last_week ────────────────────────────────────────────
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS position_last_week INTEGER;

-- ─── 2. Predicción especial: policies de dueño ────────────────────────
DROP POLICY IF EXISTS "User lee su predicción especial" ON special_prediction;
CREATE POLICY "User lee su predicción especial"
  ON special_prediction FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User crea su predicción especial" ON special_prediction;
CREATE POLICY "User crea su predicción especial"
  ON special_prediction FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User edita su predicción especial (si no cerró)" ON special_prediction;
CREATE POLICY "User edita su predicción especial (si no cerró)"
  ON special_prediction FOR UPDATE
  USING (auth.uid() = user_id AND locked_at IS NULL);

-- ─── 3. share_intent: policies de dueño ───────────────────────────────
DROP POLICY IF EXISTS "User ve sus shares" ON share_intent;
CREATE POLICY "User ve sus shares"
  ON share_intent FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User registra sus shares" ON share_intent;
CREATE POLICY "User registra sus shares"
  ON share_intent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. Realtime publication ──────────────────────────────────────────
ALTER TABLE post REPLICA IDENTITY FULL;
ALTER TABLE comment REPLICA IDENTITY FULL;
ALTER TABLE reaction REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'post') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE post;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comment') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comment;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reaction') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reaction;
  END IF;
END $$;
