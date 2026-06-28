-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Cierre de predicción: 1 hora → 20 minutos antes del kickoff  │
-- │  2026-06-28                                                              │
-- │                                                                          │
-- │  Compensación: el candado de la tab "Eliminatorias" confundió a los      │
-- │  socios (creyeron que estaba bloqueada) y no predijeron los 16avos. Se   │
-- │  relaja la ventana de cierre de `prediction` de (kickoff - 1h) a         │
-- │  (kickoff - 20min) para que todavía puedan predecir los partidos de      │
-- │  eliminatorias que aún no arrancaron.                                    │
-- │                                                                          │
-- │  Solo ENSANCHA la ventana (más permisivo). 20 min sigue siendo ANTES     │
-- │  del kickoff → no se rompe integridad (no se conoce el resultado).       │
-- │  Reemplaza las policies de 20260606_rls_hardening.sql (que usaban 1h).   │
-- │  NO toca special_prediction (cierra por primer kickoff, otro concepto).  │
-- │                                                                          │
-- │  Debe quedar en paridad con lib/predictions/lockout.ts (20 min).         │
-- └─────────────────────────────────────────────────────────────────────────┘

-- INSERT: crear predicción solo si el partido está scheduled y faltan >20min.
DROP POLICY IF EXISTS "User inserta sus predicciones" ON prediction;
CREATE POLICY "User inserta sus predicciones"
  ON prediction FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM match
      WHERE id = prediction.match_id
        AND status = 'scheduled'
        AND (kickoff_at - INTERVAL '20 minutes') > NOW()
    )
  );

-- UPDATE: editar predicción solo si el partido está scheduled y faltan >20min.
DROP POLICY IF EXISTS "User actualiza sus predicciones (si no cerró el partido)" ON prediction;
CREATE POLICY "User actualiza sus predicciones (si no cerró el partido)"
  ON prediction FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM match
      WHERE id = prediction.match_id
        AND status = 'scheduled'
        AND (kickoff_at - INTERVAL '20 minutes') > NOW()
    )
  );
