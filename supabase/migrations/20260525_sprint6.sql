-- Sprint 6: fn_add_points + notification INSERT policy + achievement_catalog seed
-- Run in Supabase Dashboard → SQL Editor

-- ─── fn_add_points ────────────────────────────────────────────────────
-- Atomic point increment + position recalculation.
-- Called from processAchievements when a bonus is awarded.

CREATE OR REPLACE FUNCTION fn_add_points(p_user_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "user" SET total_points = GREATEST(0, total_points + p_delta) WHERE id = p_user_id;
  PERFORM fn_recalculate_positions();
END $$;

-- ─── Notification INSERT policy ───────────────────────────────────────
-- Allows server actions running in user context to insert system notifications
-- for that user (processAchievements runs under the user's session).

CREATE POLICY "System inserta notifs del user"
  ON notification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── achievement_catalog seed ─────────────────────────────────────────
-- The user_achievement table references achievement_catalog(id) via FK.
-- Must be seeded before any user_achievement row can be inserted.

INSERT INTO achievement_catalog (id, category, name, description, icon_ref, points_bonus, trigger_key)
VALUES
  -- Skill
  ('A01', 'skill',       'El que sabe',    'Acertá 5 resultados exactos seguidos.',           'target',    15, 'streak_exact_5'),
  ('A02', 'skill',       'Visionario',     'Acertá al campeón del Mundial antes del torneo.', 'crown',     40, 'champion_correct'),
  ('A03', 'skill',       'Mufa controlada','Acertá un upset: predijiste al no-favorito.',     'flame',     10, 'upset_correct'),
  ('A04', 'skill',       'Pleno',          'Acertá TODOS los partidos de un grupo.',           'check',     20, 'group_complete_correct'),
  ('A05', 'skill',       'Eliminator',     'Acertá todos los cruces de octavos.',             'medal',     25, 'knockout_round_correct'),
  -- Consistency
  ('C01', 'consistency', 'Constante',      '7 días seguidos cargando predicciones.',          'flame',     10, 'streak_days_7'),
  ('C02', 'consistency', 'Maratonista',    '21 días seguidos cargando predicciones.',         'flame',     30, 'streak_days_21'),
  ('C03', 'consistency', 'Todoterreno',    'Cargaste el 100% de los partidos del torneo.',    'ball',      50, 'tournament_100'),
  ('C04', 'consistency', 'Madrugador',     'Cargaste un grupo completo el 1er día.',          'clock',      5, 'group_first_day'),
  -- Social
  ('S01', 'social',      'Inicio fuerte',  'Tu primer post en el muro.',                      'comment',    5, 'first_post'),
  ('S02', 'social',      'Popular',        'Conseguiste 10 reacciones en un solo post.',      'heart',      5, 'post_10_reactions'),
  ('S03', 'social',      'Embajador',      'Compartiste 5 prodes fuera de la app.',           'share',     10, 'external_shares_5'),
  ('S04', 'social',      'Conector',       'Comentaste en 10 posts distintos.',               'comment',    5, 'comments_made_10'),
  ('S05', 'social',      'Tribu',          'Tres amigos tuyos también activaron la app.',     'nav-user',  10, 'friends_active_3'),
  -- Position
  ('P01', 'position',    'Top 10',         'Llegaste al top 10 del ranking.',                 'nav-chart', 10, 'position_top_10'),
  ('P02', 'position',    'Podio',          'Llegaste al top 3 del ranking.',                  'medal',     25, 'position_top_3'),
  ('P03', 'position',    'Líder',          'Liderás el ranking general.',                     'crown',     50, 'position_1'),
  ('P04', 'position',    'Remontada',      'Subiste 10 o más posiciones en una semana.',      'arrow-up',  15, 'weekly_rise_10'),
  ('P05', 'position',    'Campeón',        'Sos el ganador final del torneo.',                'world-trophy', 100, 'tournament_winner')
ON CONFLICT (id) DO NOTHING;
