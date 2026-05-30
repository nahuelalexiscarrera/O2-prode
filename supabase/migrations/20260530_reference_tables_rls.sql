-- 20260530_reference_tables_rls.sql
--
-- FIX (Sprint 8, beta): en producción las tablas de referencia del torneo
-- quedaron con RLS ACTIVADA pero SIN policy de lectura. Resultado: cualquier
-- socio autenticado recibía 0 filas (solo service_role veía los datos).
--
-- Síntomas en la app:
--   • Home: "No hay partidos programados" (getNextMatch → null).
--   • /prode: "No hay partidos cargados para el Grupo X" (getMatchesByGroup → []).
--
-- Estos datos son PÚBLICOS del torneo (fixture, equipos, jugadores, resultados),
-- así que la lectura es abierta. La app igualmente gatea las pantallas por auth.
-- `USING (true)` mantiene legible también el endpoint de share (contexto anon).

ALTER TABLE tournament          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team                ENABLE ROW LEVEL SECURITY;
ALTER TABLE player              ENABLE ROW LEVEL SECURITY;
ALTER TABLE match               ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_result        ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_snapshot    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública torneo"     ON tournament;
DROP POLICY IF EXISTS "Lectura pública grupos"     ON groups;
DROP POLICY IF EXISTS "Lectura pública equipos"    ON team;
DROP POLICY IF EXISTS "Lectura pública jugadores"  ON player;
DROP POLICY IF EXISTS "Lectura pública partidos"   ON match;
DROP POLICY IF EXISTS "Lectura pública resultados" ON match_result;
DROP POLICY IF EXISTS "Lectura pública logros"     ON achievement_catalog;
DROP POLICY IF EXISTS "Socios leen ranking"        ON ranking_snapshot;

CREATE POLICY "Lectura pública torneo"     ON tournament          FOR SELECT USING (true);
CREATE POLICY "Lectura pública grupos"     ON groups              FOR SELECT USING (true);
CREATE POLICY "Lectura pública equipos"    ON team                FOR SELECT USING (true);
CREATE POLICY "Lectura pública jugadores"  ON player              FOR SELECT USING (true);
CREATE POLICY "Lectura pública partidos"   ON match               FOR SELECT USING (true);
CREATE POLICY "Lectura pública resultados" ON match_result        FOR SELECT USING (true);
CREATE POLICY "Lectura pública logros"     ON achievement_catalog FOR SELECT USING (true);
CREATE POLICY "Socios leen ranking"        ON ranking_snapshot    FOR SELECT USING (auth.role() = 'authenticated');
