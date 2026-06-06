-- 20260606_error_events.sql
--
-- Auto-captura de errores DEDUPLICADA. La clave operativa para NO sobrecargar:
-- el mismo error (mismo fingerprint) NO genera un ticket nuevo cada vez — se
-- agrupa en UNA fila con un contador. Un bug que pegan 800 socios = 1 fila
-- count=800, no 800 issues en Jira.

CREATE TABLE IF NOT EXISTS error_event (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint    TEXT NOT NULL UNIQUE,
  kind           TEXT NOT NULL CHECK (kind IN ('server', 'client')),
  message        TEXT NOT NULL,
  route          TEXT,
  sample_stack   TEXT,
  count          INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'resuelto', 'ignorado')),
  jira_issue_key TEXT,
  jira_url       TEXT,
  first_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_event_last_seen ON error_event (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_event_jira_recent ON error_event (first_seen DESC) WHERE jira_issue_key IS NOT NULL;

ALTER TABLE error_event ENABLE ROW LEVEL SECURITY;
-- Sin policy: solo service role (endpoint /api/report-error + admin) lo toca.

-- Upsert atómico que además dice si la fila es NUEVA (truco xmax=0): así el
-- endpoint solo crea issue en Jira la PRIMERA vez que ve un fingerprint.
CREATE OR REPLACE FUNCTION fn_record_error(
  p_fingerprint text,
  p_kind text,
  p_message text,
  p_route text,
  p_stack text
) RETURNS TABLE (is_new boolean, ev_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new boolean;
  v_count integer;
BEGIN
  INSERT INTO error_event (fingerprint, kind, message, route, sample_stack)
  VALUES (p_fingerprint, p_kind, left(p_message, 2000), p_route, left(p_stack, 8000))
  ON CONFLICT (fingerprint) DO UPDATE
    SET count = error_event.count + 1,
        last_seen = NOW()
  RETURNING (xmax = 0), error_event.count INTO v_new, v_count;
  RETURN QUERY SELECT v_new, v_count;
END;
$$;

REVOKE ALL ON FUNCTION fn_record_error(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_record_error(text, text, text, text, text) TO service_role;
