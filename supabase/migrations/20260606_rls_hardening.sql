-- 20260606_rls_hardening.sql
--
-- Wave 0 de la auditoría QA. La RLS es el límite de seguridad REAL: el anon key
-- es público y cualquier socio logueado puede hablarle a PostgREST directo,
-- salteándose las server actions. Las reglas del juego viven acá ahora.
--
-- Cierra: C2 (ver predicciones ajenas antes del cierre), C3 (escalada/inflar
-- puntos), C4 (predecir partido en juego), C5 (editar especial post-cierre).

-- ─── W0-1a · prediction SELECT: no exponer predicciones ajenas antes del cierre ─
-- Antes: la rama visibility='public' no chequeaba el estado del match → se leían
-- las predicciones rivales de un partido futuro. Ahora: las propias siempre; las
-- ajenas SOLO si el partido ya arrancó/terminó Y el dueño es 'public'.
DROP POLICY IF EXISTS "Socios leen predicciones públicas" ON prediction;
CREATE POLICY "Socios leen predicciones públicas"
  ON prediction FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      user_id = auth.uid()
      OR (
        EXISTS (
          SELECT 1 FROM match
          WHERE id = prediction.match_id
            AND (status = 'finished' OR kickoff_at <= NOW())
        )
        AND EXISTS (
          SELECT 1 FROM "user"
          WHERE id = prediction.user_id AND visibility = 'public'
        )
      )
    )
  );

-- ─── W0-1b · prediction INSERT: imponer el cierre en la DB (igual que el UPDATE) ─
-- Antes: INSERT solo exigía auth.uid()=user_id → se podía insertar con el partido
-- en juego. Ahora: solo si el match está 'scheduled' y a >1h del kickoff.
DROP POLICY IF EXISTS "User inserta sus predicciones" ON prediction;
CREATE POLICY "User inserta sus predicciones"
  ON prediction FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM match
      WHERE id = prediction.match_id
        AND status = 'scheduled'
        AND (kickoff_at - INTERVAL '1 hour') > NOW()
    )
  );

-- UPDATE: agrega status='scheduled' al gate temporal, para alinear con la action.
DROP POLICY IF EXISTS "User actualiza sus predicciones (si no cerró el partido)" ON prediction;
CREATE POLICY "User actualiza sus predicciones (si no cerró el partido)"
  ON prediction FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM match
      WHERE id = prediction.match_id
        AND status = 'scheduled'
        AND (kickoff_at - INTERVAL '1 hour') > NOW()
    )
  );

-- ─── W0-2 · user: el socio solo edita columnas NO sensibles ─────────────────────
-- La policy de UPDATE no restringe columnas, así que un socio podía hacer
-- UPDATE user SET is_admin=true, total_points=999999 sobre su propia fila. Con
-- privilegios a nivel columna, authenticated solo puede tocar avatar/prefs/
-- visibilidad. is_admin/total_points/position/level/email/deleted_at quedan
-- exclusivamente para service_role (server actions con admin client).
REVOKE UPDATE ON "user" FROM authenticated;
GRANT UPDATE (avatar_url, notification_prefs, visibility) ON "user" TO authenticated;

-- ─── W0-3 · special_prediction: cerrar al primer kickoff ────────────────────────
-- La policy gateaba sobre locked_at, que NUNCA se setea (código muerto) → editable
-- para siempre. Ahora gatea directo contra el inicio del torneo: editable solo
-- mientras NINGÚN partido haya arrancado.
DROP POLICY IF EXISTS "User crea su predicción especial" ON special_prediction;
CREATE POLICY "User crea su predicción especial"
  ON special_prediction FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM match WHERE kickoff_at <= NOW())
  );

DROP POLICY IF EXISTS "User edita su predicción especial (si no cerró)" ON special_prediction;
CREATE POLICY "User edita su predicción especial (si no cerró)"
  ON special_prediction FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM match WHERE kickoff_at <= NOW())
  );
