-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  O2 PRODE — Branch (sucursal) + Onboarding vía Google OAuth              │
-- │  2026-06-08                                                              │
-- │                                                                         │
-- │  Agrega la sucursal al perfil del socio y una función ACOTADA para      │
-- │  completar el onboarding del primer ingreso.                            │
-- │                                                                         │
-- │  NO toca RLS existente, NO toca los column-grants de W0-2               │
-- │  (20260606_rls_hardening), NO usa service_role en la app.               │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 1) Columna `branch` — NULLABLE a propósito: los socios existentes no tienen
--    sucursal y un NOT NULL los rompería (migración destructiva). La
--    obligatoriedad se enforza en el onboarding (app + la función de abajo).
--    CHECK acota el dominio a las dos sucursales válidas.
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS branch TEXT
  CHECK (branch IS NULL OR branch IN ('rufina', 'cofico'));

-- 2) Función de onboarding (SECURITY DEFINER, acotada al máximo):
--    · auth.uid() → solo el usuario que ejecuta puede tocar SU fila
--    · branch obligatorio y válido (rufina | cofico)
--    · de un solo uso: WHERE branch IS NULL → no permite recambiar de sucursal
--    Reemplaza la necesidad de service_role o de ampliar el GRANT UPDATE.
CREATE OR REPLACE FUNCTION fn_complete_onboarding(
  p_name   TEXT,
  p_phone  TEXT,
  p_branch TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- Requisito: auth.uid() debe existir (usuario autenticado).
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no autenticado';
  END IF;

  -- Requisito: branch obligatorio y solo 'rufina' | 'cofico'.
  IF p_branch IS NULL OR p_branch NOT IN ('rufina', 'cofico') THEN
    RAISE EXCEPTION 'branch inválido: debe ser rufina o cofico';
  END IF;

  -- Requisito: ejecutable una sola vez (branch IS NULL = primer ingreso).
  -- name: se respeta el provisto; si viene vacío, se conserva el actual.
  -- phone: opcional (NULL si viene vacío).
  UPDATE "user"
     SET name   = COALESCE(NULLIF(btrim(p_name), ''), name),
         phone  = NULLIF(btrim(p_phone), ''),
         branch = p_branch
   WHERE id = v_uid
     AND branch IS NULL;

  IF NOT FOUND THEN
    -- O el onboarding ya estaba completo, o no existe la fila del usuario.
    RAISE EXCEPTION 'onboarding ya completado o usuario inexistente';
  END IF;
END $$;

-- Solo usuarios autenticados ejecutan la función; nunca anon/public.
REVOKE EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION fn_complete_onboarding(TEXT, TEXT, TEXT) TO authenticated;
