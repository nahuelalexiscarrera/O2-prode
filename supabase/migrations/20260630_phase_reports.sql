-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Workflow de reporte de actividad por fase                    │
-- │  2026-06-30                                                              │
-- │                                                                          │
-- │  Dos tablas admin-only + bucket de Storage para el reporte que se genera │
-- │  al cerrar cada fase del Mundial (ver docs/PHASE_REPORT_BRIEF.md):        │
-- │                                                                          │
-- │   1. prize_award       — premios entregados (los carga el staff). El      │
-- │                          bloque 6 del reporte los lee. Cálculo manual,    │
-- │                          no automático (coherente con PRIZES_BRIEF).      │
-- │   2. phase_report_log  — auditoría + GATE de idempotencia. El UNIQUE      │
-- │                          (tournament_id, phase) impide remandar el mismo  │
-- │                          reporte si el cron reevalúa la misma fase.       │
-- │                                                                          │
-- │  Aditiva y NO destructiva: tablas nuevas, sin tocar nada existente.       │
-- │  RLS admin-only vía el helper public.is_admin() (migración               │
-- │  20260531_moderation_admin). El endpoint escribe con service_role         │
-- │  (bypassa RLS); la RLS protege el acceso desde el cliente.                │
-- └─────────────────────────────────────────────────────────────────────────┘

-- ── 1. prize_award ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prize_award (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase        phase_t NOT NULL,
  position     SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
  user_id      UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  prize_label  TEXT NOT NULL,                       -- ej. "1 mes de O2 gratis"
  awarded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  awarded_by   UUID REFERENCES auth.users(id),      -- admin que lo cargó (nullable)
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_prize_award_phase ON prize_award(phase, position);

ALTER TABLE prize_award ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prize_award admin all" ON prize_award;
CREATE POLICY "prize_award admin all"
  ON prize_award FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 2. phase_report_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase_report_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  phase         phase_t NOT NULL,
  period_start  TIMESTAMPTZ,
  period_end    TIMESTAMPTZ,
  html_path     TEXT,
  png_path      TEXT,
  recipients    TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'sent',        -- 'sent' | 'error' | 'partial'
  error         TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- GATE de idempotencia: un solo reporte por fase por torneo.
  UNIQUE (tournament_id, phase)
);

ALTER TABLE phase_report_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "phase_report_log admin all" ON phase_report_log;
CREATE POLICY "phase_report_log admin all"
  ON phase_report_log FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 3. Storage bucket `reports` (privado) ───────────────────────────────────
-- Guarda el HTML+PNG de cada reporte. Privado: el acceso va por service_role
-- desde el endpoint. Lectura admin opcional vía policy (para el UI futuro).
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reports bucket admin read" ON storage.objects;
CREATE POLICY "reports bucket admin read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports' AND public.is_admin());
