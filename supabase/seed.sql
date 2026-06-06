-- =====================================================================
-- O2 PRODE — Seed Data — Mundial 2026 (placeholder)
-- Ejecutar una vez vía Supabase CLI: supabase db seed
-- O pegar en el SQL editor del dashboard de Supabase
--
-- Estructura: tournament → groups → teams → matches (72 fase grupos)
-- Los partidos de eliminatorias se insertan cuando avancen los equipos.
-- IDs de matches son UUIDs fijos para que el seed sea idempotente.
-- =====================================================================

-- ─── Tournament ──────────────────────────────────────────────────────

INSERT INTO tournament (id, slug, display_name, short_name, start_date, end_date, phase_config, active)
VALUES (
  '00000000-0000-0000-0000-000000002026',
  'mundial-2026',
  'Copa del Mundo FIFA 2026',
  'Mundial 2026',
  '2026-06-11',
  '2026-07-19',
  '{"phases":["groups","round-of-16","quarter","semi","final"],"multipliers":{"groups":1,"round-of-16":2,"quarter":3,"semi":4,"final":5}}',
  true
) ON CONFLICT (slug) DO NOTHING;

-- ─── Groups A-L ──────────────────────────────────────────────────────

INSERT INTO groups (id, tournament_id, letter) VALUES
('A', '00000000-0000-0000-0000-000000002026', 'A'),
('B', '00000000-0000-0000-0000-000000002026', 'B'),
('C', '00000000-0000-0000-0000-000000002026', 'C'),
('D', '00000000-0000-0000-0000-000000002026', 'D'),
('E', '00000000-0000-0000-0000-000000002026', 'E'),
('F', '00000000-0000-0000-0000-000000002026', 'F'),
('G', '00000000-0000-0000-0000-000000002026', 'G'),
('H', '00000000-0000-0000-0000-000000002026', 'H'),
('I', '00000000-0000-0000-0000-000000002026', 'I'),
('J', '00000000-0000-0000-0000-000000002026', 'J'),
('K', '00000000-0000-0000-0000-000000002026', 'K'),
('L', '00000000-0000-0000-0000-000000002026', 'L')
ON CONFLICT (id) DO NOTHING;

-- ─── Teams (48 selecciones) ──────────────────────────────────────────

INSERT INTO team (code, name, group_id) VALUES
-- Grupo A
('mx', 'México',          'A'),
('ar', 'Argentina',       'A'),
('jp', 'Japón',           'A'),
('qa', 'Qatar',           'A'),
-- Grupo B
('us', 'Estados Unidos',  'B'),
('br', 'Brasil',          'B'),
('kr', 'Corea del Sur',   'B'),
('ec', 'Ecuador',         'B'),
-- Grupo C
('ca', 'Canadá',          'C'),
('fr', 'Francia',         'C'),
('ng', 'Nigeria',         'C'),
('uy', 'Uruguay',         'C'),
-- Grupo D
('de', 'Alemania',        'D'),
('co', 'Colombia',        'D'),
('sa', 'Arabia Saudita',  'D'),
('se', 'Suecia',          'D'),
-- Grupo E
('es', 'España',          'E'),
('ma', 'Marruecos',       'E'),
('au', 'Australia',       'E'),
('cr', 'Costa Rica',      'E'),
-- Grupo F
('pt', 'Portugal',        'F'),
('ir', 'Irán',            'F'),
('pa', 'Panamá',          'F'),
('be', 'Bélgica',         'F'),
-- Grupo G
('nl', 'Países Bajos',    'G'),
('sn', 'Senegal',         'G'),
('no', 'Noruega',         'G'),
('ws', 'Gales',           'G'),
-- Grupo H
('it', 'Italia',          'H'),
('tn', 'Túnez',           'H'),
('cl', 'Chile',           'H'),
('jm', 'Jamaica',         'H'),
-- Grupo I
('gb', 'Inglaterra',      'I'),
('ck', 'Rep. Checa',      'I'),
('py', 'Paraguay',        'I'),
('tr', 'Turquía',         'I'),
-- Grupo J
('dk', 'Dinamarca',       'J'),
('om', 'Omán',            'J'),
('ci', 'Costa de Marfil', 'J'),
('hr', 'Croacia',         'J'),
-- Grupo K
('pl', 'Polonia',         'K'),
('ke', 'Kenia',           'K'),
('ve', 'Venezuela',       'K'),
('nz', 'Nueva Zelanda',   'K'),
-- Grupo L
('ch', 'Suiza',           'L'),
('eg', 'Egipto',          'L'),
('pe', 'Perú',            'L'),
('uz', 'Uzbekistán',      'L')
ON CONFLICT (code) DO UPDATE SET
  name     = EXCLUDED.name,
  group_id = EXCLUDED.group_id;

-- ─── Group Stage Matches (72 partidos) ───────────────────────────────
--
-- Patrón round-robin por grupo [T1, T2, T3, T4]:
--   MD1: T1 vs T2,  T3 vs T4
--   MD2: T2 vs T3,  T4 vs T1
--   MD3: T2 vs T4,  T1 vs T3  (simultáneos — mismo kickoff_at)
--
-- Horarios UTC (Buenos Aires = UTC-3):
--   Slot mañana (grupos A-F):  MD1 16:00/19:00, MD2 19:00/22:00, MD3 19:00
--   Slot tarde  (grupos G-L):  MD1 20:00/23:00, MD2 20:00/23:00, MD3 22:00
--
-- Calendario:
--   MD1: Grupos A+G Jun 11 | B+H Jun 12 | C+I Jun 13 | D+J Jun 14 | E+K Jun 15 | F+L Jun 16
--   MD2: Grupos A+G Jun 17 | B+H Jun 18 | C+I Jun 19 | D+J Jun 20 | E+K Jun 21 | F+L Jun 22
--   MD3: Grupos A+G Jun 23 | B+H Jun 24 | C+I Jun 25 | D+J Jun 26 | E+K Jun 27 | F+L Jun 28

INSERT INTO match (id, tournament_id, phase, group_id, home_code, away_code, kickoff_at, venue_city, status)
VALUES

-- ═══ GRUPO A: mx, ar, jp, qa ═════════════════════════════════════════
-- MD1 — 11 jun
('00000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'mx', 'ar', '2026-06-11T16:00:00Z', 'Ciudad de México', 'scheduled'),
('00000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'jp', 'qa', '2026-06-11T19:00:00Z', 'Guadalajara',       'scheduled'),
-- MD2 — 17 jun
('00000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'ar', 'jp', '2026-06-17T19:00:00Z', 'Monterrey',         'scheduled'),
('00000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'qa', 'mx', '2026-06-17T22:00:00Z', 'Ciudad de México',  'scheduled'),
-- MD3 — 23 jun (simultáneos)
('00000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'ar', 'qa', '2026-06-23T19:00:00Z', 'Guadalajara',       'scheduled'),
('00000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'A', 'mx', 'jp', '2026-06-23T19:00:00Z', 'Monterrey',         'scheduled'),

-- ═══ GRUPO B: us, br, kr, ec ═════════════════════════════════════════
-- MD1 — 12 jun
('00000002-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'us', 'br', '2026-06-12T16:00:00Z', 'Los Angeles', 'scheduled'),
('00000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'kr', 'ec', '2026-06-12T19:00:00Z', 'Dallas',      'scheduled'),
-- MD2 — 18 jun
('00000002-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'br', 'kr', '2026-06-18T19:00:00Z', 'Los Angeles', 'scheduled'),
('00000002-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'ec', 'us', '2026-06-18T22:00:00Z', 'Houston',     'scheduled'),
-- MD3 — 24 jun (simultáneos)
('00000002-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'br', 'ec', '2026-06-24T19:00:00Z', 'Dallas',      'scheduled'),
('00000002-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'B', 'us', 'kr', '2026-06-24T19:00:00Z', 'Los Angeles', 'scheduled'),

-- ═══ GRUPO C: ca, fr, ng, uy ═════════════════════════════════════════
-- MD1 — 13 jun
('00000003-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'ca', 'fr', '2026-06-13T16:00:00Z', 'Toronto',   'scheduled'),
('00000003-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'ng', 'uy', '2026-06-13T19:00:00Z', 'Vancouver', 'scheduled'),
-- MD2 — 19 jun
('00000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'fr', 'ng', '2026-06-19T19:00:00Z', 'Toronto',   'scheduled'),
('00000003-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'uy', 'ca', '2026-06-19T22:00:00Z', 'Vancouver', 'scheduled'),
-- MD3 — 25 jun (simultáneos)
('00000003-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'fr', 'uy', '2026-06-25T19:00:00Z', 'Toronto',   'scheduled'),
('00000003-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'C', 'ca', 'ng', '2026-06-25T19:00:00Z', 'Vancouver', 'scheduled'),

-- ═══ GRUPO D: de, co, sa, se ═════════════════════════════════════════
-- MD1 — 14 jun
('00000004-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'de', 'co', '2026-06-14T16:00:00Z', 'Dallas',   'scheduled'),
('00000004-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'sa', 'se', '2026-06-14T19:00:00Z', 'Atlanta',  'scheduled'),
-- MD2 — 20 jun
('00000004-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'co', 'sa', '2026-06-20T19:00:00Z', 'Houston',  'scheduled'),
('00000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'se', 'de', '2026-06-20T22:00:00Z', 'Dallas',   'scheduled'),
-- MD3 — 26 jun (simultáneos)
('00000004-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'co', 'se', '2026-06-26T19:00:00Z', 'Dallas',   'scheduled'),
('00000004-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'D', 'de', 'sa', '2026-06-26T19:00:00Z', 'Atlanta',  'scheduled'),

-- ═══ GRUPO E: es, ma, au, cr ═════════════════════════════════════════
-- MD1 — 15 jun
('00000005-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'es', 'ma', '2026-06-15T16:00:00Z', 'Miami',         'scheduled'),
('00000005-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'au', 'cr', '2026-06-15T19:00:00Z', 'Kansas City',   'scheduled'),
-- MD2 — 21 jun
('00000005-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'ma', 'au', '2026-06-21T19:00:00Z', 'Seattle',       'scheduled'),
('00000005-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'cr', 'es', '2026-06-21T22:00:00Z', 'Miami',         'scheduled'),
-- MD3 — 27 jun (simultáneos)
('00000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'ma', 'cr', '2026-06-27T19:00:00Z', 'Miami',         'scheduled'),
('00000005-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'E', 'es', 'au', '2026-06-27T19:00:00Z', 'Kansas City',   'scheduled'),

-- ═══ GRUPO F: pt, ir, pa, be ═════════════════════════════════════════
-- MD1 — 16 jun
('00000006-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'pt', 'ir', '2026-06-16T16:00:00Z', 'Boston',       'scheduled'),
('00000006-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'pa', 'be', '2026-06-16T19:00:00Z', 'Philadelphia', 'scheduled'),
-- MD2 — 22 jun
('00000006-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'ir', 'pa', '2026-06-22T19:00:00Z', 'New York',     'scheduled'),
('00000006-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'be', 'pt', '2026-06-22T22:00:00Z', 'Boston',       'scheduled'),
-- MD3 — 28 jun (simultáneos)
('00000006-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'ir', 'be', '2026-06-28T19:00:00Z', 'Philadelphia', 'scheduled'),
('00000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'F', 'pt', 'pa', '2026-06-28T19:00:00Z', 'New York',     'scheduled'),

-- ═══ GRUPO G: nl, sn, no, ws ═════════════════════════════════════════
-- MD1 — 11 jun (slot tarde)
('00000007-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'nl', 'sn', '2026-06-11T20:00:00Z', 'Seattle',       'scheduled'),
('00000007-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'no', 'ws', '2026-06-11T23:00:00Z', 'San Francisco', 'scheduled'),
-- MD2 — 17 jun (slot tarde)
('00000007-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'sn', 'no', '2026-06-17T20:00:00Z', 'San Francisco', 'scheduled'),
('00000007-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'ws', 'nl', '2026-06-17T23:00:00Z', 'Los Angeles',   'scheduled'),
-- MD3 — 23 jun (simultáneos, slot tarde)
('00000007-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'sn', 'ws', '2026-06-23T22:00:00Z', 'Seattle',       'scheduled'),
('00000007-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'G', 'nl', 'no', '2026-06-23T22:00:00Z', 'San Francisco', 'scheduled'),

-- ═══ GRUPO H: it, tn, cl, jm ═════════════════════════════════════════
-- MD1 — 12 jun (slot tarde)
('00000008-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'it', 'tn', '2026-06-12T20:00:00Z', 'New York',     'scheduled'),
('00000008-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'cl', 'jm', '2026-06-12T23:00:00Z', 'Philadelphia', 'scheduled'),
-- MD2 — 18 jun (slot tarde)
('00000008-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'tn', 'cl', '2026-06-18T20:00:00Z', 'Boston',       'scheduled'),
('00000008-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'jm', 'it', '2026-06-18T23:00:00Z', 'New York',     'scheduled'),
-- MD3 — 24 jun (simultáneos, slot tarde)
('00000008-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'tn', 'jm', '2026-06-24T22:00:00Z', 'Philadelphia', 'scheduled'),
('00000008-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'H', 'it', 'cl', '2026-06-24T22:00:00Z', 'Boston',       'scheduled'),

-- ═══ GRUPO I: gb, ck, py, tr ═════════════════════════════════════════
-- MD1 — 13 jun (slot tarde)
('00000009-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'gb', 'ck', '2026-06-13T20:00:00Z', 'Dallas',      'scheduled'),
('00000009-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'py', 'tr', '2026-06-13T23:00:00Z', 'Kansas City', 'scheduled'),
-- MD2 — 19 jun (slot tarde)
('00000009-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'ck', 'py', '2026-06-19T20:00:00Z', 'Houston',     'scheduled'),
('00000009-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'tr', 'gb', '2026-06-19T23:00:00Z', 'Dallas',      'scheduled'),
-- MD3 — 25 jun (simultáneos, slot tarde)
('00000009-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'ck', 'tr', '2026-06-25T22:00:00Z', 'Kansas City', 'scheduled'),
('00000009-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'I', 'gb', 'py', '2026-06-25T22:00:00Z', 'Houston',     'scheduled'),

-- ═══ GRUPO J: dk, om, ci, hr ═════════════════════════════════════════
-- MD1 — 14 jun (slot tarde)
('0000000a-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'dk', 'om', '2026-06-14T20:00:00Z', 'Miami',   'scheduled'),
('0000000a-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'ci', 'hr', '2026-06-14T23:00:00Z', 'Atlanta', 'scheduled'),
-- MD2 — 20 jun (slot tarde)
('0000000a-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'om', 'ci', '2026-06-20T20:00:00Z', 'Miami',   'scheduled'),
('0000000a-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'hr', 'dk', '2026-06-20T23:00:00Z', 'Atlanta', 'scheduled'),
-- MD3 — 26 jun (simultáneos, slot tarde)
('0000000a-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'om', 'hr', '2026-06-26T22:00:00Z', 'Miami',   'scheduled'),
('0000000a-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'J', 'dk', 'ci', '2026-06-26T22:00:00Z', 'Atlanta', 'scheduled'),

-- ═══ GRUPO K: pl, ke, ve, nz ═════════════════════════════════════════
-- MD1 — 15 jun (slot tarde)
('0000000b-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 'pl', 'ke', '2026-06-15T20:00:00Z', 'Houston',     'scheduled'),
('0000000b-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 've', 'nz', '2026-06-15T23:00:00Z', 'Kansas City', 'scheduled'),
-- MD2 — 21 jun (slot tarde)
('0000000b-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 'ke', 've', '2026-06-21T20:00:00Z', 'Kansas City', 'scheduled'),
('0000000b-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 'nz', 'pl', '2026-06-21T23:00:00Z', 'Houston',     'scheduled'),
-- MD3 — 27 jun (simultáneos, slot tarde)
('0000000b-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 'ke', 'nz', '2026-06-27T22:00:00Z', 'Houston',     'scheduled'),
('0000000b-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'K', 'pl', 've', '2026-06-27T22:00:00Z', 'Kansas City', 'scheduled'),

-- ═══ GRUPO L: ch, eg, pe, uz ═════════════════════════════════════════
-- MD1 — 16 jun (slot tarde)
('0000000c-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'ch', 'eg', '2026-06-16T20:00:00Z', 'Guadalajara',      'scheduled'),
('0000000c-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'pe', 'uz', '2026-06-16T23:00:00Z', 'Monterrey',        'scheduled'),
-- MD2 — 22 jun (slot tarde)
('0000000c-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'eg', 'pe', '2026-06-22T20:00:00Z', 'Ciudad de México', 'scheduled'),
('0000000c-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'uz', 'ch', '2026-06-22T23:00:00Z', 'Guadalajara',      'scheduled'),
-- MD3 — 28 jun (simultáneos, slot tarde)
('0000000c-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'eg', 'uz', '2026-06-28T22:00:00Z', 'Monterrey',        'scheduled'),
('0000000c-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000002026', 'groups', 'L', 'ch', 'pe', '2026-06-28T22:00:00Z', 'Ciudad de México', 'scheduled')

ON CONFLICT (id) DO NOTHING;

-- ─── Achievement catalog (19 logros) ─────────────────────────────────
-- Fuente de verdad: lib/achievements/catalog.ts.
-- Si editás acá, actualizá también catalog.ts y data/mocks/achievements.json.

INSERT INTO achievement_catalog (id, category, name, description, icon_ref, points_bonus, trigger_key) VALUES
-- Skill
('A01', 'skill',       'El que sabe',     'Acertá 5 resultados exactos seguidos.',          'target',       15, 'streak_exact_5'),
('A02', 'skill',       'Visionario',      'Acertá al campeón del Mundial antes del torneo.', 'crown',       40, 'champion_correct'),
('A03', 'skill',       'Mufa controlada', 'Acertá un upset: predijiste al no-favorito y ganó.', 'flame',    10, 'upset_correct'),
('A04', 'skill',       'Pleno',           'Acertá TODOS los partidos de un grupo.',         'check',        20, 'group_complete_correct'),
('A05', 'skill',       'Eliminator',      'Acertá todos los cruces de octavos.',            'medal',        25, 'knockout_round_correct'),
('A06', 'skill',       'Subcampeón',      'Acertá al subcampeón del Mundial antes del torneo.', 'medal',    30, 'runner_up_correct'),
('A07', 'skill',       'Finalistas',      'Acertá a los 2 finalistas del Mundial.',         'world-trophy', 40, 'finalists_correct'),
-- Consistency
('C01', 'consistency', 'Constante',       '7 días seguidos cargando predicciones.',         'flame',        10, 'streak_days_7'),
('C02', 'consistency', 'Maratonista',     '21 días seguidos cargando predicciones.',        'flame',        30, 'streak_days_21'),
('C03', 'consistency', 'Todoterreno',     'Cargaste el 100% de los partidos del torneo.',   'ball',         50, 'tournament_100'),
('C04', 'consistency', 'Madrugador',      'Cargaste un grupo completo el 1er día disponible.', 'clock',     5,  'group_first_day'),
-- Social
('S01', 'social',      'Inicio fuerte',   'Tu primer post en el muro.',                     'comment',      5,  'first_post'),
('S02', 'social',      'Popular',         'Conseguiste 10 reacciones en un solo post.',     'heart',        5,  'post_10_reactions'),
('S03', 'social',      'Embajador',       'Compartiste 5 prodes fuera de la app.',          'share',        10, 'external_shares_5'),
('S04', 'social',      'Conector',        'Comentaste en 10 posts distintos.',              'comment',      5,  'comments_made_10'),
('S05', 'social',      'Tribu',           'Tres amigos tuyos del gym también activaron la app.', 'nav-user', 10, 'friends_active_3'),
-- Position
('P01', 'position',    'Top 10',          'Llegaste al top 10 del ranking.',                'nav-chart',    0, 'position_top_10'),
('P02', 'position',    'Podio',           'Llegaste al top 3 del ranking.',                 'medal',        0, 'position_top_3'),
('P03', 'position',    'Líder',           'Liderás el ranking general.',                    'crown',        0, 'position_1'),
('P04', 'position',    'Remontada',       'Subiste 10 o más posiciones en una semana.',     'arrow-up',     15, 'weekly_rise_10')
ON CONFLICT (id) DO UPDATE SET
  category     = EXCLUDED.category,
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  icon_ref     = EXCLUDED.icon_ref,
  points_bonus = EXCLUDED.points_bonus,
  trigger_key  = EXCLUDED.trigger_key;

-- ─── Invite codes para la beta (template) ────────────────────────────
-- Descomentar y editar antes de aplicar. Expiración por defecto: post-final.
-- Recomendado usar scripts/seed-invites.mjs en lugar de esto (más cómodo).
--
-- INSERT INTO invite_code (code, used, expires_at) VALUES
--   ('BETA-01', FALSE, '2026-07-26T23:59:59-03:00'),
--   ('BETA-02', FALSE, '2026-07-26T23:59:59-03:00'),
--   ('BETA-03', FALSE, '2026-07-26T23:59:59-03:00'),
--   ('BETA-04', FALSE, '2026-07-26T23:59:59-03:00'),
--   ('BETA-05', FALSE, '2026-07-26T23:59:59-03:00')
-- ON CONFLICT (code) DO NOTHING;

-- ─── Verify seed ─────────────────────────────────────────────────────
-- Después de ejecutar, corroborá con:
--   SELECT COUNT(*) FROM match WHERE phase = 'groups';  -- debe ser 72
--   SELECT COUNT(*) FROM team;                          -- debe ser 48
--   SELECT COUNT(*) FROM groups;                        -- debe ser 12
--   SELECT COUNT(*) FROM achievement_catalog;           -- debe ser 20
