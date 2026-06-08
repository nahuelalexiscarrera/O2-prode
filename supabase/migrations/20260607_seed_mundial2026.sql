-- 20260607_seed_mundial2026.sql
--
-- Seed inicial del Mundial 2026: torneo, 12 grupos, 48 selecciones, 72 partidos
-- de fase de grupos. Idempotente: usa ON CONFLICT DO NOTHING en todas las tablas,
-- y el bloque de matches se salta si el torneo ya tiene partidos cargados.
--
-- Para aplicar: SQL Editor de Supabase → pegar y ejecutar. O `supabase db push`.
-- Si el sorteo definitivo de FIFA modifica la composición de grupos, actualizá los
-- datos en data/seed/ y re-ejecutá (los ON CONFLICT harán que solo inserte lo nuevo).

DO $$
DECLARE
  v_tid UUID;
BEGIN

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. TORNEO
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO tournament (slug, display_name, short_name, start_date, end_date, phase_config, active)
VALUES (
  'mundial-2026',
  'FIFA World Cup 2026',
  'Mundial 2026',
  '2026-06-11',
  '2026-07-19',
  '{"phases":["groups","round-of-32","round-of-16","quarter","semi","final"]}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

SELECT id INTO v_tid FROM tournament WHERE slug = 'mundial-2026';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. GRUPOS (A–L)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO groups (id, tournament_id, letter) VALUES
  ('A', v_tid, 'A'), ('B', v_tid, 'B'), ('C', v_tid, 'C'), ('D', v_tid, 'D'),
  ('E', v_tid, 'E'), ('F', v_tid, 'F'), ('G', v_tid, 'G'), ('H', v_tid, 'H'),
  ('I', v_tid, 'I'), ('J', v_tid, 'J'), ('K', v_tid, 'K'), ('L', v_tid, 'L')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. SELECCIONES (48 equipos)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO team (code, name, group_id) VALUES
  -- Grupo A
  ('mx', 'México',           'A'),
  ('ar', 'Argentina',        'A'),
  ('jp', 'Japón',            'A'),
  ('qa', 'Qatar',            'A'),
  -- Grupo B
  ('us', 'Estados Unidos',   'B'),
  ('br', 'Brasil',           'B'),
  ('kr', 'Corea del Sur',    'B'),
  ('ec', 'Ecuador',          'B'),
  -- Grupo C
  ('ca', 'Canadá',           'C'),
  ('fr', 'Francia',          'C'),
  ('ng', 'Nigeria',          'C'),
  ('uy', 'Uruguay',          'C'),
  -- Grupo D
  ('de', 'Alemania',         'D'),
  ('co', 'Colombia',         'D'),
  ('sa', 'Arabia Saudita',   'D'),
  ('se', 'Suecia',           'D'),
  -- Grupo E
  ('es', 'España',           'E'),
  ('ma', 'Marruecos',        'E'),
  ('au', 'Australia',        'E'),
  ('cr', 'Costa Rica',       'E'),
  -- Grupo F
  ('pt', 'Portugal',         'F'),
  ('ir', 'Irán',             'F'),
  ('pa', 'Panamá',           'F'),
  ('be', 'Bélgica',          'F'),
  -- Grupo G
  ('nl', 'Países Bajos',     'G'),
  ('sn', 'Senegal',          'G'),
  ('no', 'Noruega',          'G'),
  ('ws', 'Gales',            'G'),
  -- Grupo H
  ('it', 'Italia',           'H'),
  ('tn', 'Túnez',            'H'),
  ('cl', 'Chile',            'H'),
  ('jm', 'Jamaica',          'H'),
  -- Grupo I
  ('gb', 'Inglaterra',       'I'),
  ('ck', 'Rep. Checa',       'I'),
  ('py', 'Paraguay',         'I'),
  ('tr', 'Turquía',          'I'),
  -- Grupo J
  ('dk', 'Dinamarca',        'J'),
  ('om', 'Omán',             'J'),
  ('ci', 'Costa de Marfil',  'J'),
  ('hr', 'Croacia',          'J'),
  -- Grupo K
  ('pl', 'Polonia',          'K'),
  ('ke', 'Kenia',            'K'),
  ('ve', 'Venezuela',        'K'),
  ('nz', 'Nueva Zelanda',    'K'),
  -- Grupo L
  ('ch', 'Suiza',            'L'),
  ('eg', 'Egipto',           'L'),
  ('pe', 'Perú',             'L'),
  ('uz', 'Uzbekistán',       'L')
ON CONFLICT (code) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. PARTIDOS — 72 matches de fase de grupos (6 por grupo × 12 grupos)
-- Solo inserta si el torneo todavía no tiene partidos cargados (idempotencia).
-- ──────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM match WHERE tournament_id = v_tid) THEN
  INSERT INTO match (tournament_id, phase, group_id, home_code, away_code, kickoff_at, venue_city, status) VALUES

  -- ── Grupo A: mx · ar · jp · qa ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','A','mx','ar','2026-06-11T16:00:00Z','Ciudad de México','scheduled'),
  (v_tid,'groups','A','jp','qa','2026-06-11T22:00:00Z','Guadalajara','scheduled'),
  -- Jornada 2
  (v_tid,'groups','A','mx','jp','2026-06-19T16:00:00Z','Monterrey','scheduled'),
  (v_tid,'groups','A','ar','qa','2026-06-19T22:00:00Z','Ciudad de México','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','A','mx','qa','2026-06-27T22:00:00Z','Guadalajara','scheduled'),
  (v_tid,'groups','A','ar','jp','2026-06-27T22:00:00Z','Ciudad de México','scheduled'),

  -- ── Grupo B: us · br · kr · ec ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','B','us','br','2026-06-11T19:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','B','kr','ec','2026-06-12T01:00:00Z','Los Ángeles','scheduled'),
  -- Jornada 2
  (v_tid,'groups','B','us','kr','2026-06-19T19:00:00Z','Seattle','scheduled'),
  (v_tid,'groups','B','br','ec','2026-06-20T01:00:00Z','Miami','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','B','us','ec','2026-06-28T01:00:00Z','Dallas','scheduled'),
  (v_tid,'groups','B','br','kr','2026-06-28T01:00:00Z','Atlanta','scheduled'),

  -- ── Grupo C: ca · fr · ng · uy ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','C','ca','fr','2026-06-12T16:00:00Z','Toronto','scheduled'),
  (v_tid,'groups','C','ng','uy','2026-06-12T22:00:00Z','Vancouver','scheduled'),
  -- Jornada 2
  (v_tid,'groups','C','ca','ng','2026-06-20T16:00:00Z','Toronto','scheduled'),
  (v_tid,'groups','C','fr','uy','2026-06-20T22:00:00Z','Kansas City','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','C','ca','uy','2026-06-28T22:00:00Z','Vancouver','scheduled'),
  (v_tid,'groups','C','fr','ng','2026-06-28T22:00:00Z','Toronto','scheduled'),

  -- ── Grupo D: de · co · sa · se ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','D','de','co','2026-06-12T19:00:00Z','Dallas','scheduled'),
  (v_tid,'groups','D','sa','se','2026-06-13T01:00:00Z','Nueva York','scheduled'),
  -- Jornada 2
  (v_tid,'groups','D','de','sa','2026-06-20T19:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','D','co','se','2026-06-21T01:00:00Z','Houston','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','D','de','se','2026-06-29T01:00:00Z','Boston','scheduled'),
  (v_tid,'groups','D','co','sa','2026-06-29T01:00:00Z','Atlanta','scheduled'),

  -- ── Grupo E: es · ma · au · cr ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','E','es','ma','2026-06-13T16:00:00Z','Los Ángeles','scheduled'),
  (v_tid,'groups','E','au','cr','2026-06-13T22:00:00Z','Seattle','scheduled'),
  -- Jornada 2
  (v_tid,'groups','E','es','au','2026-06-21T16:00:00Z','San Francisco','scheduled'),
  (v_tid,'groups','E','ma','cr','2026-06-21T22:00:00Z','Chicago','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','E','es','cr','2026-06-29T22:00:00Z','Los Ángeles','scheduled'),
  (v_tid,'groups','E','ma','au','2026-06-29T22:00:00Z','Phoenix','scheduled'),

  -- ── Grupo F: pt · ir · pa · be ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','F','pt','ir','2026-06-13T19:00:00Z','Miami','scheduled'),
  (v_tid,'groups','F','pa','be','2026-06-14T01:00:00Z','Houston','scheduled'),
  -- Jornada 2
  (v_tid,'groups','F','pt','pa','2026-06-21T19:00:00Z','Dallas','scheduled'),
  (v_tid,'groups','F','ir','be','2026-06-22T01:00:00Z','Boston','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','F','pt','be','2026-06-30T01:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','F','ir','pa','2026-06-30T01:00:00Z','Miami','scheduled'),

  -- ── Grupo G: nl · sn · no · ws ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','G','nl','sn','2026-06-14T16:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','G','no','ws','2026-06-14T22:00:00Z','Houston','scheduled'),
  -- Jornada 2
  (v_tid,'groups','G','nl','no','2026-06-22T16:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','G','sn','ws','2026-06-22T22:00:00Z','Boston','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','G','nl','ws','2026-06-30T22:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','G','sn','no','2026-06-30T22:00:00Z','Detroit','scheduled'),

  -- ── Grupo H: it · tn · cl · jm ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','H','it','tn','2026-06-14T19:00:00Z','Atlanta','scheduled'),
  (v_tid,'groups','H','cl','jm','2026-06-15T01:00:00Z','Miami','scheduled'),
  -- Jornada 2
  (v_tid,'groups','H','it','cl','2026-06-22T19:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','H','tn','jm','2026-06-23T01:00:00Z','Dallas','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','H','it','jm','2026-07-01T01:00:00Z','Atlanta','scheduled'),
  (v_tid,'groups','H','tn','cl','2026-07-01T01:00:00Z','San José','scheduled'),

  -- ── Grupo I: gb · ck · py · tr ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','I','gb','ck','2026-06-15T16:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','I','py','tr','2026-06-15T22:00:00Z','Los Ángeles','scheduled'),
  -- Jornada 2
  (v_tid,'groups','I','gb','py','2026-06-23T16:00:00Z','Filadelfia','scheduled'),
  (v_tid,'groups','I','ck','tr','2026-06-23T22:00:00Z','Atlanta','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','I','gb','tr','2026-07-01T22:00:00Z','Nueva York','scheduled'),
  (v_tid,'groups','I','ck','py','2026-07-01T22:00:00Z','Boston','scheduled'),

  -- ── Grupo J: dk · om · ci · hr ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','J','dk','om','2026-06-15T19:00:00Z','Seattle','scheduled'),
  (v_tid,'groups','J','ci','hr','2026-06-16T01:00:00Z','Los Ángeles','scheduled'),
  -- Jornada 2
  (v_tid,'groups','J','dk','ci','2026-06-23T19:00:00Z','San Francisco','scheduled'),
  (v_tid,'groups','J','om','hr','2026-06-24T01:00:00Z','Seattle','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','J','dk','hr','2026-07-02T01:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','J','om','ci','2026-07-02T01:00:00Z','Dallas','scheduled'),

  -- ── Grupo K: pl · ke · ve · nz ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','K','pl','ke','2026-06-16T16:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','K','ve','nz','2026-06-16T22:00:00Z','Detroit','scheduled'),
  -- Jornada 2
  (v_tid,'groups','K','pl','ve','2026-06-24T16:00:00Z','Boston','scheduled'),
  (v_tid,'groups','K','ke','nz','2026-06-24T22:00:00Z','Kansas City','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','K','pl','nz','2026-07-02T22:00:00Z','Chicago','scheduled'),
  (v_tid,'groups','K','ke','ve','2026-07-02T22:00:00Z','Denver','scheduled'),

  -- ── Grupo L: ch · eg · pe · uz ────────────────────────────────────────────
  -- Jornada 1
  (v_tid,'groups','L','ch','eg','2026-06-16T19:00:00Z','Seattle','scheduled'),
  (v_tid,'groups','L','pe','uz','2026-06-17T01:00:00Z','Los Ángeles','scheduled'),
  -- Jornada 2
  (v_tid,'groups','L','ch','pe','2026-06-24T19:00:00Z','San José','scheduled'),
  (v_tid,'groups','L','eg','uz','2026-06-25T01:00:00Z','Phoenix','scheduled'),
  -- Jornada 3 (simultáneos)
  (v_tid,'groups','L','ch','uz','2026-07-03T01:00:00Z','San Francisco','scheduled'),
  (v_tid,'groups','L','eg','pe','2026-07-03T01:00:00Z','Los Ángeles','scheduled');

END IF; -- fin del bloque de matches

END $$;
