-- 20260612_match_live_scores.sql
--
-- Sprint B (live scores en el home): el cron sync-results (cada 2 min) ya sabe el
-- score parcial de un partido IN_PLAY (football-data.org lo manda en
-- score.fullTime mientras corre el juego), pero no lo persistía: la UI solo podía
-- decir "En vivo" sin marcador. Estas columnas guardan el último score conocido
-- del partido en curso; al finalizar quedan con el score final (match_result
-- sigue siendo la fuente de verdad del settle — esto es solo display).
--
-- Aditiva y NO destructiva: columnas nullable, sin default, sin constraint.

ALTER TABLE match ADD COLUMN IF NOT EXISTS live_home_score SMALLINT;
ALTER TABLE match ADD COLUMN IF NOT EXISTS live_away_score SMALLINT;

-- Realtime: la UI del home se suscribe a UPDATE en match para refrescar el score
-- sin reload. Igual que post/comment/reaction en 20260605_audit_fixes.sql, la
-- tabla tiene que estar en la publicación supabase_realtime (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'match') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE match;
  END IF;
END $$;
