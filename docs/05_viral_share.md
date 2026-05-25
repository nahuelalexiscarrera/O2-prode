# O2 PRODE — Viral Share System

**Agente 5 · Viral Share Designer**
Versión 1.0 · 2026-05-18
Inputs: `01_product_strategy.md`, `02_ux_architecture.md`, `03_design_system.md`, `04_ui_designs.md`, `design/share-argentina-cinematic.html`
Outputs:
- `docs/05_viral_share.md` (este documento)
- `lib/share/templates.ts` (interfaces TypeScript)
- `lib/share/spec.json` (specs declarativos por template)

---

## 1. Marco rector

El share es **el feature de máxima inversión** del producto (decisión D6 del Agente 1). Cada acto de compartir es un anuncio orgánico del gimnasio O2 distribuido por la red de afectos del socio. Por eso esta capa merece su propio agente.

**Métrica de éxito del módulo:** ≥ 50% de socios activos comparten ≥ 1 prode fuera de la app durante el torneo (regla del Agente 1 ajustada para padrón chico).

**Decisión visual base ya cerrada por Agente 4 extension:**
- 4 templates definitivos (Resumen / Posición / Partido / Logro)
- Estética cinematográfica con detalles argentinos (Sol de Mayo, World Trophy custom, 3 estrellas, celeste solo en ARGENTINA)
- Cero emojis, todo SVG custom
- Grain + vignette + atmósfera de estadio

Este documento **formaliza** esa visión en specs de producción.

---

## 2. Inventario de templates

### T01 — Resumen general (HERO)
**Cuándo se ofrece:** Tras completar la predicción inicial (campeón, goleador, finalistas). Y al final del torneo automáticamente.
**Data slots:**
- `champion` → selección + bandera
- `topScorer` → jugador + bandera selección
- `finalResult` → finalista local + score + finalista visit + banderas
- `points` → entero
- `position` → entero
- `userName` → string (para footer micro-attribution)

**Variantes condicionales:**
- **a)** Si `champion === "Argentina"` → activar overlay Sol de Mayo + treatment celeste + 3 estrellas. Es la versión "premium argentina".
- **b)** Si `champion !== "Argentina"` → variante neutra-cinematic. Reemplazar Sol de Mayo por "stadium lights" pattern, color accent del país campeón en lugar de celeste (Brasil → amarillo, Francia → azul, etc.).

### T02 — Mi Posición
**Cuándo se ofrece:** Cuando subo ≥ 3 posiciones en una semana / cuando entro al top 10 por primera vez / siempre disponible desde Profile.
**Data slots:**
- `position` → entero (display dominante)
- `userName` → string
- `points` → entero
- `level` → 1-5 + nombre del nivel
- `deltaPosition` → entero con flecha (subió/bajó)
- `weekPoints` → entero (puntos de la semana)
- `totalSocios` → entero ("Soy #8 de 32")

### T03 — Predicción de partido
**Cuándo se ofrece:** Cuando cargo la predicción de un partido específico, y antes de que el partido comience.
**Data slots:**
- `tournament` → "Mundial 2026"
- `phase` → "Grupo A" / "Octavos" / etc.
- `homeTeam` → nombre + bandera
- `awayTeam` → nombre + bandera
- `predictedScore` → tupla (homeScore, awayScore)
- `kickoffDateTime` → ISO 8601 → renderizar en es-AR
- `userName` → string
- `userPosition` → entero

### T04 — Logro desbloqueado
**Cuándo se ofrece:** Inmediatamente tras desbloquear un achievement (modal sugiere "Compartilo").
**Data slots:**
- `achievementId` → string (FK al catálogo)
- `achievementName` → string ("RACHA 7 DÍAS")
- `achievementCategory` → "Skill" / "Constancia" / "Social" / "Posición"
- `achievementDescription` → string corto
- `iconRef` → string (clave del sprite, ej. "flame", "target", "crown")
- `userName` → string
- `unlockDate` → ISO 8601

---

## 3. Formatos de salida

| Formato | Dimensiones | Uso primario |
|---|---|---|
| **9:16 Story** | 1080 × 1920 | Instagram Stories, WhatsApp Status, TikTok Stories |
| **1:1 Square** | 1080 × 1080 | Instagram feed, WhatsApp imagen, post en X |
| **16:9 Landscape** *(opt)* | 1920 × 1080 | Compartir en grupo Telegram, posts wide. Diferida a v2. |

### Estrategia de adaptación entre formatos
Los templates están diseñados en **9:16 como canónico**. La versión 1:1 se genera **recortando los márgenes superior e inferior**, no comprimiendo verticalmente. Por eso el contenido importante de cada template está en la **banda central 60% vertical** del 9:16.

Mapa de bandas en el canónico (9:16):
- Banda top (0–20%): branding + título — recortable en 1:1
- Banda central (20–80%): trofeo + datos críticos — siempre visible
- Banda bottom (80–100%): hashtag + footer — recortable en 1:1

---

## 4. Pipeline de generación (server-side)

### 4.1 Decisión técnica

**Generación server-side con `@vercel/og`** (basado en Satori + Resvg). Razones:
1. Renderiza SVG → PNG con calidad consistente independientemente del device del usuario.
2. Soporta CSS-in-JS para mantener tokens del Design System.
3. Edge-runtime → respuesta < 200ms.
4. Permite caching agresivo por ETag/cache-control.

> **Por qué NO client-side:** El render en canvas/html2canvas del browser es inconsistente entre devices (fonts, rendering engines), tarda más en mobile, y consume battery.

### 4.2 Endpoint

```
GET /api/share/[template]/[userId]
GET /api/share/[template]/[userId]/[contextId]?format=story|square
```

- `template` ∈ `summary | position | match | achievement`
- `userId` → resuelve datos del usuario en runtime (Supabase fetch)
- `contextId` → opcional, requerido para `match` (matchId) y `achievement` (achievementId)
- `format` → opcional, default `story` (9:16). Otro valor: `square` (1:1).

**Respuesta:**
```http
Content-Type: image/png
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
ETag: <hash de data + template version>
```

### 4.3 Capas de cache (CDN-friendly)

| Capa | TTL | Invalidación |
|---|---|---|
| Edge cache | 5 min | Auto-expira |
| CDN s-maxage | 1 h | Por ETag |
| Stale-while-revalidate | 24 h | Sirve viejo + revalida background |

**Invalidación manual:** cuando el usuario cambia su prode → endpoint emite cabecera `Cache-Tag: user-{userId}` que se purga vía edge function admin.

### 4.4 Datos del usuario que se consultan

El handler recibe `userId` y resuelve en paralelo:
1. `getUserCore(userId)` → nombre, level, position
2. `getUserPrediction(userId)` → campeón, goleador, finalistas
3. `getUserPoints(userId)` → total + delta semanal
4. Si template `match` → `getMatch(matchId)` + `getUserMatchPrediction(userId, matchId)`
5. Si template `achievement` → `getAchievement(achievementId)` + `getUserAchievement(userId, achievementId)`

Todas con SELECT mínimo (campos exactos), JOIN si necesario, single query con view materializada para `summary` (Agente 8 implementa la view).

---

## 5. Especificación visual formal por template

### T01 — Summary (9:16 canónico)

```
Canvas: 1080 × 1920px
Background layers (bottom to top):
  1. base: linear-gradient(160deg, #0a0608 0%, #1a1410 60%, #050307 100%)
  2. atmosphere-bottom: radial-gradient(ellipse at 78% 85%, rgba(255,106,0,0.20) 0%, transparent 55%)
  3. atmosphere-top: radial-gradient(ellipse at 20% 15%, rgba(116,172,223,0.10) 0%, transparent 50%)
     [Conditional Argentina: rgba(116,172,223,0.18)]
  4. Stadium lights: 3 soft circles (top band)
  5. Sol de Mayo (Argentina variant only): 800px, rotate(-12deg), top-right -120,-160px, opacity 0.05
  6. Grain overlay: SVG turbulence noise, opacity 0.5, blend overlay
  7. Vignette: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)

Padding: 96px (≈ space.16 × 2)

Top zone (~y: 0–540px):
  - Top bar:
    - "— MI PRODE" (Inter 700, 28px, letter-spacing 0.2em, color text.muted, uppercase)
    - "O2" wordmark (Anton 64px, color primary, text-shadow glow 32px)
  - Title block (margin-top 64px):
    - "MUNDIAL" (Anton 160px, line-height 144px, gradient text linear-gradient(180deg, #FFF 0%, #FFE082 60%, #FFB300 100%), letter-spacing -0.01em)
    - "2 0 2 6" (Anton 96px, color primary, letter-spacing 0.16em, glow)

Hero zone (~y: 540–1080px):
  - World Trophy SVG centered, 480px wide, drop-shadow(0 0 64px rgba(255,179,0,0.4))
  - 3 stars below trophy, gold filled, 32px each, gap 32px
  - Gold divider line below: 1px linear gradient transparent → gold → transparent

Data zone (~y: 1080–1520px):
  - Each data row:
    - Label: "— CAMPEÓN" (Inter 700, 24px, letter-spacing 0.2em, text.muted, uppercase, with leading dash)
    - Value: Anton 64px, color text (or celeste if Argentina campeón), + flag inline 64×40px
  - Rows: CAMPEÓN, GOLEADOR, RESULTADO FINAL
  - Gap between rows: 32px

Stats zone (~y: 1520–1720px):
  - Top border: 1px gold gradient
  - Grid 2 cols:
    - Left: "PUNTOS" label + "124" (Anton 144px, color lime, glow shadow)
    - Right: "POSICIÓN" label + "#8" (Anton 144px, color text)

Footer (~y: 1720–1920px):
  - "#PRODEMUNDIALO2" (Inter 700, 32px, letter-spacing 0.16em, color gold) — bottom-left
  - "O2 / Wellness Club" (Anton 36px + Inter 18px muted) — bottom-right
```

### T02 — Position (9:16 canónico)

```
Canvas: 1080 × 1920px
Background:
  - base: linear-gradient(180deg, #0a0a0c 0%, #1b1410 100%)
  - atmosphere: radial-gradient(ellipse at 50% 100%, rgba(255,106,0,0.25) 0%, transparent 60%)
  - grain + vignette same as T01

Padding: 96px

Top zone:
  - "MI POSICIÓN" + O2 wordmark
  - "EN EL RANKING" Anton 128px gradient
  - "32 socios compitiendo" subtitle muted

Hero zone (centrado vertical):
  - Frame: 800×800 rounded 80px, border 1px primary, bg linear-gradient(180deg, rgba(255,106,0,0.18), rgba(255,106,0,0.04))
  - Inside frame, centered:
    - "MI PUESTO" label uppercase
    - "#8" — Anton 360px, color primary, glow shadow 80px
    - "NAHUEL" — Anton 96px
    - "124 PTS · NIVEL PRO" — Inter 700 32px lime

Below frame:
  - 2 stats: "SUBÍ +2 ↑" / "SEMANA +12 PTS" — grid 2 cols

Footer:
  - "#PRODEMUNDIALO2" / "Semana 3"
```

### T03 — Match (9:16 canónico)

```
Canvas: 1080 × 1920px
Background: linear-gradient(135deg, #0a0a0c 0%, #1a1410 50%, #0a0a0c 100%) + grain + vignette
Optional: subtle stadium texture mid-tones in middle band

Top zone:
  - "MI PREDICCIÓN" + O2 wordmark
  - "PRÓXIMO PARTIDO" Anton 96px
  - "GRUPO A · HOY 18:00" subtitle gold

Hero zone:
  - Team row:
    - Home team: flag 144×96 + name Anton 56px
    - "VS" divider muted
    - Away team: flag 144×96 + name Anton 56px
  - Score:
    - homeScore (Anton 320px) — em-dash separator (color primary) — awayScore (Anton 320px)
    - Tabular nums, letter-spacing -0.02em
    - If predicted local is Argentina/Brasil/etc → tint con color del país en el numeral

  - "MI PREDICCIÓN" label uppercase below score

Footer: hashtag + "NAHUEL · #8"
```

### T04 — Achievement (9:16 canónico)

```
Canvas: 1080 × 1920px
Background:
  - base: linear-gradient(180deg, #0a0a0c 0%, #0e1206 60%, #0a0a0c 100%)
  - hero spotlight: radial-gradient(circle at 50% 30%, rgba(217,255,63,0.20) 0%, transparent 55%)
  - grain + vignette

Top zone:
  - "LOGRO DESBLOQUEADO" + O2 wordmark

Hero zone:
  - Frame circle 560×560 centered, bg radial-gradient(circle, rgba(217,255,63,0.25), transparent 70%)
  - Inside: icon SVG (use `iconRef` slot), 320×320, color lime, drop-shadow glow lime 80px

Title zone:
  - "CONSTANCIA" Anton 160px (uppercase, category)
  - "RACHA 7 DÍAS" Anton 128px color lime
  - Description Inter 32px muted, max-width 720px, line-height 1.4

Footer: hashtag + userName
```

---

## 6. Tokens visuales específicos del módulo Share

Estos tokens **extienden** el design system del Agente 3 con valores específicos para canvas grande (no se usan en la UI mobile).

```typescript
// lib/share/tokens.ts
export const shareTokens = {
  canvas: {
    story: { w: 1080, h: 1920 },
    square: { w: 1080, h: 1080 },
  },
  padding: {
    story: 96,
    square: 64,
  },
  typography: {
    // Anton scaled up para canvas grande
    titleHuge: { size: 160, lineHeight: 144, letterSpacing: '-0.01em' },
    titleLarge: { size: 128, lineHeight: 120, letterSpacing: '-0.01em' },
    yearSpaced: { size: 96, lineHeight: 88, letterSpacing: '0.16em' },
    statNumber: { size: 144, lineHeight: 128, letterSpacing: '-0.02em' },
    statNumberHuge: { size: 360, lineHeight: 320, letterSpacing: '-0.04em' },
    matchScore: { size: 320, lineHeight: 280, letterSpacing: '-0.02em' },
    dataValue: { size: 64, lineHeight: 64, letterSpacing: '0.02em' },
    labelUppercase: { size: 24, lineHeight: 28, letterSpacing: '0.2em' },
    bodyMuted: { size: 32, lineHeight: 44 },
    hashtag: { size: 32, lineHeight: 32, letterSpacing: '0.16em' },
  },
  colors: {
    // Inherits from design tokens + shareCard-specific
    titleGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FFE082 60%, #FFB300 100%)',
    goldDivider: 'linear-gradient(90deg, transparent 0%, #FFB300 50%, transparent 100%)',
    argentineCeleste: '#74ACDF',
    primaryGlow: '0 0 64px rgba(255,106,0,0.4)',
    limeGlow: '0 0 80px rgba(217,255,63,0.3)',
    goldGlow: '0 0 80px rgba(255,179,0,0.4)',
  },
  trophy: {
    width: 480,           // T01 canonical
    widthCompact: 320,    // T01 square
  },
  flag: {
    inlineSm: { w: 48, h: 32 },     // Inline en data rows
    inlineLg: { w: 144, h: 96 },    // Match teams
    miniFooter: { w: 64, h: 40 },
  },
};
```

---

## 7. TypeScript interface para data injection

```typescript
// lib/share/templates.ts

export type ShareTemplateId = 'summary' | 'position' | 'match' | 'achievement';
export type ShareFormat = 'story' | 'square';

interface ShareCommon {
  userId: string;
  userName: string;
  userInitials: string;
  userLevel: 1 | 2 | 3 | 4 | 5;
  userLevelName: string;
}

export interface SummaryShareData extends ShareCommon {
  template: 'summary';
  champion: { country: string; flagCode: string };
  topScorer: { name: string; country: string; flagCode: string };
  finalResult: {
    home: { country: string; flagCode: string };
    away: { country: string; flagCode: string };
    score: [number, number];
  };
  points: number;
  position: number;
  isArgentinaChampion: boolean;  // computed → activa Sol de Mayo + celeste tint
}

export interface PositionShareData extends ShareCommon {
  template: 'position';
  position: number;
  points: number;
  totalSocios: number;
  deltaPosition: number;  // positivo subió, negativo bajó
  weekPoints: number;
  weekNumber: number;
}

export interface MatchShareData extends ShareCommon {
  template: 'match';
  tournament: 'Mundial 2026';
  phase: string;  // "Grupo A", "Octavos", etc.
  home: { country: string; flagCode: string };
  away: { country: string; flagCode: string };
  predictedScore: [number, number];
  kickoffISO: string;  // ISO 8601
  userPosition: number;
}

export interface AchievementShareData extends ShareCommon {
  template: 'achievement';
  achievementId: string;
  achievementName: string;
  achievementCategory: 'skill' | 'consistency' | 'social' | 'position';
  achievementDescription: string;
  iconRef: string;  // sprite key
  unlockedAt: string;
}

export type ShareData = SummaryShareData | PositionShareData | MatchShareData | AchievementShareData;

export interface ShareRequest {
  data: ShareData;
  format: ShareFormat;
}
```

---

## 8. Flow de compartir en la app

```
[Usuario tap "Compartir mi prode" / "Compartir logro" / etc.]
   │
   ▼
[Modal /compartir/[type]]
   │
   ├── Preview: <Image src="/api/share/[template]/[userId]?format=story" />
   ├── Carrusel de templates compatibles (si aplica)
   │
   ▼
[Tap CTA: Descargar / Instagram / WhatsApp / Más]
   │
   ├── Descargar:
   │   - fetch(/api/share/...) → blob → URL.createObjectURL → <a download>
   │   - Toast "Guardado en tu device"
   │
   ├── Instagram:
   │   - Si soportado por device → Intent ShareToInstagram (Android) / fallback copy + open IG
   │   - Si no: descargar imagen + toast "Imagen lista. Abrila en Instagram > Stories"
   │
   ├── WhatsApp:
   │   - Build wa.me URL con texto: "Mi prode del Mundial 2026 [link al perfil público]"
   │   - Adjuntar imagen via clipboard (PWA Web Share API si está disponible)
   │
   └── Más (Web Share API nativa):
       - navigator.share({ files, title, text, url })
       - Fallback: copy link to clipboard + toast
   │
   ▼
[Tras share exitoso (heurística):]
   - Mostrar achievement "Embajador" si llegó al threshold
   - Sumar al contador interno user.shareCount (telemetría no pública)
   - Push opcional al socio: "¡Bien! Animá a otro socio a compartir el suyo."
```

### Detección de share exitoso
No siempre es posible saber si el usuario completó el share externo (los protocolos no notifican back). Heurística:
- **Tap en CTA de plataforma** → cuenta como "intent" (registrar en `share_intents` table).
- **Web Share API success callback** → cuenta como "completed".
- **Si descargó el PNG y luego se ve actividad reentry app < 60s** → no contar (probablemente solo guardó).

---

## 9. Branding & marca

### Reglas inviolables (auditadas por Agente 12)

1. **Wordmark "O2"** SIEMPRE presente, mínimo 64px en canvas 1080-wide, en color primary con glow.
2. **Hashtag `#PRODEMUNDIALO2`** SIEMPRE presente en footer, mínimo 32px.
3. **Footer "Wellness Club"** opcional pero recomendado (genera asociación con el club físico).
4. **El icono de marca y el hashtag NUNCA se cubren con elementos del template.** Layout debe respetar safe zones.
5. **Si la imagen se descarga y modifica** (es un raster PNG), la firma O2 está embebida. No hay watermark dinámico — la marca es parte del layout.

### Reglas opcionales (a discreción del usuario)
- **Mostrar mi nombre completo** (default: ON; opt-out en Settings).
- **Mostrar mi posición exacta** (default: ON; opt-out si bajó de top 10).
- **Mostrar mi puntaje** (default: ON).

> **Privacidad:** un usuario NO socio que vea el share no puede deducir el padrón completo del gimnasio porque la imagen es estática y no linkea a la app interna (link público va a una landing genérica).

---

## 10. Performance budget

| Métrica | Target | Stretch |
|---|---|---|
| Tiempo de generación (edge cold) | < 600 ms | < 400 ms |
| Tiempo (edge warm / cached) | < 50 ms | < 20 ms |
| Peso del PNG resultante | < 200 KB | < 120 KB |
| Resolución final | 1080×1920 @ 1x | 2160×3840 @ 2x para retinas |

**Optimizaciones aplicadas:**
- PNG con compresión level 8 (no max — el cost compute > saving size).
- Pre-cache de fonts en edge (Anton + Inter como WOFF2 embedded).
- SVG sprite del icon system inlined en cada renderizado (no fetched).
- Sol de Mayo y World Trophy SVGs comprimidos manualmente (rutas optimizadas).

---

## 11. Telemetría

### Eventos a trackear

| Evento | Cuándo | Propiedades |
|---|---|---|
| `share_modal_opened` | Tap CTA "Compartir" | template, source_screen |
| `share_template_changed` | Swipe entre variantes | from_template, to_template |
| `share_intent` | Tap CTA de plataforma | template, channel (ig/wa/download/more) |
| `share_completed` | Web Share API success | template, channel |
| `share_image_failed` | Error generación | template, error_code |

### Métricas derivadas
- **Share rate** = `share_intent` events / DAU
- **Channel mix** = breakdown de `channel` en `share_intent`
- **Template popularity** = breakdown de `template` en `share_intent`
- **Completion rate** = `share_completed` / `share_intent` (solo cuando Web Share API)

---

## 12. A/B testing futuro (post-MVP)

Hipótesis para testear en futuros torneos:
- **H-S1:** Layout con foto de fondo (real) vs gradient atmosphere actual. ¿Más share rate?
- **H-S2:** Posición de marca O2 — top-right vs bottom-right.
- **H-S3:** Color del numeral de puntos — lime vs gold. ¿Cuál se asocia más con "logro"?
- **H-S4:** Hashtag con o sin punto separador (`#PRODEMUNDIALO2` vs `#PRODE.MUNDIAL.O2`).

Implementar como feature flags a nivel template render.

---

## 13. Roadmap de variantes futuras

| Variante | Cuándo | Justificación |
|---|---|---|
| **T05 — Resumen del torneo (final)** | Post-Mundial 2026 (20 jul) | Para el cierre. Versión "highlight reel" estática con: prode score final, ranking final, logros del torneo, % aciertos. |
| **T06 — Predicción de la jornada** | Diariamente durante grupos | "Las 4 predicciones de hoy" — 4 partidos en una sola imagen. |
| **T07 — Versus head-to-head** | Cuando dos socios tienen scores similares | Comparativa "yo vs tu amigo del gym" — habilita rivalry. Requiere data de relaciones. |
| **T08 — Equipo revelación** | Cuando un upset acierta | "Yo lo vi venir: [equipo sorpresa] pasó de grupos" — celebración de upset acertado. |

---

## 14. Decisiones que cierra este documento

| # | Decisión | Implicancia downstream |
|---|---|---|
| SH-D1 | Generación server-side con `@vercel/og` (Satori + Resvg) | Agente 7 instala dep + crea handler edge en `app/api/share/[template]/[userId]/route.ts` |
| SH-D2 | 4 templates canónicos en MVP + 4 variantes diferidas a v2 | Agente 7 implementa solo T01-T04 |
| SH-D3 | Caching agresivo: edge 5min + CDN 1h + SWR 24h | Reduce costo compute. ETag por hash de data + template version |
| SH-D4 | Variante condicional Argentina campeón (Sol de Mayo + celeste) | Render-time check `if (data.isArgentinaChampion)` activa overlay |
| SH-D5 | Marca O2 + hashtag son inviolables | Auditoría visual de Agente 12 verifica en cada template |
| SH-D6 | Heurística para detectar share exitoso (no certeza) | Agente 10 implementa contador con margen de error |
| SH-D7 | Foto de fondo real diferida a v2 (T01 actual usa gradient atmosphere) | Decisión consciente: PNG sin foto = menor peso + mejor performance |
| SH-D8 | Versión 1:1 se deriva por crop, no resize | Composición pensada con banda central protegida |

---

## 15. Handoff al Agente 7

El Agente 7 (Next.js Architect) recibe:
- Specs visuales por template (sección 5)
- TypeScript interfaces (sección 7)
- Endpoint signature (sección 4.2)
- Cache strategy (sección 4.3)
- Performance budget (sección 10)

Debe implementar:
1. `app/api/share/[template]/[userId]/route.ts` — handler edge runtime
2. `app/components/share/templates/T01_Summary.tsx` — JSX que Satori convierte a SVG → PNG
3. `app/components/share/templates/T02_Position.tsx`
4. `app/components/share/templates/T03_Match.tsx`
5. `app/components/share/templates/T04_Achievement.tsx`
6. `lib/share/dataFetchers.ts` — queries a Supabase
7. `lib/share/render.ts` — orquestador (data fetch + template select + Satori call)

El componente JSX puede usar el icon sprite y todos los SVGs decorativos (Sol de Mayo, World Trophy) renderizándolos inline como children. **Satori soporta SVG nativo.**

---

## 16. Próximo paso

**Agente 6 — Motion Designer** recibe los entregables del Agente 5 (modal de share, animaciones de download/share) y produce:
- Variants de Framer Motion para apertura del modal share
- Animación de cambio entre templates (carrusel)
- Animación celebratoria de "share completed"
- Catálogo motion completo del producto

---

*Fin Agente 5 — Listo para checkpoint del usuario.*
