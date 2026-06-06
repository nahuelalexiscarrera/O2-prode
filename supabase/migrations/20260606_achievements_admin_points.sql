-- 20260606_achievements_admin_points.sql
--
-- Reacomodo de logros para el lanzamiento:
--   1. Se elimina P05 "Campeón": no tiene sentido darle MÁS puntos al que ya
--      ganó el ranking (circular). Primero se borran sus filas en
--      user_achievement (FK) y después la fila del catálogo.
--   2. Los logros de posición que premian "estar arriba" (Top 10/Podio/Líder)
--      arrancan en 0 puntos; el admin los ajusta desde el panel
--      (/app/admin/logros → achievement_catalog.points_bonus). El awarding ahora
--      lee points_bonus de la DB, así que esto define el valor real.
--   3. Se agregan 2 logros de predicción especial: A06 Subcampeón y A07
--      Finalistas (acertar a los 2 finalistas, sin importar el orden).

-- ─── 1. Eliminar P05 ──────────────────────────────────────────────────
DELETE FROM user_achievement WHERE achievement_id = 'P05';
DELETE FROM achievement_catalog WHERE id = 'P05';

-- ─── 2. Posición: puntos por defecto en 0 (insignias; el admin los sube) ──
UPDATE achievement_catalog SET points_bonus = 0
  WHERE id IN ('P01', 'P02', 'P03');

-- ─── 3. Nuevos logros de predicción especial ──────────────────────────
INSERT INTO achievement_catalog (id, category, name, description, icon_ref, points_bonus, trigger_key) VALUES
('A06', 'skill', 'Subcampeón', 'Acertá al subcampeón del Mundial antes del torneo.', 'medal',        30, 'runner_up_correct'),
('A07', 'skill', 'Finalistas', 'Acertá a los 2 finalistas del Mundial.',             'world-trophy', 40, 'finalists_correct')
ON CONFLICT (id) DO UPDATE SET
  category     = EXCLUDED.category,
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  icon_ref     = EXCLUDED.icon_ref,
  trigger_key  = EXCLUDED.trigger_key;
  -- OJO: NO piso points_bonus en el UPDATE para no revertir lo que el admin haya
  -- editado. En el INSERT inicial usa el valor de arriba.
