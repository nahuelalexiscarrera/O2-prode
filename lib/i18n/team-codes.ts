import esAR from "./es-AR.json";

/**
 * FIFA 3-letter code for a team's ISO-2 code (e.g. "ar" → "ARG").
 * Source of truth: lib/i18n/es-AR.json → teamCodes. Fallback: ISO uppercased.
 */
const CODES = esAR.teamCodes as Record<string, string>;

export function teamShortCode(isoCode: string): string {
  return CODES[isoCode.toLowerCase()] ?? isoCode.toUpperCase();
}
