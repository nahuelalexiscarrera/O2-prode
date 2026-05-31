-- 20260531_user_achievement_rls.sql
--
-- FIX: la tabla user_achievement tenía RLS ACTIVADA pero SIN ninguna policy.
-- Resultado: processAchievements() (que corre en contexto del socio autenticado)
-- recibía 42501 al insertar → el catch lo silenciaba → ningún logro se
-- desbloqueaba ni sumaba puntos, y la pantalla de Logros mostraba todo bloqueado
-- (el SELECT también devolvía 0 filas).
--
-- Se agregan: lectura para socios autenticados (logros visibles en perfiles) e
-- inserción del propio usuario.

ALTER TABLE user_achievement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Socios leen logros" ON user_achievement;
DROP POLICY IF EXISTS "User desbloquea sus logros" ON user_achievement;

CREATE POLICY "Socios leen logros"
  ON user_achievement FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "User desbloquea sus logros"
  ON user_achievement FOR INSERT
  WITH CHECK (auth.uid() = user_id);
