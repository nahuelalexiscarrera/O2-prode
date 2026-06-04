-- 20260604_resettle_match.sql
--
-- Permite CORREGIR el resultado de un partido ya finalizado y re-puntuar.
-- fn_settle_match solo procesa predicciones con points_earned IS NULL (idempotente
-- para no duplicar puntos), así que para una corrección hay que primero revertir
-- los puntos ya asignados de ese partido y volver a puntuar desde cero.

CREATE OR REPLACE FUNCTION fn_resettle_match(p_match_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v_pred RECORD;
BEGIN
  -- 1) revertir los puntos ya asignados de este partido
  FOR v_pred IN
    SELECT id, user_id, points_earned
    FROM prediction
    WHERE match_id = p_match_id AND points_earned IS NOT NULL
  LOOP
    UPDATE "user"
       SET total_points = GREATEST(0, total_points - v_pred.points_earned)
     WHERE id = v_pred.user_id;
    UPDATE prediction SET points_earned = NULL WHERE id = v_pred.id;
  END LOOP;

  -- 2) re-puntuar limpio (también recalcula posiciones)
  PERFORM fn_settle_match(p_match_id);
END $$;
