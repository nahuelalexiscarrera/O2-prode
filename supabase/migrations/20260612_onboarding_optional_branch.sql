-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Onboarding: branch opcional + código de referido           │
-- │  2026-06-12                                                            │
-- │                                                                        │
-- │  Cambios:                                                              │
-- │  1. `onboarding_completed_at` — nuevo sentinel de completitud.         │
-- │     Reemplaza el rol de `branch IS NOT NULL` para saber si el socio   │
-- │     ya pasó por el onboarding (branch pasa a ser opcional).            │
-- │  2. Backfill: usuarios con branch ya elegido quedan marcados como      │
-- │     completos (no los manda al onboarding nuevamente).                 │
-- │  3. fn_complete_onboarding reescrita: acepta branch opcional y         │
-- │     código de referido opcional.                                       │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 1) Nuevo sentinel de completitud de onboarding.
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 2) Backfill: socios que ya eligieron sucursal quedan marcados como completos.
UPDATE "user"
   SET onboarding_completed_at = joined_at
 WHERE branch IS NOT NULL
   AND onboarding_completed_at IS NULL;

-- 3) Eliminar la función anterior (firma: TEXT, TEXT, TEXT — branch obligatorio).
DROP FUNCTION IF EXISTS fn_complete_onboarding(TEXT, TEXT, TEXT);

-- 4) Nueva función: branch y referral_code opcionales.
--    Guard: onboarding_completed_at IS NULL (ejecutable solo una vez).
--    branch: si se provee, debe ser 'rufina' o 'cofico'; si es NULL, se deja NULL.
--    p_referral_code: si se provee, busca al referidor y actualiza referred_by
--      solo si la fila aún no tiene uno asignado (no sobreescribe links del registro).
CREATE OR REPLACE FUNCTION fn_complete_onboarding(
  p_name          TEXT,
  p_phone         TEXT    DEFAULT '',
  p_branch        TEXT    DEFAULT NULL,
  p_referral_code TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_referrer UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no autenticado';
  END IF;

  -- branch es opcional; si se provee, debe ser válido.
  IF p_branch IS NOT NULL AND p_branch NOT IN ('rufina', 'cofico') THEN
    RAISE EXCEPTION 'branch inválido: debe ser rufina o cofico';
  END IF;

  -- Una sola pasada: guard por onboarding_completed_at.
  UPDATE "user"
     SET name                    = COALESCE(NULLIF(btrim(p_name), ''), name),
         phone                   = NULLIF(btrim(p_phone), ''),
         branch                  = p_branch,
         onboarding_completed_at = NOW()
   WHERE id = v_uid
     AND onboarding_completed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'onboarding ya completado o usuario inexistente';
  END IF;

  -- Vincular referido si se proporcionó código y la fila aún no tiene referidor.
  IF p_referral_code IS NOT NULL AND btrim(p_referral_code) <> '' THEN
    SELECT id INTO v_referrer
      FROM "user"
     WHERE referral_code = UPPER(btrim(p_referral_code))
       AND id <> v_uid
     LIMIT 1;

    IF v_referrer IS NOT NULL THEN
      UPDATE "user"
         SET referred_by = v_referrer
       WHERE id = v_uid
         AND referred_by IS NULL;
    END IF;
  END IF;
END $$;

-- Grants sobre la nueva firma (4 argumentos con defaults).
REVOKE EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT, TEXT) TO authenticated;
