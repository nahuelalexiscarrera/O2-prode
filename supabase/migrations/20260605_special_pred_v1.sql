-- 20260605_special_pred_v1.sql
--
-- Predicción especial v1: solo equipos (campeón, subcampeón, mejor de grupos,
-- revelación). El goleador (jugador) queda para v2, así que hacemos
-- top_scorer_player_id opcional para poder guardar sin él.

ALTER TABLE special_prediction ALTER COLUMN top_scorer_player_id DROP NOT NULL;

-- updated_at por si el upsert lo setea (la tabla ya lo tiene, pero garantizamos
-- que exista para no romper el onConflict).
ALTER TABLE special_prediction ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
