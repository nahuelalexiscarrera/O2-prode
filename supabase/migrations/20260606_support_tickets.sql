-- 20260606_support_tickets.sql
--
-- Sistema de tickets de soporte (panel de admin). Cada ticket genera un número
-- legible (OST-0001, OST-0002, ...) y se espeja como issue en Jira.
-- Solo el service role (server actions de admin) lo lee/escribe → RLS sin policy.

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

CREATE TABLE IF NOT EXISTS support_ticket (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   TEXT NOT NULL UNIQUE
                    DEFAULT ('OST-' || lpad(nextval('support_ticket_seq')::text, 4, '0')),
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description     TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 5000),
  severity        TEXT NOT NULL DEFAULT 'media'
                    CHECK (severity IN ('baja', 'media', 'alta', 'critica')),
  area            TEXT,
  status          TEXT NOT NULL DEFAULT 'abierto'
                    CHECK (status IN ('abierto', 'enviado', 'error_jira')),
  reporter_id     UUID REFERENCES "user"(id) ON DELETE SET NULL,
  jira_issue_key  TEXT,
  jira_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_created ON support_ticket (created_at DESC);

ALTER TABLE support_ticket ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: el panel de admin opera con service role
-- (createAdminClient) detrás del check getIsAdmin(). Ningún socio común accede.
