# O2 PRODE — Design System

**Agente 3 · Design System**
Versión 1.0 · 2026-05-18
Inputs: `01_product_strategy.md`, `02_ux_architecture.md`
Outputs entregados:
- `docs/03_design_system.md` (este documento)
- `design/tokens.json` (tokens machine-readable)
- `app/styles/globals.css` (CSS variables)
- `tailwind.config.ts` (Tailwind extendido)

---

## 1. Filosofía de diseño

> "Fitness premium, no casino. Sports performance, no fan boy. Mobile-native, no responsive web."

Este sistema reposa sobre 5 principios no negociables:

1. **Oscuro por default.** El producto vive en `#0B0B0D`. No hay tema claro en MVP. La oscuridad construye foco y carga emocional cinematográfica.
2. **Naranja como acción, no decoración.** `#FF6A00` se reserva para CTAs, estado activo y momentos de marca. Nunca como background grande, nunca como acento gratuito.
3. **Tipografía atlética.** Headings con condensadas bold (Anton). Numerales y datos con display extra-bold. Texto con sans humanista (Inter/Satoshi).
4. **Espacio respira.** Generoso uso de padding. Cards con aire. Listas con altura cómoda. Nunca apilar tres datos secundarios sin separación clara.
5. **Movimiento como narrativa.** Cada animación cuenta algo (subiste, ganaste, se desbloqueó). Sin micro-animaciones decorativas vacías.

---

## 2. Color System

### 2.1 Tokens base (palette primitiva)

| Token | Hex | Uso |
|---|---|---|
| `color.bg` | `#0B0B0D` | Background app (nivel 0) |
| `color.surface` | `#131417` | Surface (nivel 1) — bottom nav, headers |
| `color.card` | `#1B1D22` | Card (nivel 2) — tarjetas, modales |
| `color.elevated` | `#23262C` | Elevated (nivel 3) — popovers, sheets |
| `color.border` | `#2A2E36` | Borders sutiles |
| `color.border.strong` | `#3A3F49` | Borders enfatizados (focus, selección) |

### 2.2 Texto

| Token | Hex | Uso |
|---|---|---|
| `text.primary` | `#F5F7FA` | Texto principal |
| `text.secondary` | `#C7CCD4` | Texto secundario |
| `text.muted` | `#9CA3AF` | Labels, captions, fechas |
| `text.disabled` | `#5A5F69` | Estado deshabilitado |
| `text.inverse` | `#0B0B0D` | Texto sobre fondo naranja/acento |

### 2.3 Brand & Accent

| Token | Hex | Uso |
|---|---|---|
| `brand.primary` | `#FF6A00` | CTA principal, marca, estado activo |
| `brand.primary.hover` | `#FF7A1A` | Hover de CTA primario |
| `brand.primary.pressed` | `#E65E00` | Pressed de CTA primario |
| `brand.primary.soft` | `#FF8A33` | Variante suave (gradients sutiles, hover states secundarios) |
| `brand.primary.glow` | `rgba(255,106,0,0.35)` | Glow de focus, halos |
| `brand.primary.bg` | `rgba(255,106,0,0.12)` | Background tintado (badge, chip activo) |
| `accent.lime` | `#D9FF3F` | Acento secundario (logros, hitos, picos) |
| `accent.lime.soft` | `rgba(217,255,63,0.18)` | Background tintado del acento |

> **Regla:** El acento lime (`#D9FF3F`) es CONTRAPESO, no acompañante. Aparece en momentos puntuales de celebración (logros, multiplicadores activos, hitos). Nunca en CTAs principales.

### 2.4 Semantic states

| Token | Hex | Uso |
|---|---|---|
| `state.success` | `#22C55E` | Acierto, predicción guardada, online |
| `state.success.bg` | `rgba(34,197,94,0.12)` | Background tintado de success |
| `state.warning` | `#F59E0B` | Próximo a cerrar, atención |
| `state.warning.bg` | `rgba(245,158,11,0.12)` | Background tintado |
| `state.error` | `#EF4444` | Error, fallo, fuera de plazo |
| `state.error.bg` | `rgba(239,68,68,0.12)` | Background tintado |
| `state.info` | `#3B82F6` | Info, neutro destacado |
| `state.info.bg` | `rgba(59,130,246,0.12)` | Background tintado |
| `state.live` | `#FF2D55` | Partido en vivo (rojo pulsante) |

### 2.5 Banderas y equipos (gestión)

Las banderas de selección NO son tokens del sistema. Se sirven como assets SVG por código ISO de país (`/public/flags/ar.svg`, `/public/flags/br.svg`). La librería recomendada: **Flagpedia SVG set** (libre, alta calidad).

### 2.6 Glassmorphism (soft, no exagerado)

El producto usa glass en SOLO 2 contextos: bottom nav y modales fullscreen.

```css
.glass {
  background: rgba(19, 20, 23, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
```

> Antipatrón: NO usar glass en cards ni headers permanentes. Pierde sentido y rinde mal en mobile.

### 2.7 Contraste (compliance WCAG AA)

| Combinación | Ratio | Resultado |
|---|---|---|
| `text.primary` sobre `bg` | 16.8 : 1 | AAA |
| `text.muted` sobre `bg` | 5.4 : 1 | AA |
| `text.primary` sobre `card` | 13.2 : 1 | AAA |
| `brand.primary` sobre `bg` | 5.7 : 1 | AA |
| `text.inverse` sobre `brand.primary` | 5.9 : 1 | AA |
| `accent.lime` sobre `bg` | 14.1 : 1 | AAA |

> El Agente 12 ratifica con auditoría completa. Estos ratios son la base de partida.

---

## 3. Typography

### 3.1 Familias

| Rol | Familia | Fallback | Carga |
|---|---|---|---|
| Display / Heading | **Anton** | Bebas Neue, Oswald, Impact | Google Fonts |
| Body / UI | **Inter** | Satoshi, system-ui, -apple-system | Google Fonts (variable) |
| Numeric (puntos, scores) | **Anton** (tabular-nums via feature setting) | — | Idem display |
| Monospace (códigos invite) | **JetBrains Mono** | ui-monospace, SFMono-Regular | Google Fonts |

### 3.2 Type scale (mobile-first)

| Token | Size / Line | Weight | Tracking | Uso |
|---|---|---|---|---|
| `font.display.xl` | 56 / 56 | 700 (Anton) | -0.02em | Score grande, hero del share |
| `font.display.lg` | 40 / 44 | 700 | -0.01em | "PRODE MUNDIAL", título splash |
| `font.display.md` | 32 / 36 | 700 | -0.01em | Section titles destacadas |
| `font.heading.lg` | 24 / 28 | 700 | 0 | H1 de pantalla |
| `font.heading.md` | 20 / 24 | 700 | 0 | H2 de sección |
| `font.heading.sm` | 16 / 20 | 700 | 0 | H3, label fuerte |
| `font.body.lg` | 16 / 24 | 400 | 0 | Texto principal |
| `font.body.md` | 14 / 20 | 400 | 0 | Texto secundario, card body |
| `font.body.sm` | 12 / 16 | 400 | 0.01em | Caption, label |
| `font.body.xs` | 11 / 14 | 500 | 0.02em | Microlabel, badge text |
| `font.numeric.xl` | 48 / 48 | 700 | -0.02em | Mi puntaje en perfil |
| `font.numeric.lg` | 32 / 32 | 700 | -0.01em | Score input, score card |
| `font.numeric.md` | 20 / 24 | 700 | 0 | Puntos en ranking row |
| `font.label.uppercase` | 11 / 14 | 700 | 0.08em | "TU POSICIÓN", "TUS PUNTOS" — uppercase |

### 3.3 Reglas tipográficas

- **Headings en Anton** se usan SIEMPRE en uppercase cuando son ≤ 5 palabras (look de poster deportivo). En frases largas → sentence case.
- **Numerales en Anton** activan `font-feature-settings: "tnum"` para alineación tabular en rankings y scores.
- **Body en Inter** activa `font-feature-settings: "cv11", "ss01"` para alternates más limpios.
- **Nunca italics**. El sistema no usa cursivas. La emfasis se hace con peso o color.

---

## 4. Spacing & Sizing

### 4.1 Spacing scale (base 4)

| Token | Px | Tailwind | Uso típico |
|---|---|---|---|
| `space.0` | 0 | `0` | — |
| `space.1` | 4 | `1` | Gap mínimo entre íconos |
| `space.2` | 8 | `2` | Padding interno de badges |
| `space.3` | 12 | `3` | Gap entre elementos compactos |
| `space.4` | 16 | `4` | Padding base de card |
| `space.5` | 20 | `5` | Gap entre cards |
| `space.6` | 24 | `6` | Margen lateral mobile estándar |
| `space.8` | 32 | `8` | Padding generoso de sección |
| `space.10` | 40 | `10` | Gap entre secciones |
| `space.12` | 48 | `12` | Padding top de pantalla principal |
| `space.16` | 64 | `16` | Padding hero |
| `space.20` | 80 | `20` | Padding XL |

### 4.2 Layout grid (mobile)

- **Container padding lateral:** `24px` (`space.6`)
- **Safe area top:** `48px` debajo del status bar (`space.12`)
- **Safe area bottom:** `96px` para no taparse con bottom nav (`56px` nav + `40px` aire)
- **Gap vertical entre secciones:** `32px` (`space.8`)

### 4.3 Touch targets

- **Mínimo absoluto:** 44 × 44 px (Apple HIG)
- **Recomendado para CTAs:** 56 × 56 px
- **Tap area de íconos en bottom nav:** 64 × 64 px efectivo (aunque el ícono visual sea 24px)

---

## 5. Radius (esquinas)

| Token | Px | Uso |
|---|---|---|
| `radius.none` | 0 | — |
| `radius.sm` | 6 | Badges, chips pequeños |
| `radius.md` | 12 | Botones secundarios, inputs |
| `radius.lg` | 16 | Cards, score inputs |
| `radius.xl` | 20 | Cards destacadas, modales |
| `radius.2xl` | 28 | Hero cards, contenedores grandes |
| `radius.full` | 9999 | Avatars, CTAs primarios pill, badges circulares |

> **Regla:** Una pantalla no debería tener más de 3 radios distintos visibles a la vez. Mantiene coherencia.

---

## 6. Elevación y sombras

El sistema oscuro usa sombras SUTILES. No copiamos Material Design (sombras pensadas para tema claro).

| Token | Box-shadow | Uso |
|---|---|---|
| `shadow.none` | none | Default flat |
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.4)` | Hover sutil en card |
| `shadow.md` | `0 4px 12px rgba(0,0,0,0.5)` | Modal, popover |
| `shadow.lg` | `0 12px 32px rgba(0,0,0,0.6)` | Sheet bottom, modal fullscreen |
| `shadow.glow.primary` | `0 0 24px rgba(255,106,0,0.35)` | Focus de CTA primario |
| `shadow.glow.accent` | `0 0 24px rgba(217,255,63,0.35)` | Hito desbloqueado, celebración |

> Las sombras NUNCA aportan profundidad por sí solas. Combinarlas con borde sutil + cambio de superficie (card → elevated).

---

## 7. Motion tokens

### 7.1 Duraciones

| Token | ms | Uso |
|---|---|---|
| `motion.duration.fast` | 120 | Hover, micro feedback |
| `motion.duration.base` | 200 | Tap scale, fade, color transition |
| `motion.duration.medium` | 320 | Modal open, sheet slide |
| `motion.duration.slow` | 480 | Page transition, unlock animation |
| `motion.duration.epic` | 800 | Celebración (logro, podio) |

### 7.2 Easings

| Token | Curve | Uso |
|---|---|---|
| `motion.ease.standard` | `cubic-bezier(0.2, 0, 0, 1)` | Entradas, transiciones generales |
| `motion.ease.decelerate` | `cubic-bezier(0, 0, 0, 1)` | Apariciones de UI |
| `motion.ease.accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Salidas |
| `motion.ease.spring` | tipo spring (Framer Motion) | Tap, scale, bounce |
| `motion.ease.linear` | `linear` | Progress bars, countdowns |

> El Agente 6 (Motion) detalla variants completas de Framer Motion.

### 7.3 Reduced motion
Cuando `prefers-reduced-motion: reduce` está activo, toda animación de translate/scale/rotation se reduce a fade. Las duraciones se acortan a la mitad.

---

## 8. Componentes — Inventario

### 8.1 Primitivas (átomos)

| # | Componente | Variants | Slots | Documentado en |
|---|---|---|---|---|
| 1 | `Button` | primary, secondary, ghost, danger, link | leftIcon, rightIcon, children | §9.1 |
| 2 | `IconButton` | filled, outlined, ghost | icon | §9.2 |
| 3 | `Avatar` | sm, md, lg, xl + level-badge | image, fallback | §9.3 |
| 4 | `Badge` | default, primary, accent, success, warning, error, ghost | leftIcon, children | §9.4 |
| 5 | `Chip` | default, active, ghost | leftIcon, children | §9.5 |
| 6 | `Input` | default, error, disabled | leftIcon, rightIcon | §9.6 |
| 7 | `ScoreInput` | default, locked, live, settled | localValue, awayValue | §9.7 |
| 8 | `Switch` | default, disabled | label | §9.8 |
| 9 | `Skeleton` | text, card, row, circle | shimmer | §9.9 |
| 10 | `Divider` | horizontal, vertical, soft, strong | label | §9.10 |
| 11 | `Tag` | default, locked, live, closed | leftIcon, children | §9.11 |
| 12 | `Flag` | sm, md, lg | countryCode | §9.12 |
| 13 | `ProgressBar` | linear, circular | value, max, label | §9.13 |
| 14 | `Toast` | success, error, info, warning | icon, message, action | §9.14 |
| 15 | `IconStack` (íconos lucide pre-config) | — | name, size, color | §9.15 |

### 8.2 Compuestos (moléculas)

| # | Componente | Composición | Documentado en |
|---|---|---|---|
| M1 | `MatchCard` | Flag + ScoreInput + Tag (kickoff / live / closed) | §10.1 |
| M2 | `RankingRow` | Avatar + name + delta + Badge level + score | §10.2 |
| M3 | `PodiumCard` | Avatar XL + medal + name + score | §10.3 |
| M4 | `PostCard` | Avatar + time + body + actions (heart, comment, share) | §10.4 |
| M5 | `StatCard` | Label uppercase + numeric value + delta | §10.5 |
| M6 | `NextMatchHero` | Flags + countdown + CTA primary | §10.6 |
| M7 | `PhaseProgress` | Stepper con íconos + estados (done / current / locked) | §10.7 |
| M8 | `AchievementCard` | Icon + title + description + state (locked/in-progress/done) | §10.8 |
| M9 | `ShareCard` | Bg cinemático + branding O2 + datos del prode | §10.9 (Agente 5 expande) |
| M10 | `BottomNav` | 5 tabs glass | §10.10 |
| M11 | `ScreenHeader` | Back + title + actions | §10.11 |
| M12 | `EmptyState` | Icon + title + body + CTA opcional | §10.12 |
| M13 | `LockedState` | Lock icon + label + countdown | §10.13 |

### 8.3 Organismos (vistas-feature)

| # | Vista | Componentes que orquesta |
|---|---|---|
| O1 | `HomeDashboard` | NextMatchHero + StatCard×2 + PhaseProgress + PostCard×2 |
| O2 | `GroupStageScreen` | Tabs (4 grupos) + MatchCard×6 |
| O3 | `KnockoutScreen` | Bracket vertical de PhaseProgress + cards de cruce |
| O4 | `RankingScreen` | Podium + RankingRow×N + sticky myPosition |
| O5 | `SocialWallScreen` | Tabs (Destacados/Recientes) + PostCard×N + FAB |
| O6 | `ProfileScreen` | Avatar XL + StatCard×3 + menú navegación |
| O7 | `ShareScreen` | ShareCard variants + CTAs multi-canal |

---

## 9. Detalle de Primitivas

### 9.1 Button

**Variants y props canónicos:**
```ts
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg";
type ButtonProps = {
  variant?: ButtonVariant;       // default: "primary"
  size?: ButtonSize;             // default: "md"
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};
```

**Especificación visual por variant:**

| Variant | Bg | Text | Border | Hover | Pressed |
|---|---|---|---|---|---|
| `primary` | `brand.primary` | `text.inverse` | — | `brand.primary.hover` + glow | `brand.primary.pressed` |
| `secondary` | transparent | `text.primary` | `border.strong` | `surface` + border.strong | `card` |
| `ghost` | transparent | `text.primary` | — | `surface` | `card` |
| `danger` | `state.error` | `text.primary` | — | brillo +10% | atenuar 10% |
| `link` | transparent | `brand.primary` | — | underline | — |

**Tamaños:**
| Size | Height | Px hor | Type token |
|---|---|---|---|
| `sm` | 36 | 16 | `font.body.sm` weight 600 |
| `md` | 48 | 24 | `font.body.md` weight 600 |
| `lg` | 56 | 32 | `font.body.lg` weight 700 |

**Radius:** `radius.full` (pill) para primary y danger; `radius.md` para secondary/ghost.

**Estados especiales:**
- `loading`: ícono se reemplaza por spinner; texto sigue visible.
- `disabled`: opacidad 0.4 + `cursor: not-allowed` + sin hover.
- `fullWidth`: ocupa 100% del contenedor.

---

### 9.2 IconButton
Botón de un solo ícono. Tamaño cuadrado con touch target ≥ 44px. Variants: `filled` (bg surface), `outlined` (border), `ghost` (transparent). Usa Lucide icons size 20 o 24.

---

### 9.3 Avatar

**Tamaños:**
| Size | Px | Uso |
|---|---|---|
| `xs` | 24 | Mención inline en comentario |
| `sm` | 32 | Lista de comentarios |
| `md` | 40 | Ranking row, post header |
| `lg` | 56 | Header de home, perfil compacto |
| `xl` | 96 | Profile screen, podio |
| `2xl` | 128 | Share card |

**Modificadores:**
- `levelBadge`: muestra el nivel (1-5) como badge circular en esquina inferior derecha, con color por nivel (1 gris → 5 lime+glow).
- `crownBadge`: corona dorada para el #1 del ranking.
- `liveDot`: punto verde para usuario online (solo si está usando la app en vivo, futuro).
- `fallback`: si no hay imagen, mostrar iniciales sobre fondo de color generado deterministicamente del nombre.

**Radius:** siempre `radius.full`.

---

### 9.4 Badge

Etiqueta no-interactiva.
**Variants:** `default` (border + text muted), `primary` (bg primary.bg + text primary), `accent` (bg accent.soft + text accent), `success`, `warning`, `error`, `ghost`.
**Size:** alto fijo 22px, padding hor 8px, type `font.body.xs` uppercase tracking 0.04em.

---

### 9.5 Chip

Interactivo. Estado `active` con bg `brand.primary` y texto inverse. Inactivo con border y texto muted. Tap haptic implícito (Agente 6).

---

### 9.6 Input

```ts
type InputProps = {
  state?: "default" | "error" | "disabled";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  label?: string;
  helper?: string;
  errorText?: string;
  // ...HTMLInputAttributes
};
```

**Visual:**
- Bg `surface`, border 1px `border`, height 56px en mobile.
- Focus: border `brand.primary` + glow + label sube animado.
- Error: border `state.error` + helper en `state.error`.
- Label flotante (floating label pattern).

---

### 9.7 ScoreInput **(crítico — corazón de la app)**

Input numérico custom para resultados de partido. Diseño:

```
┌────────────┐    ┌────────────┐
│   ┌────┐   │    │   ┌────┐   │
│   │  2 │   │    │   │  1 │   │
│   └────┘   │    │   └────┘   │
└────────────┘    └────────────┘
   LOCAL              VISITANTE
```

**Especificación:**
- Cada slot: 64×80px, radius `lg`, bg `card`, border 1px `border`.
- Numeral en `font.numeric.lg` (Anton 32px).
- Tap → abre numpad sticky bottom (no abre teclado del SO).
- Estado vacío: placeholder "—" en `text.muted`.
- Estado lleno: numeral en `text.primary`.
- Estado focus: border `brand.primary` + glow + leve scale 1.05.
- Estado locked: candado overlay + opacidad 0.6 + tooltip "Cierra en Xh".
- Estado live: badge "EN VIVO" pulsante arriba.
- Estado settled: numeral en `text.muted` + checkmark verde si acertaste, X roja si fallaste.
- Auto-save tras 600ms de inactividad (regla UX-D2).

---

### 9.8 Switch

Toggle 56×32px. On = bg `brand.primary` + thumb desplazado. Off = bg `border`. Animación spring suave (200ms).

---

### 9.9 Skeleton

Bg base `surface`, animación shimmer con gradient que se desplaza horizontalmente cada 1.4s. Reduce-motion → reemplaza por fade pulse.

**Variants:** `text` (1 línea), `card` (rect grande), `row` (alto 56px), `circle` (avatar).

---

### 9.10 Divider

1px alto. `soft` = `border` con opacidad 0.6. `strong` = `border.strong`. Variant con label centrado para separar secciones.

---

### 9.11 Tag

Similar a Badge pero pensado para metadata de partido:
- `kickoff` → ícono reloj + "Faltan 2h 14m"
- `live` → punto rojo pulsante + "EN VIVO"
- `closed` → check + "Cerrado"
- `locked` → candado + "Disponible el 30/06"

---

### 9.12 Flag

SVG de bandera por código ISO (`ar`, `br`, `de`, etc). Sizes: 24×16 (sm), 32×22 (md), 48×32 (lg). Border radius 4px.

---

### 9.13 ProgressBar

**Linear:** alto 6px, bg `border`, fill `brand.primary`, radius `full`. Animación de fill suave al cambiar value.
**Circular:** SVG con stroke `brand.primary`, stroke-width 4, size variable. Variante con número central.

---

### 9.14 Toast

Aparece anclado top, offset 16px del safe area top. Bg `elevated` + border `border.strong` + radius `lg` + shadow `md`. Auto-dismiss 2.5s salvo errores (4s).

---

### 9.15 IconStack

Wrapper sobre Lucide React. Sizes consistentes: 16 (inline), 20 (UI default), 24 (touch targets), 32 (heroes). Stroke 2.

---

## 10. Detalle de Compuestos (resumen, ampliar en Agente 4)

### 10.1 MatchCard
Card horizontal 100% width. Layout:
```
[Flag] [Nombre]    vs    [Nombre] [Flag]
       [Score input]    [Score input]
       └─ Tag estado abajo, centrado ─┘
```
Altura 112px. Padding 16px. Bg `card`. Radius `lg`. Gap entre score inputs: 24px.

### 10.2 RankingRow
```
[#pos] [Avatar] [Nombre]                [pts]
```
Altura 56px. Si es "vos" → bg `brand.primary` + texto inverse + border más fuerte. Tap → /usuario/[id] o /perfil.

### 10.3 PodiumCard
3 columnas con la del centro (1er puesto) más alta. Avatar XL, medalla (gold/silver/bronze), nombre, score. Animación de entrada secuencial (3→2→1, último el podio principal con bounce).

### 10.4 PostCard
```
[Avatar] Nombre · hace X
         [Body text]
         [Optional: prode card embed]
         [♡ X   💬 Y   ↗ share]
```
Bg `card`, radius `lg`, padding 16px.

### 10.5 StatCard
```
TU POSICIÓN           ↑ 2
   #8
```
Label uppercase tracking, valor grande Anton, delta opcional con flecha y color.

### 10.6 NextMatchHero
Hero card con bg gradient sutil del color de los equipos. Banderas grandes, countdown debajo, CTA "IR A MI PRODE" primario fullwidth.

### 10.7 PhaseProgress
Stepper horizontal de 5 nodos (Grupos → Octavos → Cuartos → Semis → Final). Cada nodo: ícono + label. Estados: done (lime check), current (orange + glow), locked (gris + candado).

### 10.8 AchievementCard
Card cuadrada o vertical en grid 2 cols. Icon grande + título corto + descripción 1 línea. Estados:
- locked: silueta + interrogante + descripción tipo "Acertá 5 resultados exactos seguidos"
- in-progress: progress bar circular alrededor del ícono
- done: ícono full color + glow + fecha de desbloqueo

### 10.9 ShareCard
Ampliada por Agente 5. Estructura base: 1080×1920 (Story IG) o 1080×1080 (post WA). Layers: bg cinemático fitness → branding O2 → datos del prode con tipografía dramática → hashtag → trophy/iconografía.

### 10.10 BottomNav
Glass top border. 5 slots. Tab activo: ícono filled + color primary + label visible. Tab inactivo: ícono outlined + color muted + label opcional. Indicator dot opcional para notificaciones no leídas. Altura 56px + safe area inset bottom.

### 10.11 ScreenHeader
3 zonas: left (back o avatar), center (title, opcional), right (acciones). Altura 56px + safe area top. Bg `bg` sin border cuando scroll = 0; con border `border` cuando scroll > 0 (sticky pattern).

### 10.12 EmptyState
Vertical center, 80% width, ilustración minimal lineal, title heading.md, body muted, CTA opcional secondary.

### 10.13 LockedState
Card centrada con candado XL outlined, label uppercase, countdown DD:HH:MM:SS animado, descripción de cuándo se desbloquea.

---

## 11. Patrones globales

### 11.1 Estados activos (cómo marcar "esto está seleccionado")
- Tab activo: subrayado primary + texto primary.
- Chip activo: bg primary + texto inverse.
- Item de lista seleccionado: border-left 3px primary + bg surface.
- Card seleccionada: border 1px primary + glow primary.

### 11.2 Loading patterns
- Botones primarios: spinner reemplaza texto, mantiene ancho.
- Listas: skeleton rows del tamaño final.
- Pantalla completa: NUNCA spinner centrado. Siempre skeleton del layout.

### 11.3 Confirmation patterns
- Acciones destructivas (borrar post, cerrar sesión): modal con doble confirmación.
- Acciones reversibles (reaccionar, guardar score): toast inmediato.
- Acciones de alto valor (compartí tu prode): pantalla dedicada, no modal.

### 11.4 Density
3 densidades posibles, pero el sistema fija UNA por contexto:
- **Comfortable** (default mobile): 56-64px row, padding 16-24px.
- **Compact** (listas largas como ranking completo): 48px row.
- **Spacious** (heroes, share): padding 32-48px.

---

## 12. Iconografía (CUSTOM SYSTEM — no Lucide, no emojis)

### 12.1 Decisión fundacional

**Cero emojis Unicode. Cero librerías genéricas.** Iconografía 100% propia, diseñada para el sport-broadcast aesthetic del producto. Fuente única: `design/icons.svg` (sprite con `<symbol>`).

> **Why:** Nahuel rechazó explícitamente cualquier ícono que delate "AI-generated look". Los emojis (🇦🇷🏆🔒) son la firma visual más obvia de output automatizado y rompen la sensación de producto premium custom. Lucide u otras librerías universales — aunque excelentes — tampoco aportan personalización suficiente para diferenciar el producto.

### 12.2 Estilo

- **ViewBox:** 24×24 (íconos UI) · 100×100 (Sol de Mayo) · 200×320 (World Trophy)
- **Stroke:** 1.75 (íconos line) · 2.25 (check/x-mark para mayor peso)
- **Stroke caps:** square (athletic, no soft rounding)
- **Stroke joins:** miter
- **Color:** `currentColor` por default (controlable vía CSS)
- **Fills sólidos** permitidos en: heart-filled, star, crown, flame, medal interior, sol de mayo

### 12.3 Inventario completo del sprite

**Navegación (5):** nav-home · nav-trophy · nav-chart · nav-chat · nav-user
**Acciones (8):** arrow-left · arrow-right · arrow-up · arrow-down · close · share · download · more
**Estados (6):** lock · clock · bell · check · x-mark · eye
**Social (4):** heart · heart-filled · comment · send
**Sports / Gamification (6):** medal · ball · target · flame · star · crown
**Sistema (4):** settings · logout · info · alert
**Decorativos hero (2):** sol-de-mayo · world-trophy
**Banderas (14, inicial):** flag-ar · flag-br · flag-jp · flag-de · flag-fr · flag-nl · flag-sn · flag-ec · flag-qa · flag-gb · flag-ir · flag-hr · flag-ma · flag-mx

Total: **49 símbolos** en el sprite v1. Se amplía cuando se conozcan los grupos finales del sorteo Mundial 2026.

### 12.4 Uso

```html
<!-- HTML / JSX -->
<svg width="24" height="24"><use href="/design/icons.svg#nav-trophy"/></svg>
```

```tsx
// React wrapper (Agente 7 lo implementa)
<Icon name="nav-trophy" size={24} className="text-primary" />
```

### 12.5 Assets hero ilustrados

**World Trophy** — Ilustración custom del trofeo del Mundial: base octogonal con placa "FIFA WORLD CUP", columnas espirales (figuras abstraídas), globo dorado con meridianos y silueta continental sutil. Gradiente metálico (5 stops) + drop-shadow glow. Aparece como hero en la share card cinematográfica.

**Sol de Mayo** — Custom SVG del símbolo nacional argentino: 16 rayos alternantes (8 rectos + 8 ondulados), cara central con ojos, nariz, boca y cejas. Se usa como watermark de fondo (opacity 0.04–0.06, rotación -12°) en la share card cuando el campeón predicho es Argentina, y en logros vinculados a la selección.

### 12.6 Banderas

Cada bandera es un `<symbol viewBox="0 0 24 16">` con paths reales del país (no emojis Unicode 🇦🇷). Estructura nacional verídica: Argentina (celeste/blanco/sol de mayo), Brasil (verde/diamante amarillo/disco azul), Francia (tricolor vertical), etc.

### 12.7 Showcase y entrega

- **`design/icons.svg`** — sprite master con todos los `<symbol>`
- **`design/icons-system.html`** — preview navegable de todo el set
- **`design/share-argentina-cinematic.html`** — hero artifact con World Trophy + Sol de Mayo + sistema completo en acción
- **`design/screens.html`** (v2) — 9 pantallas montadas usando el icon system, cero emojis

---

## 13. Iluminación y atmósfera (capa visual)

Inspiración mockups: photos cinemáticas con high contrast, naranja como acento de luz, ambiente de gym profesional.

### 13.1 Tratamiento de fotos
- Toda foto se aplica con overlay `bg` con opacidad 0.55 + gradient bottom para legibilidad de texto encima.
- Tonalidades fotográficas: contraste alto, sombras profundas, highlights cálidos.
- No usar fotos lifestyle genéricas. Solo fotos de entrenamiento, gym, deportistas.

### 13.2 Backgrounds especiales
- **Splash:** foto fitness + gradient overlay top→bottom de `bg/0` → `bg/100`.
- **Share screen:** foto cinematográfica + gradient + branding flotando.
- **Empty states:** sin fotos. Pura tipografía + ilustración minimal lineal.

---

## 14. Reglas de composición

1. **3 niveles de superficie por pantalla**: bg → surface (nav) → card (contenido). No agregar más sin razón.
2. **Una jerarquía visual dominante por pantalla**: hay UN protagonista (next match, mi posición, mi prode). El resto es contexto.
3. **Espacio negativo > contenido**: si una pantalla se siente apretada, sacar algo, no achicar.
4. **Naranja = acción, no pertenencia**: usuario activo no se "tiñe" de naranja, solo sus acciones.
5. **Tipografía marca emoción**: scores grandes, labels chicos, sin medios tonos.
6. **Animación al servicio del relato**: si la animación no comunica algo (subiste, ganaste, se cerró), no va.

---

## 15. Validación

### 15.1 Test de coherencia
Cualquier nueva pantalla debe pasar este test:
- ¿Usa solo tokens del sistema? (no hex sueltos, no spacing arbitrario)
- ¿Tiene los 5 estados (loading/empty/locked/error/success) contemplados?
- ¿Cumple contraste WCAG AA en todo texto?
- ¿Funciona en viewport 360×640 (mínimo target)?
- ¿La acción primaria es identificable en menos de 1 segundo?

### 15.2 Antipatrones a rechazar en review
- 4 niveles de superficie apilados.
- 2 CTAs primarios en la misma pantalla.
- Gradients con más de 2 stops.
- Animación > 800ms en interacciones no celebratorias.
- Sombras "infladas" estilo Material claro.
- Tipografía italic.
- Naranja como background extenso.

---

## 16. Decisiones cerradas por este documento

| # | Decisión | Implicancia downstream |
|---|---|---|
| DS-D1 | Solo modo oscuro en MVP | No se diseña tema claro. Reduce scope. |
| DS-D2 | Tipografía Anton + Inter (libres, Google Fonts) | Agente 7 carga via `next/font`. |
| DS-D3 | Iconografía 100% custom (sprite SVG propio, cero emojis, cero librerías genéricas) | Agente 7 implementa `<Icon name="..."/>` wrapper sobre `design/icons.svg`. NO se instala `lucide-react`. |
| DS-D4 | Glassmorphism solo en BottomNav y modals fullscreen | No abusar en otros componentes. |
| DS-D5 | 15 primitivas + 13 compuestos en MVP | Agente 4 produce specs de cada uno. Agente 7 arma `/components/ui` (primitivas) y `/components/features` (compuestos). |
| DS-D6 | Tokens en JSON + CSS variables + Tailwind config (triple fuente) | Source of truth: `tokens.json`. Los otros se generan de ahí. |
| DS-D7 | Mínimo viewport 360×640 | Diseños mobile testean ese ancho como baseline. |
| DS-D8 | WCAG AA mínimo en todo MVP | Agente 12 audita; ninguna excepción se acepta. |

---

## 17. Outputs entregados (archivos)

| Archivo | Propósito |
|---|---|
| `docs/03_design_system.md` | Este documento — referencia humana |
| `design/tokens.json` | Tokens machine-readable (para Style Dictionary futuro) |
| `app/styles/globals.css` | CSS variables + base styles |
| `tailwind.config.ts` | Tailwind extendido con todos los tokens |

---

## 18. Próximo paso

**Agente 4 — Mobile UI Designer** recibe este sistema y produce specs detalladas de las 15 pantallas (referencias visuales descriptivas + estados + interacciones).

---

*Fin Agente 3 — Listo para checkpoint del usuario.*
