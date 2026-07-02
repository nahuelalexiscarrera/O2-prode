/**
 * O2 PRODE — Tokens de marca del reporte (§6 del guión / brief §3).
 *
 * Solo O2 en esta iteración. Cuando llegue un segundo cliente se migra a una
 * tabla `brand_config` y se resuelve por tenant. Ver brief §10.
 *
 * NOTA: valores corregidos vs el brief contra los assets reales del repo —
 * el logo vive en /logo.png (no /design/logo-o2.svg, que no existe) y las
 * fuentes en /fonts/*.ttf (las mismas que usa el pipeline de share).
 */

export const O2_BRAND = {
  accentColor: "#FF6A00", // Naranja O2 del DS
  okColor: "#10B981", // Verde de subas (regla §7: nunca rojo)
  bgColor: "#0B0B0D", // Dark mode
  cardColor: "#141417", // Superficie de tarjeta
  textColor: "#F5F5F5",
  mutedColor: "#8A8A90", // Deltas neutros/bajas + labels
  borderColor: "#26262B",
  displayFont: "Anton", // Títulos — ya cargada en /fonts
  bodyFont: "Inter", // Body — ya cargada en /fonts
  logoPath: "/logo.png",
  fontAnton: "/fonts/Anton-Regular.ttf",
  fontInter: "/fonts/Inter-Bold.ttf",
  productName: "PRODE O2",
  footerLabel: "PRODE O2 · Mundial 2026",
} as const;

export type BrandTokens = typeof O2_BRAND;
