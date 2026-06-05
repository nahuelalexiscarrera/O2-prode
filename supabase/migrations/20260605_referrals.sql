-- 20260605_referrals.sql
--
-- Referidos para el logro S05 "Tribu" (3 amigos activados).
-- Cada socio tiene un referral_code (6 chars) que comparte; un amigo que se
-- registra con ese código queda con referred_by = el referidor.
-- activatedFriendsCount = cantidad de usuarios con referred_by = vos.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES "user"(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referral_code
  ON "user"(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_referred_by
  ON "user"(referred_by) WHERE referred_by IS NOT NULL;

-- Código para los usuarios existentes (6 hex en mayúscula)
UPDATE "user"
  SET referral_code = upper(substr(md5(random()::text || id::text), 1, 6))
  WHERE referral_code IS NULL;
