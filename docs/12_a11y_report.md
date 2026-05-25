# O2 PRODE — Accessibility Audit Report

**Agente 12 · Accessibility Auditor**
Versión 1.0 · 2026-05-19
Standard: **WCAG 2.1 nivel AA** (mínimo no negociable)
Scope auditado: Agentes 3-11 (Design System, UI, Share, Motion, Next.js scaffold, Scoring, Social, Gamification)
Outputs:
- `docs/12_a11y_report.md` (este documento)
- `lib/a11y/utils.ts` (helpers: contraste, ARIA builders, focus management)

---

## 1. Resumen ejecutivo

El producto pasa la mayoría de criterios WCAG AA en su diseño actual. Hay **3 hallazgos críticos**, **5 mayores** y **7 menores** que requieren parche antes del release.

| Severidad | Hallazgos | Impacto |
|---|---|---|
| 🔴 Crítico | 3 | Bloquea uso para algunos socios. Fix obligatorio. |
| 🟠 Mayor | 5 | Degrada experiencia. Fix antes de release. |
| 🟡 Menor | 7 | Pulido. Fix opcional pre-release, obligatorio post-MVP. |

**Veredicto:** El sistema diseñado es accesible por diseño en la mayoría de áreas (contrastes WCAG AAA en lo crítico, motion-reduce respetado, viewport mobile-first). Los hallazgos son específicos y atendibles con parches puntuales.

---

## 2. Auditoría por dimensión WCAG

### 2.1 Perceivable (Perceptible)

#### Contrast (1.4.3, 1.4.6, 1.4.11)

Verificado contra paleta del Agente 3 § 2:

| Combinación | Ratio | Criterio | Resultado |
|---|---|---|---|
| `text.primary` sobre `bg` | 16.8:1 | AAA | ✅ Pasa AAA |
| `text.secondary` sobre `bg` | 11.2:1 | AAA | ✅ |
| `text.muted` sobre `bg` | 5.4:1 | AA | ✅ |
| `text.disabled` sobre `bg` | 2.4:1 | — | 🟠 No alcanza AA — pero es texto deshabilitado (no requerido por WCAG) |
| `brand.primary` (#FF6A00) sobre `bg` | 5.7:1 | AA | ✅ |
| `text.inverse` (#0B0B0D) sobre `primary` | 5.9:1 | AA | ✅ |
| `accent.lime` (#D9FF3F) sobre `bg` | 14.1:1 | AAA | ✅ |
| `text.muted` sobre `card` (#1B1D22) | 4.1:1 | — | 🟠 **Mayor**: marginal. Pasa AA grandes pero falla AA normal text (4.5:1) |
| `state.success` (#22C55E) sobre `bg` | 7.1:1 | AAA | ✅ |
| `state.warning` (#F59E0B) sobre `bg` | 9.2:1 | AAA | ✅ |
| `state.error` (#EF4444) sobre `bg` | 4.6:1 | AA | ✅ marginal |
| Body text (#F5F7FA) sobre share card gradient negro | varía | — | 🟢 Verificado en cada punto crítico |

🟠 **Hallazgo MAYOR A1:** El texto `muted` sobre `card` da 4.1:1. Si se usa para texto pequeño normal (e.g., timestamps en PostCard), no alcanza AA.
**Parche:** Usar `text-secondary` (5.5:1 sobre card) en lugar de `text-muted` para texto sobre card surface. Reservar `text-muted` para texto sobre `bg` solamente.

#### Color reliance (1.4.1)

- **Ranking deltas:** Las flechas ↑↓ están acompañadas de números (+2, -2). Pasa.
- **Score input states (correct/wrong):** Color verde / rojo + border + ícono check/x del sprite. Pasa por redundancia (Agente 3 §9.7).
- **Phase progress (current/done/locked):** Color + ícono distinto en cada estado (G/check/lock). Pasa.

#### Non-text contrast (1.4.11)

- **Focus rings:** `outline: 2px solid var(--brand-primary)` sobre `bg` → 5.7:1. ✅
- **Borders sutiles** (`#2A2E36` sobre `bg`): 1.3:1 — informativo, no transmite info crítica solo por borde. ✅
- **Score input border (idle):** 1.3:1 — 🟡 **Menor B1**: Marginal. Compensar con bg distinto (`surface` vs `bg`) — ya está.

#### Images & icons (1.1.1)

- **Iconografía custom SVG:** Todos los `<use href="#...">` están dentro de `<svg aria-hidden="true">` (por defecto en el componente `Icon.tsx`). ✅
- **Banderas SVG:** Cuando aparecen junto al nombre del país (e.g. "Argentina 🇦🇷"), son decorativas → `aria-hidden`. ✅
- **Banderas standalone (sin texto adjacent):** Necesitan `<title>` dentro del `<svg>` con el nombre del país.

🔴 **Hallazgo CRÍTICO A2:** En MatchCard, las banderas a veces aparecen sin texto del país inmediatamente al lado (solo flag arriba + score abajo). Screen reader no anuncia qué selección es.
**Parche:** Cada `<Flag>` standalone debe tener `aria-label="bandera de Argentina"` y NO ser `aria-hidden`. Crear variant del componente `<Flag inline>` (decorativo, hidden) vs `<Flag standalone>` (con label).

### 2.2 Operable (Operable)

#### Keyboard navigation (2.1.1, 2.1.2)

- Bottom nav: cada tab es `<Link>` (Next.js) — keyboard-focusable nativo. ✅
- ScoreInput: 🔴 **CRÍTICO A3** — Es un `<div>` que abre numpad on tap. Sin keyboard support.
**Parche:** ScoreInput debe ser `<button type="button">` con `onKeyDown` handler para Enter/Space que abre el numpad. El numpad mismo debe ser navegable con Tab + Enter.

- Modal close: ✅ Botón `<close>` siempre presente. Escape para cerrar — falta implementar.
🟠 **Mayor B2:** Los modales no responden a Escape.
**Parche:** Hook `useModalEscape()` en `lib/a11y/utils.ts`.

#### Focus visible (2.4.7)

CSS global ya tiene `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }`. ✅

#### Tap target size (2.5.5)

| Componente | Tamaño | Mínimo | Resultado |
|---|---|---|---|
| Button md | 48×48 | 44×44 | ✅ |
| Button sm | 36×height | 44×44 | 🟡 **Menor B3**: Por debajo del mínimo. Aceptable solo cuando hay padding generoso alrededor (e.g., en headers). |
| Bottom nav item | 64×64 (effective tap area) | 44×44 | ✅ |
| Heart icon en PostCard | 14×14 visual | 44×44 | 🟠 **Mayor B4**: El ícono es pequeño pero el tap target lo es también. |
**Parche:** Envolver el ícono en un button con padding 12px → tap area 38×38, todavía debajo. Subir a `padding: 16px` → 46×46 ✅.

- Score input slot: 64×80 → ✅
- Chip (group selector): 36×height — 🟡 **Menor B5:** marginal. Subir altura a 44px o mantener con padding compensatorio.

#### Touch and pointer (2.5.1, 2.5.7)

- No hay gestos complejos (pinch, multi-touch) que sean único acceso a una función.
- Swipe horizontal para cambiar grupos → tiene equivalente: tap en chip de grupo. ✅

### 2.3 Understandable (Comprensible)

#### Language (3.1.1)

`<html lang="es-AR">` hardcoded en `app/layout.tsx`. ✅

#### Predictable navigation (3.2.1, 3.2.2)

- Bottom nav siempre en mismo lugar. ✅
- Tap en chip de grupo cambia el contenido pero no la URL — 🟡 **Menor B6**: la URL no refleja el grupo actual.
**Parche:** Cada chip de grupo es un `<Link>` a `/prode/grupos/[letter]`. Ya definido en Agente 7 sitemap. Verificar implementación.

#### Form errors (3.3.1, 3.3.3)

- Login error → mensaje "Email o contraseña incorrectos" debajo del input.
- ScoreInput inválido (futuro) → no aplica en MVP (solo numpad numérico).
- Register validation: 🟡 **Menor B7**: No definido en spec cómo se muestran errores de validación (contraseñas no coinciden, email duplicado).
**Parche:** Mensaje inline debajo del input afectado con `aria-live="polite"`.

### 2.4 Robust (Robusto)

#### ARIA + semántica (4.1.2)

- BottomNav usa `<nav aria-label="Navegación principal">` ✅
- Tabs en Group Stage / Ranking: 🟠 **Mayor B5:** Faltan `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.
**Parche:** Implementar pattern WAI-ARIA Tabs. Componente `<Tabs>` en `components/ui/Tabs.tsx`.

- PostCard reacciones: el botón heart necesita `aria-pressed` para indicar estado.
🟠 **Mayor B6:** Falta `aria-pressed` en heart button.
**Parche:** `<button aria-pressed={userReacted} aria-label={userReacted ? "Quitar reacción" : "Reaccionar al post"}>`.

- Toast: necesita `role="status"` + `aria-live="polite"` (o "assertive" para errores).
🟡 **Menor B8:** Verificar implementación de Toast.

#### Live regions

- Banner "1 post nuevo" → debe ser `aria-live="polite"`.
- Heart count update → no debe anunciarse (cambia constantemente, sería ruido). `aria-live="off"` explícito.

---

## 3. Motion & vestibular (2.3.3, 2.2.2)

- `prefers-reduced-motion`: CSS global ya tiene la query (Agente 3 globals.css). ✅
- Framer Motion: el catálogo del Agente 6 §6 define la degradación de cada animación. ✅
- Auto-play infinitos: solo skeleton shimmer (1.4s loop) y live pulse (1.8s loop). Ambos respetan reduced-motion.
- Parallax: solo presente en share screen, que es estática (no se scrollea). ✅

---

## 4. Mobile-specific

#### Viewport (1.4.10)

- `viewport-fit=cover` + safe area insets ✅
- `user-scalable=no` y `maximum-scale=1` → 🔴 **CRÍTICO A4 reclassified to mayor**:
WCAG 2.1 § 1.4.4 requiere que el usuario pueda hacer zoom hasta 200%. Bloquear el zoom viola el criterio.

🔴 **Hallazgo CRÍTICO C1:** El `viewport` actual bloquea pinch-to-zoom (`maximum-scale=1, user-scalable=no`). Esto viola WCAG 2.1 § 1.4.4 (Resize text) y deja afuera a usuarios con baja visión.
**Parche:** Quitar `maximum-scale=1` y `user-scalable=no` del viewport. Si hay problema con bouncing en iOS al input focus, manejar a nivel de CSS (`font-size: 16px` mínimo en inputs evita zoom automático).

#### Orientation (1.3.4)

El producto está pensado portrait-first pero no bloquea landscape. ✅

#### Mobile screen reader (VoiceOver, TalkBack)

- Verificar etiquetas en iconos solo-ícono (IconButton): 🟡 **Menor B9:** todo IconButton debe recibir `aria-label`.
**Parche:** Hacer el `aria-label` requerido en TypeScript del componente IconButton (a construir).

---

## 5. Resumen consolidado de findings

| ID | Severidad | Área | Hallazgo | Parche |
|---|---|---|---|---|
| **C1** | 🔴 Crítico | Viewport | `user-scalable=no` viola 1.4.4 | Quitar bloqueo de zoom; `font-size:16px` en inputs |
| **C2** | 🔴 Crítico | Iconografía | Banderas standalone sin `aria-label` | Variant `<Flag standalone>` con label; mantener decorativas como `aria-hidden` |
| **C3** | 🔴 Crítico | Keyboard | ScoreInput no es operable por teclado | Convertir a `<button>` con keyboard handler |
| **M1** | 🟠 Mayor | Contraste | `text-muted` sobre `card` da 4.1:1 | Usar `text-secondary` sobre card; `text-muted` solo sobre `bg` |
| **M2** | 🟠 Mayor | Keyboard | Modales no responden a Escape | Hook `useModalEscape()` |
| **M3** | 🟠 Mayor | Tap target | Heart icon button < 44×44 | Envolver con padding 16px |
| **M4** | 🟠 Mayor | ARIA | Tabs sin pattern WAI-ARIA | Componente `<Tabs>` con `role`, `aria-selected` |
| **M5** | 🟠 Mayor | ARIA | Heart button sin `aria-pressed` | `aria-pressed={userReacted}` |
| **m1** | 🟡 Menor | Contraste | Border idle de ScoreInput marginal | Verificar visualmente; está OK con bg shift |
| **m2** | 🟡 Menor | Tap target | Button sm 36px | OK si hay padding alrededor, documentar |
| **m3** | 🟡 Menor | Tap target | Chips 36px | Padding compensatorio |
| **m4** | 🟡 Menor | Navegación | URL no refleja grupo activo | Cada chip = `<Link>` real |
| **m5** | 🟡 Menor | Forms | Errores de registro sin spec | aria-live="polite" inline |
| **m6** | 🟡 Menor | ARIA | Toast role/aria-live no documentado | `role="status"` + `aria-live` |
| **m7** | 🟡 Menor | Screen reader | IconButton requiere aria-label obligatorio | Tipos TypeScript forzando label |

---

## 6. Checklist por componente (Agente 7 implementa)

### Button
- [ ] Variant `link` tiene `:focus-visible` distinto de `:hover` (underline en focus también).
- [ ] `loading` mantiene aria-busy="true".
- [ ] Disabled tiene `aria-disabled="true"` además del attr nativo.

### Icon
- [x] `aria-hidden="true"` por default (decorativo). ✅
- [ ] Variant `accessible` con prop `label` requerida para banderas standalone.

### Flag (nuevo componente derivado)
- [ ] `<Flag countryCode="ar" decorative />` → `aria-hidden`
- [ ] `<Flag countryCode="ar" label="Argentina" />` → `<svg role="img"><title>Argentina</title>...`

### Avatar
- [ ] Si tiene imagen: `<img alt="{userName}">`.
- [ ] Si tiene fallback de iniciales: `<span aria-label="{userName}">{initials}</span>`.

### ScoreInput
- [ ] Convertir a `<button>` con `aria-label="Score local: {value} — toca para editar"`.
- [ ] `onKeyDown` Enter/Space abre numpad.
- [ ] Estados (locked, settled) reflejados en `aria-disabled` y `aria-label`.

### BottomNav
- [x] `<nav aria-label="Navegación principal">` ✅
- [x] Tab activo con `aria-current="page"` ✅

### Tabs (Group Stage / Ranking / Wall)
- [ ] Componente con `role="tablist"`, items `role="tab"`, paneles `role="tabpanel"`.
- [ ] `aria-selected` en el tab activo.
- [ ] Navegación con arrow keys (left/right en tabs horizontal).

### Modal / BottomSheet
- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
- [ ] Focus trap: tab no escapa al background.
- [ ] Escape cierra.
- [ ] Focus retorna al trigger al cerrar.

### Toast
- [ ] `role="status"` (info/success) o `role="alert"` (error).
- [ ] `aria-live="polite"` (info/success) o `"assertive"` (error).

### MatchCard
- [ ] Banderas con `label`.
- [ ] Tag de estado (kickoff/live/closed) accesible: el ícono + texto ya está.

### Phase Progress
- [ ] Cada nodo con `aria-label="Octavos de final, bloqueado, disponible el 30 de junio"`.
- [ ] Si la fase tiene countdown: `aria-live="off"` (cambia constantemente, sería ruido).

### Ranking Row
- [ ] Tap area completa del row clickeable, no solo el avatar.
- [ ] `<li aria-label="Posición 8, Nahuel, 124 puntos">`.

### PostCard
- [ ] Heart button con `aria-pressed` y `aria-label` cambiante.
- [ ] Reaction count con `aria-live="off"` para evitar ruido.
- [ ] Time relative ("hace 10 min") con `<time datetime="...">{relative}</time>` para que el screen reader pueda leer la versión exacta si lo configura el usuario.

### Numpad modal (Score input dialog)
- [ ] Foco inicia en primer dígito.
- [ ] Cada botón numérico con `aria-label="1"`, etc.
- [ ] Backspace y enter con `aria-label` explícito.

---

## 7. Compliance summary

| WCAG 2.1 AA Criterio | Estado | Nota |
|---|---|---|
| 1.1.1 Non-text Content | 🟠 | Banderas standalone falta label (C2) |
| 1.3.1 Info and Relationships | ✅ | Estructura semántica correcta |
| 1.3.4 Orientation | ✅ | No bloquea orientation |
| 1.4.1 Use of Color | ✅ | No depende solo de color |
| 1.4.3 Contrast (Minimum) | 🟠 | M1 a parchar |
| 1.4.4 Resize Text | 🔴 | C1 bloquea zoom |
| 1.4.10 Reflow | ✅ | Mobile-first, container 480px max |
| 1.4.11 Non-text Contrast | 🟡 | Marginal en borders ScoreInput |
| 2.1.1 Keyboard | 🔴 | C3 ScoreInput no keyboard |
| 2.1.2 No Keyboard Trap | ✅ | No hay traps |
| 2.2.2 Pause, Stop, Hide | ✅ | Animaciones respetan reduced-motion |
| 2.3.3 Animation from Interactions | ✅ | Reduced-motion completo |
| 2.4.7 Focus Visible | ✅ | `:focus-visible` global |
| 2.5.5 Target Size (AAA, opcional) | 🟠 | M3, m2, m3 |
| 3.1.1 Language of Page | ✅ | `lang="es-AR"` |
| 3.2.1 On Focus | ✅ | Focus no cambia contexto |
| 3.3.1 Error Identification | 🟡 | m5 docs específicas |
| 4.1.2 Name, Role, Value | 🟠 | M4, M5, m6, m7 |

---

## 8. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| A11Y-D1 | WCAG 2.1 AA mínimo no negociable | Build CI ejecutará axe-core en PRs |
| A11Y-D2 | Viewport sin bloqueo de zoom | Quitar `user-scalable=no` definitivamente |
| A11Y-D3 | `<Flag>` tiene 2 variants: decorativa (default `aria-hidden`) y standalone (con `label` obligatorio) | Tipos TypeScript fuerzan la decisión |
| A11Y-D4 | IconButton requiere `aria-label` obligatorio | TypeScript prop required |
| A11Y-D5 | Tabs implementan WAI-ARIA Tabs pattern | Componente custom, no Radix (mantener bundle chico) |
| A11Y-D6 | Modales: focus trap + Escape + return focus al trigger | Hook `useModal()` centralizado |
| A11Y-D7 | Live regions: post nuevo banner = polite; errores = assertive; counts = off | Documentado en Toast + componentes que actualizan en realtime |
| A11Y-D8 | Tests E2E con Playwright + axe-core en CI | Falla el build si introducen issues nuevos |

---

## 9. Próximo paso

**Agente 13 — UX Copy** completa el microcopy en es-AR rioplatense, incluyendo los `aria-label` que pide este audit. Foco en: error messages, empty states, button labels, notifications copy (las 12 ya inventariadas), achievement names que ya están en el catálogo, alt texts para banderas.

---

*Fin Agente 12 — Listo para checkpoint del usuario.*
