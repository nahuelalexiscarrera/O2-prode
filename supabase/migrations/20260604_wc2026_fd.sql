-- 20260604_wc2026_fd.sql
--
-- Soporte del formato real del Mundial 2026 (48 equipos) + integración con
-- football-data.org.
--
--   1. phase_t: agregar 'round-of-32' (LAST_32). El formato de 48 equipos tiene
--      un cruce más que el viejo de 32 (R32 → R16 → QF → SF → Final).
--   2. match.fd_id: id del partido en football-data.org, clave estable para que
--      el cron upsertee resultados y CREE los cruces de eliminatorias a medida
--      que se definen (así las fases se desbloquean solas).
--   3. fn_calculate_points: multiplicador de R32 = 2 (igual que R16 — no cambia
--      ningún valor existente, así la paridad con lib/scoring se mantiene).
--
-- IMPORTANTE: corré el ALTER TYPE primero y confirmá (commit) antes de insertar
-- filas con phase='round-of-32'. Si el editor lo corre todo junto, está OK porque
-- la función usa v_phase::text (no necesita el valor del enum en la misma tx).

-- 1) Nuevo valor del enum de fases
ALTER TYPE phase_t ADD VALUE IF NOT EXISTS 'round-of-32' AFTER 'groups';

-- 2) Clave estable hacia football-data.org
ALTER TABLE match ADD COLUMN IF NOT EXISTS fd_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_fd_id ON match(fd_id) WHERE fd_id IS NOT NULL;

-- 3) Scoring con R32 (v_phase::text evita el problema de usar el valor nuevo del
--    enum en la misma transacción que el ADD VALUE)
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

  v_mult := CASE v_phase::text
    WHEN 'groups'      THEN 1
    WHEN 'round-of-32' THEN 2
    WHEN 'round-of-16' THEN 2
    WHEN 'quarter'     THEN 3
    WHEN 'semi'        THEN 4
    WHEN 'final'       THEN 5
    ELSE 1
  END;

  IF v_home_pred = v_home_real AND v_away_pred = v_away_real THEN
    v_base := 8;
  ELSE
    IF (v_home_pred > v_away_pred AND v_home_real > v_away_real)
       OR (v_home_pred < v_away_pred AND v_home_real < v_away_real)
    THEN
      v_base := 3;
    ELSIF v_home_pred = v_away_pred AND v_home_real = v_away_real THEN
      v_base := 1;
    END IF;

    v_diff_pred := v_home_pred - v_away_pred;
    v_diff_real := v_home_real - v_away_real;
    IF v_diff_pred = v_diff_real AND v_base > 0 THEN
      v_base := v_base + 2;
    END IF;
  END IF;

  RETURN ROUND(v_base * v_mult)::INTEGER;
END $$;
