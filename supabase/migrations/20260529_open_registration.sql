-- ─────────────────────────────────────────────────────────────────────
-- Migration: Registro abierto (Sprint 8)
--
-- Decisión de producto (Nahuel, 2026-05-29): se remueve el flujo
-- invite-only original. El registro pasa a ser abierto con email +
-- teléfono opcional, para construir una base de socios usable.
--
-- · invite_code_used deja de ser NOT NULL (se conserva la columna y el FK
--   para el histórico de quienes sí se registraron con código).
-- · Se agrega `phone` (opcional) como dato de contacto.
--
-- La tabla invite_code NO se borra: queda disponible por si se reactiva
-- el flujo cerrado en el futuro.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE "user" ALTER COLUMN invite_code_used DROP NOT NULL;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone TEXT;
