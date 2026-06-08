-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Wave 3 Security Hardening                                   │
-- │  2026-06-07 · Adversarial Audit Remediation                             │
-- │                                                                         │
-- │  CRÍTICOS:                                                               │
-- │    SCORE-001 — fn_settle_match / fn_recalculate_positions / fn_resettle │
-- │                ejecutables por authenticated vía RPC → REVOKE           │
-- │                                                                         │
-- │  ALTOS:                                                                  │
-- │    RLS-002   — user_achievement INSERT policy permite auto-grant         │
-- │    RLS-004   — invite_code sin RLS                                       │
-- │    RLS-008   — materialized views visibles via REST                      │
-- │                                                                         │
-- │  MEDIOS:                                                                 │
-- │    SCORE-002 — fn_calculate_points: ELSE NULL en phase + sin GREATEST   │
-- │                                                                         │
-- │  NOTA: AUTH-004 (is_admin escalation) ya fue cerrado en la migración    │
-- │  20260606_rls_hardening.sql mediante column-level grants:               │
-- │    REVOKE UPDATE ON "user" FROM authenticated;                          │
-- │    GRANT UPDATE (avatar_url, notification_prefs, visibility) ...        │
-- └─────────────────────────────────────────────────────────────────────────┘

-- ─── CRÍTICO SCORE-001: REVOKE EXECUTE en funciones de scoring ────────────
-- fn_settle_match, fn_recalculate_positions y fn_resettle_match eran
-- EJECUTABLES por cualquier usuario autenticado vía supabase.rpc("fn_...").
-- Un socio podía:
--   · Llamar fn_settle_match(any_match_id) y liquidar partidos antes de tiempo
--   · Manipular total_points / position de cualquier usuario
--   · Obtener puntos artificiales llamando fn_resettle_match en partidos propios
-- Fix: REVOKE EXECUTE de public / anon / authenticated.
-- Solo service_role puede ejecutar (los crons, triggers y server actions usan
-- createAdminClient() o SECURITY DEFINER → service role).

REVOKE EXECUTE ON FUNCTION public.fn_settle_match(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_settle_match(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_settle_match(UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_recalculate_positions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_recalculate_positions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_recalculate_positions() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_calculate_points(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_calculate_points(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_calculate_points(UUID) FROM authenticated;

-- fn_resettle_match (agregada en 20260604_resettle_match.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'fn_resettle_match' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.fn_resettle_match(UUID) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.fn_resettle_match(UUID) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.fn_resettle_match(UUID) FROM authenticated';
  END IF;
END $$;

-- Re-grant explícito a service_role para mantener el acceso de los crons/triggers.
GRANT EXECUTE ON FUNCTION public.fn_calculate_points(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_settle_match(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_recalculate_positions() TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'fn_resettle_match' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.fn_resettle_match(UUID) TO service_role';
  END IF;
END $$;

-- ─── ALTO RLS-002: Eliminar policy de INSERT en user_achievement ──────────
-- processAchievements() usa createAdminClient() (service_role) para insertar
-- logros → la policy de INSERT para el propio usuario era dead code respecto
-- al flujo normal. Pero vía la API REST directa (POST /rest/v1/user_achievement)
-- un socio podía auto-otorgarse CUALQUIER logro con achievement_id arbitrario,
-- saltando el evaluador de triggers y ganando bonus points sin merecerlos.
-- Fix: DROP de la policy. service_role bypassea RLS → el flujo normal no se ve afectado.

DROP POLICY IF EXISTS "User desbloquea sus logros" ON user_achievement;

-- ─── ALTO RLS-004: Enable RLS en invite_code ──────────────────────────────
-- invite_code no tenía RLS habilitado → cualquier usuario autenticado podía
-- GET /rest/v1/invite_code y obtener todos los códigos no usados para registrar
-- socios extras sin invitación, o enumerar el padrón de invitaciones.
-- validateInviteAction() y signUpAction() usan createAdminClient() (service_role)
-- → bypassean RLS, siguen funcionando sin cambios.

ALTER TABLE invite_code ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar códigos de invitación.
CREATE POLICY "Solo admins leen invite_codes"
  ON invite_code FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Solo admins crean invite_codes"
  ON invite_code FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admins actualizan invite_codes"
  ON invite_code FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── ALTO RLS-008: REVOKE SELECT en materialized views ────────────────────
-- mv_user_summary y mv_ranking_global no soportan RLS nativamente.
-- Cualquier usuario autenticado podía consultar GET /rest/v1/mv_user_summary
-- y obtener: nombre, puntos, posición, champion_code y avatar de TODOS los
-- socios — incluyendo los que se marcaron como visibility='private'.
-- Fix: REVOKE SELECT de anon y authenticated. Solo service_role puede leer.
-- Impacto funcional: cero. Todas las queries del app usan createAdminClient()
-- (share endpoint, ranking cron, refreshViews) → service_role bypasea el REVOKE.

REVOKE SELECT ON public.mv_user_summary FROM anon;
REVOKE SELECT ON public.mv_user_summary FROM authenticated;

REVOKE SELECT ON public.mv_ranking_global FROM anon;
REVOKE SELECT ON public.mv_ranking_global FROM authenticated;

-- Re-grant explícito a service_role
GRANT SELECT ON public.mv_user_summary TO service_role;
GRANT SELECT ON public.mv_ranking_global TO service_role;

-- ─── MEDIO SCORE-002: fn_calculate_points — ELSE NULL + sin GREATEST ──────
-- La versión original tenía dos bugs:
--   1. CASE v_phase ... END sin ELSE → si algún día se agrega una phase_t no
--      contemplada, v_mult es NULL → ROUND(v_base * NULL) = NULL → UPDATE SET
--      points_earned = NULL, total_points = total + NULL = NULL (silencioso).
--   2. Sin GREATEST(0,...) — aunque v_base siempre es ≥0 con las reglas actuales,
--      un refactor futuro podría generar negativo; el guard lo previene.
-- Fix: ELSE 1 (fase desconocida = multiplicador de grupos, nunca infla) + GREATEST.

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

  -- Multiplicador por fase (ELSE 1: fase desconocida = grupos, no colapsa ni infla)
  v_mult := CASE v_phase
    WHEN 'groups'      THEN 1
    WHEN 'round-of-16' THEN 2
    WHEN 'quarter'     THEN 3
    WHEN 'semi'        THEN 4
    WHEN 'final'       THEN 5
    ELSE 1
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

  -- GREATEST guard: nunca devuelve negativo (defensivo para refactors futuros)
  RETURN GREATEST(0, ROUND(v_base * v_mult)::INTEGER);
END $$;

-- fn_calculate_points reemplazada → mantener el REVOKE del inicio de esta migración.
-- service_role ya tiene EXECUTE por grant explícito de arriba.
