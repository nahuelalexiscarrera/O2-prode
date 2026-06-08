/**
 * O2 PRODE — Firma HMAC para autorizar la revelación del marcador en el share
 * card de predicción (T03_Match).
 *
 * El endpoint /api/share es PÚBLICO (el PNG se embebe en Instagram/WhatsApp/muro,
 * no puede requerir auth). Para que el DUEÑO pueda compartir su propia predicción
 * ANTES del kickoff —que es el uso viral del template— sin reabrir el IDOR (un
 * tercero espiando la predicción ajena pidiendo su card), el dueño autenticado
 * genera un token HMAC que prueba que es él quien comparte SU predicción.
 *
 * - signShareToken: lo genera una server action / shareToWall (lado servidor).
 * - verifyShareToken: lo valida el endpoint edge antes de revelar el marcador.
 *
 * Sin token válido, el endpoint mantiene la regla previa (revelar solo tras el
 * kickoff). Edge + Node compatible (Web Crypto API).
 */

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < b.length; i++) str += String.fromCharCode(b[i] as number);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Secreto del servidor (nunca llega al cliente). Reusa CRON_SECRET (ya presente
// en Vercel) para no exigir otra env var; cae a SERVICE_ROLE_KEY si faltara.
function shareSecret(): string {
  return process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64url(sig);
}

/** Firma `${userId}:${contextId}`. Devuelve "" si no hay secreto configurado. */
export async function signShareToken(userId: string, contextId?: string): Promise<string> {
  const secret = shareSecret();
  if (!secret) return "";
  return hmac(secret, `${userId}:${contextId ?? ""}`);
}

/** Verifica el token en tiempo constante. false si falta secreto/sig o no coincide. */
export async function verifyShareToken(
  userId: string,
  contextId: string | undefined,
  sig: string | undefined
): Promise<boolean> {
  if (!sig) return false;
  const secret = shareSecret();
  if (!secret) return false;
  const expected = await hmac(secret, `${userId}:${contextId ?? ""}`);
  if (expected.length === 0 || expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}
