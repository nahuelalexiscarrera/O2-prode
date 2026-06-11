-- 20260608_match_reminder_dedup.sql
--
-- Resultados near-live (Vercel Pro + football-data.org pago): el cron sync-results
-- pasa a correr cada ~2 min. La notificación "partido en 1 hora"
-- (sendUpcomingMatchNotifications) dedup-eaba por una VENTANA DE TIEMPO calibrada
-- para un cron de 30 min; a cadencia rápida, el mismo partido caería en la ventana
-- en varias corridas → push duplicados a los socios.
--
-- Esta marca registra, por partido, que el recordatorio ya se envió, para que se
-- dispare UNA sola vez sin importar cada cuánto corra el cron. El endpoint hace un
-- claim atómico (UPDATE ... WHERE reminder_sent_at IS NULL) antes de notificar.
--
-- Aditiva y NO destructiva: columna nullable, sin default, sin constraint. Ninguna
-- query/lógica existente la referencia → no puede romper datos ni comportamiento.

ALTER TABLE match ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
