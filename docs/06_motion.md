# O2 PRODE — Motion System

**Agente 6 · Motion Designer**
Versión 1.0 · 2026-05-18
Inputs: `03_design_system.md`, `04_ui_designs.md`, `05_viral_share.md`
Outputs:
- `docs/06_motion.md` (este documento)
- `lib/motion/variants.ts` (catálogo de Framer Motion variants)
- `design/motion-preview.html` (demo navegable en vivo)

---

## 1. Filosofía del movimiento

> "El movimiento cuenta una historia. Si no cuenta nada, no va."

El sistema de motion de O2 PRODE se rige por **5 reglas no negociables**:

1. **Toda animación tiene un significado.** Subiste, ganaste, se desbloqueó, está cargando, está vivo. Si no transmite información, sale.
2. **Duración proporcional al peso.** Tap = 120ms. Modal = 320ms. Celebración = 800ms. Nunca al revés.
3. **Easings consistentes.** 4 curvas para todo el producto. Cero `ease-in-out` genérico.
4. **Reduced motion respetado.** Toda animación de translate/scale/rotate degrada a fade cuando el sistema lo pide.
5. **Performance > glamour.** 60fps en mobile mid-range o no va. Animar `transform` y `opacity`, nunca `width/height/top/left`.

---

## 2. Tokens de motion (consolidados del DS)

Estos tokens viven en `globals.css` y se importan en `lib/motion/variants.ts` para Framer Motion.

### 2.1 Duraciones

| Token | ms | Caso de uso |
|---|---|---|
| `duration.fast` | 120 | Hover, color change, border change |
| `duration.base` | 200 | Tap scale, fade in/out de inputs, toast appear |
| `duration.medium` | 320 | Modal open, sheet slide, page transition |
| `duration.slow` | 480 | Unlock de fase, page load orchestration |
| `duration.epic` | 800 | Logro desbloqueado, podio reveal completo |
| `duration.shimmer` | 1400 | Skeleton shimmer loop (no es animación de UI per se) |

### 2.2 Easings

| Token | Curve | Caso de uso |
|---|---|---|
| `ease.standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default. Entradas + transiciones generales |
| `ease.decelerate` | `cubic-bezier(0, 0, 0, 1)` | UI que aparece (modal, popover) |
| `ease.accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | UI que sale (close modal, dismiss toast) |
| `ease.spring` | Framer Motion spring(stiffness=400, damping=30) | Tap, scale bounce, podium reveal |
| `ease.linear` | `linear` | Progress bars, countdowns, shimmer |

### 2.3 Springs (Framer Motion)

```typescript
export const springs = {
  // Default tap response
  tap: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
  // Bouncy reveal (podium, achievement modal)
  bounce: { type: "spring", stiffness: 380, damping: 22, mass: 0.8 },
  // Smooth modal slide
  modal: { type: "spring", stiffness: 280, damping: 30 },
  // Number counter (smooth, no bounce)
  counter: { type: "spring", stiffness: 100, damping: 20 },
} as const;
```

---

## 3. Catálogo de animaciones por contexto

### M01 — Tap feedback (universal)
**Cuándo:** En cualquier elemento interactivo (Button, Card, IconButton, Avatar tap).
**Animación:**
- `whileTap={{ scale: 0.96 }}`
- Spring `tap`
- Duración efectiva ≈ 200ms (la spring decide el rebote)

**Variante para CTAs primarios:**
- `whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(255,106,0,0.4)" }}`

**Antipatrón:** scale < 0.9 (sobreactuado) o > 0.98 (imperceptible).

---

### M02 — Page transitions
**Cuándo:** Navegación entre tabs principales / sub-rutas dentro del mismo dominio.
**Animación:**
- Salida: `opacity: 1 → 0` + `y: 0 → -8`, duración `base` (200ms), ease `accelerate`
- Entrada: `opacity: 0 → 1` + `y: 8 → 0`, duración `medium` (320ms), ease `decelerate`
- Stagger entre páginas hermanas: NO (mejora percepción de velocidad).

> En Next.js App Router se implementa con `framer-motion`'s `AnimatePresence` envolviendo el layout group.

---

### M03 — Modal / Bottom sheet slide
**Cuándo:** Numpad de score, Share modal, Comment compose, Score input dialog.
**Animación:**
- Backdrop: `opacity: 0 → 1`, duración `base`
- Sheet: `y: 100% → 0%`, spring `modal` (Framer)
- Al cerrar: `y: 0% → 100%` + backdrop fade out, duración `base`, ease `accelerate`

**Hint visual:** Drag handle (4×40px pill) en top del sheet → invita a swipe-down para cerrar.

---

### M04 — Toast appear / dismiss
**Cuándo:** Confirmación de save, error de red, logro menor.
**Animación:**
- Aparición: `y: -32px → 0px` + `opacity: 0 → 1` + `scale: 0.92 → 1`, spring `bounce`, duración efectiva ≈ 400ms
- Permanencia: 2500ms (4000ms si es error)
- Dismiss: `y: 0px → -16px` + `opacity: 1 → 0`, duración `base`, ease `accelerate`

---

### M05 — Skeleton shimmer
**Cuándo:** Pantallas en loading state (Home, Group Stage, Ranking, Wall).
**Animación:**
- Gradient horizontal de 0% transparente → 50% rgba(255,255,255,0.04) → 100% transparente
- `translateX: -100% → 100%`, duración `1.4s`, easing `linear`, loop infinito

> CSS-only (no Framer Motion necesario). Reduce-motion: degrade a fade pulse opacity 0.3 ↔ 1 cada 1.6s.

---

### M06 — Live pulse (partidos en vivo)
**Cuándo:** Badge "EN VIVO" en MatchCard cuando un partido está activo.
**Animación:**
- Punto rojo: `scale: 1 → 1.5` + `opacity: 1 → 0.4` y back, duración `1.8s`, easing `ease-in-out`, loop infinito
- CSS-only.

---

### M07 — Bottom nav tab change
**Cuándo:** Tap en un tab inactivo.
**Animación:**
- Icono outline → filled (cross-fade), duración `fast` (120ms)
- Label: opacidad de muted a primary, duración `base` (200ms)
- Indicator underline (solo si DS usa underlines en tabs): `width: 0 → 100%`, spring `modal`
- Tap scale del ítem entero `0.96 → 1`, spring `tap`

---

### M08 — Score input focus + value entry
**Cuándo:** Tap en ScoreInput → abre numpad → ingresa número.
**Animación:**
- Focus: `borderColor: border → primary` + `boxShadow: none → 0 0 24px primary-glow` + `scale: 1 → 1.05`, duración `base`, ease `decelerate`
- Value change: nuevo numeral entra con `y: 12 → 0` + `opacity: 0 → 1`, duración `fast`, ease `standard`
- Auto-save toast: usa M04
- Settled state (acierto / fallo): borderColor cross-fade a success/error, duración `base`, sin scale change

---

### M09 — Group swipe (horizontal entre grupos A→B→C...)
**Cuándo:** Swipe horizontal en Group Stage screen.
**Animación:**
- Drag con `dragConstraints` calculados sobre el contenedor
- Snap a la siguiente página con spring `modal`
- Velocity-based: drag > 50% width O velocity > 300 → snap a siguiente; sino vuelve.
- Chip de grupo activo actualiza sincronizado durante el drag (no espera el snap)

---

### M10 — Phase progress unlock ★ (cinematográfico)
**Cuándo:** Una fase eliminatoria se desbloquea (octavos, cuartos, semis, final).
**Animación (orquestada, ≈800ms total):**
1. **t=0**: vibración haptic (si device soporta).
2. **t=0–200ms**: el nodo locked se "expande" `scale: 1 → 1.2`, ease `decelerate`.
3. **t=100–300ms**: ícono de candado cross-fade a ícono de fase, ease `standard`.
4. **t=200–500ms**: glow primary aparece debajo del nodo `opacity: 0 → 1` + `boxShadow: 0 0 32px primary-glow`.
5. **t=400–600ms**: línea conectora siguiente se ilumina `strokeDashoffset` animation.
6. **t=600–800ms**: ligera oscilación `scale: 1.2 → 1` con spring `bounce`.

**Acompañamiento:** Toast informativo "Las eliminatorias están abiertas. Multiplicador x2".

---

### M11 — Podium reveal (Ranking screen)
**Cuándo:** Primer load de Ranking screen por sesión / tras cambio de tab a Ranking.
**Animación secuencial (≈1200ms total):**
1. **t=0**: 3er puesto entra `y: 40px → 0` + `opacity: 0 → 1`, spring `bounce`, delay 0.
2. **t=200ms**: 2do puesto entra, mismo pattern, delay 200ms.
3. **t=400ms**: 1er puesto entra desde más abajo `y: 80px → 0`, spring `bounce`, delay 400ms.
4. **t=600ms**: Crown del 1er puesto entra `scale: 0 → 1` + `rotate: -20deg → 0deg`, spring `bounce`, delay 600ms.
5. **t=800ms**: medallas se "encienden" con drop-shadow glow del color respectivo.

Solo se ejecuta UNA vez por sesión. Subsiguientes vistas → render directo.

---

### M12 — Number counter (puntos sumándose)
**Cuándo:** Al abrir la app después de que un partido terminó → mis puntos aumentan visiblemente.
**Animación:**
- `motion.span` con `animate={{ count: targetValue }}` usando `useMotionValue` + `useTransform`
- Duración: `min(800ms, max(400ms, delta * 20ms))` — más puntos, más tiempo, pero capped.
- Spring `counter` (smooth, no bounce).
- Trailing toast: "+5 pts en Argentina vs Japón"

---

### M13 — Heart pop (reacción en muro)
**Cuándo:** Tap en heart icon en PostCard.
**Animación (optimistic UI):**
1. **t=0**: Cross-fade outline → filled, color a `live` (#ff2d55).
2. **t=0–200ms**: `scale: 1 → 1.4 → 1`, spring `bounce`.
3. **t=0–600ms**: "ghost heart" emerge desde el corazón principal, `y: 0 → -40px` + `opacity: 1 → 0` + `scale: 1 → 1.6`, ease `decelerate`.
4. **t=0**: Counter actualiza optimistic.

Si el server rechaza → revertir con fade + toast error.

---

### M14 — Share modal carousel swipe
**Cuándo:** En Share screen, swipe horizontal entre los 4 templates.
**Animación:**
- Cards en horizontal scroll con `scroll-snap-type: x mandatory`
- Indicator dots actualizan en sync con `IntersectionObserver` o scroll listener
- Indicador activo: `width: 6px → 20px` + `backgroundColor: border → primary`, spring `modal`

---

### M15 — Share completed celebration
**Cuándo:** Después de un share exitoso (detectado vía Web Share API success).
**Animación (≈600ms):**
1. **t=0**: Modal de share comienza a cerrarse (slide down).
2. **t=100ms**: Fullscreen overlay con confetti-like particle effect (SVG circles que caen).
3. **t=100–600ms**: Texto central "¡Listo! Compartiste tu prode 🎯" — no usa emoji, se reemplaza por icono `#target` del sprite.
4. **t=500–600ms**: Overlay fade out.

> Para reduced-motion: skip el confetti, solo toast "Listo, compartiste tu prode".

---

### M16 — Achievement unlock modal ★ (celebracional)
**Cuándo:** Inmediatamente al desbloquear un logro (trigger desde game engine).
**Animación (≈1200ms total):**
1. **t=0**: Backdrop fade in + blur, duración `medium`.
2. **t=200ms**: Icono del logro entra `scale: 0 → 1.2 → 1` + `rotate: -180 → 0`, spring `bounce`, glow lime intensificándose.
3. **t=500ms**: Título "LOGRO DESBLOQUEADO" entra `y: 20 → 0` + `opacity: 0 → 1`, ease `decelerate`.
4. **t=700ms**: Nombre del logro entra, same pattern.
5. **t=900ms**: CTAs "Compartir" + "Cerrar" deslizan desde abajo.
6. Loop: glow lime "respira" en intervalos de 2.4s mientras el modal está abierto.

> Single trigger por logro. Si hay 3 logros en cola, mostrar uno por vez con M16 secuencial.

---

### M17 — FAB scroll contraction
**Cuándo:** En Wall screen, al scrollear el feed.
**Animación:**
- Al scroll-down: FAB se contrae de `[text + icon, width 200px]` a `[icon only, width 56px]`, duración `medium`, ease `standard`.
- Al scroll-up: expande de nuevo, mismo pattern.
- Trigger: scroll velocity > 100px/s.

---

### M18 — Pull-to-refresh
**Cuándo:** Pull-down en Wall y Ranking screens.
**Animación:**
- Estado idle → pulling: indicator SVG (circle progress) fill aumenta con el drag distance.
- Threshold reached: rotación inicial + cambio de color a primary.
- Releasing: snap-back con spring `modal`, indicador rota mientras refetching.
- Done: indicador colapsa con fade.

---

### M19 — Splash → Login transition
**Cuándo:** Después del splash de 2s.
**Animación:**
- Title block: `y: 0 → -32px` + `opacity: 1 → 0`, duración `slow`, ease `accelerate`
- CTA "ENTRAR": `scale: 1 → 1.05 → 0.92` + fade out — sensación de "presionaste y se va"
- Background overlay → solid bg para revelar la pantalla siguiente

---

### M20 — Locked → Available cross-fade
**Cuándo:** Cuando una predicción de partido cierra (1h antes del kickoff).
**Animación:**
- Border del MatchCard cross-fade de `border` → `border` con tinte warning (amarillo sutil) durante los últimos 5 min.
- Tag "EN VIVO" toma el lugar al kickoff con M06 (live pulse).
- ScoreInput cross-fade a estado settled cuando termina el partido + puntos calculados.

---

## 4. Orquestación de carga de pantalla principal (Home)

Cuando se abre Home por primera vez en una sesión:

```
t=0      Status bar + ScreenHeader (instant, no anim)
t=0-200  StatCard "Posición" entra (y: 16→0, opacity: 0→1)
t=80-280 StatCard "Puntos" entra (stagger 80ms)
t=160-460 NextMatchHero entra (y: 24→0, opacity, slight scale 0.98→1)
t=300-500 PhaseProgress entra (cada nodo con stagger 50ms entre sí)
t=500-700 ActividadReciente cards entran (stagger 100ms cada una)
```

Esta orquestación corre solo en **first load** por sesión. Refreshes posteriores → render directo sin re-orchestar (incluye Suspense streaming).

---

## 5. Performance budget

| Métrica | Target | Acción si supera |
|---|---|---|
| FPS en animaciones | ≥ 60 en iPhone 12 / Pixel 6 | Auditar transforms vs layout properties |
| First contentful animation | < 100ms desde mount | Reducir delay inicial |
| Animation bundle (Framer) | < 60KB gzipped | Tree-shake imports |
| Layout shifts | 0 CLS | Reservar espacio con skeletons |

**Reglas técnicas:**
- Solo animar `transform` y `opacity`. NUNCA `width`, `height`, `top`, `left`, `margin`.
- `will-change: transform` SOLO durante la animación, removerlo después.
- Para listas grandes (ranking completo) → `LayoutGroup` de Framer Motion para optimizar reorders.
- En cards de feed → `layoutId` para enable shared layout transitions cuando se navega a detail.

---

## 6. Reduced motion (a11y)

Cuando `(prefers-reduced-motion: reduce)` está activo:

| Animación | Degradación |
|---|---|
| Tap scale | Sin scale, solo color change |
| Page transition | Crossfade simple (200ms) |
| Modal slide | Fade in/out |
| Podium reveal | Render directo (sin secuencia) |
| Phase unlock | Color change + toast (sin scale/glow animation) |
| Heart pop | Solo cross-fade outline → filled |
| Share celebration | Solo toast, sin confetti |
| Achievement modal | Fade in + cross-fade icon (sin scale/rotate) |
| Skeleton shimmer | Pulse opacity en lugar de translate |

> En CSS: queries `@media (prefers-reduced-motion: reduce)` ya están en `globals.css`.
> En Framer Motion: hook `useReducedMotion()` decide qué variant servir.

---

## 7. Variants de Framer Motion (catálogo TypeScript)

Ver archivo `lib/motion/variants.ts`. Resumen del API:

```typescript
import { tapVariants, fadeVariants, slideUp, modalSlide, podiumReveal } from '@/lib/motion/variants';

<motion.button variants={tapVariants} whileTap="tap" whileHover="hover" />
<motion.div variants={fadeVariants} initial="hidden" animate="visible" exit="hidden" />
<motion.div variants={modalSlide} initial="hidden" animate="visible" exit="hidden" />
```

Catálogo:
- `tapVariants` (M01)
- `pageTransition` (M02)
- `modalSlide` (M03)
- `toastSlide` (M04)
- `bottomNavTab` (M07)
- `scoreInputFocus` (M08)
- `phaseUnlock` (M10) — orquestada con `useAnimate` controls
- `podiumReveal` (M11) — usa stagger children
- `heartPop` (M13)
- `fabContract` (M17)
- `achievementUnlock` (M16) — orquestada con `useAnimate`

---

## 8. Antipatrones explícitos

Lo que NO se hace:

1. **Animaciones decorativas vacías.** Ej: card que "respira" en idle sin razón → fuera.
2. **Bouncy entrances en toda pantalla.** El bounce se reserva para celebración (podio, logro). Si todo bounce, nada bounce.
3. **Parallax en mobile.** Excepto en share screen (donde es atmosférico), nada se mueve a velocidad distinta al scroll.
4. **Animar `width/height` directo.** Causa reflow. Usar `transform: scale` o cambio de layout discreto.
5. **Animar gradient values en CSS.** No es interpolable. Usar capas y crossfade de opacity.
6. **Auto-playing video / GIF como decoración.** Drena batería. Cero gifs en el producto.
7. **Animaciones que duran más de 1.2s.** Salvo M16 (achievement) que es 1.2s justos, nada excede ese cap.
8. **Springs muy elásticos** (damping < 15). Se sienten amateur.
9. **Stagger entre 50 elementos.** Cap a 6 elementos visibles, después render directo.

---

## 9. Implementación: dependencias

- `framer-motion` ≥ 11.0
- `react` ≥ 18 (required para Server Components compatibility)
- Hook `useReducedMotion()` de Framer Motion

**Tree-shaking:**
```typescript
// ✓ OK — solo importás lo que usás
import { motion, AnimatePresence, useAnimate } from "framer-motion";

// ✗ NO — importa todo
import * as Motion from "framer-motion";
```

---

## 10. Testing motion

- **Visual regression:** Capturar screenshots key frames con Playwright en CI.
- **Performance:** Lighthouse CI con budget de TBT (Total Blocking Time) < 200ms.
- **Reduced motion:** Test manual con OS setting activado en cada release.
- **Slow device:** Test manual en iPhone SE 1ª gen y Android low-end (Moto G7).

---

## 11. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| MO-D1 | Framer Motion como única librería de animación | Agente 7 instala dep. No usar React Spring, no usar CSS transitions custom complejas |
| MO-D2 | 5 duraciones + 4 easings + 3 springs como sistema cerrado | Cualquier animación nueva debe encajar en estos tokens |
| MO-D3 | Reduced motion siempre soportado | Agente 12 audita en cada pantalla |
| MO-D4 | Solo `transform` y `opacity` animables | Code review rechaza animar `width/height/top/left` |
| MO-D5 | Podium y phase unlock son las únicas orquestaciones complejas en MVP | Resto son single-property animations |
| MO-D6 | Variants exportados desde `lib/motion/variants.ts` como source of truth | Componentes importan, no definen inline |
| MO-D7 | Cero gifs/video en el producto | Si se necesita "video-like" → SVG anim o Lottie en futuro |

---

## 12. Próximo paso

**Agente 7 — Next.js Architect** recibe este catálogo y produce:
- Scaffold del proyecto con `framer-motion` instalado
- `lib/motion/variants.ts` puesto en su lugar
- Componentes que aplican los variants (Button, Card, Modal, etc.)
- Page transitions configuradas a nivel layout

---

*Fin Agente 6 — Listo para checkpoint del usuario.*
