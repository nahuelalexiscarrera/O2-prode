# O2 PRODE — Mobile UI Designs

**Agente 4 · Mobile UI Designer**
Versión 1.0 · 2026-05-18
Inputs: `01_product_strategy.md`, `02_ux_architecture.md`, `03_design_system.md`
Output complementario: `design/screens.html` (mockup navegable)

---

## 1. Cómo leer este documento

Cada pantalla se documenta con la misma estructura:

- **Propósito** — qué problema resuelve y para qué persona.
- **Layout** — diagrama ASCII de bloques con dimensiones.
- **Componentes** — qué primitivas y compuestos del Agente 3 usa.
- **Estados** — empty / loading / locked / error / success cuando aplican.
- **Interacciones clave** — gestos, taps, animaciones críticas.
- **Notas de implementación** — qué tiene que saber el Agente 7.

Viewport baseline: 390 × 844 (iPhone 14 Pro). Mínimo soportado: 360 × 640. Container de contenido: max-width 480px centrado.

---

## 2. Pantalla 01 — Splash

**Propósito:** Primera impresión de marca. 2 segundos máximo. Carga assets + redirige a `/auth/login` si no hay sesión, o a `/app` si la hay.

**Layout:**
```
┌──────────────────────────────┐
│                              │
│   [Bg foto fitness cinema]   │  ← Photo overlay 55% bg
│                              │     gradient bottom→top
│                              │
│                              │
│   PRODE                      │  ← Anton 56, blanco
│   MUNDIAL                    │
│   O2                         │  ← O2 con primary-soft glow
│                              │
│                              │
│   Competí con tus            │  ← body.lg, secondary
│   compañeros. Demostrá       │
│   que sabés de fútbol.       │
│   Ganá premios.              │
│                              │
│   ┌────────────────────┐     │
│   │      ENTRAR        │     │  ← Button primary lg fullwidth
│   └────────────────────┘     │
│                              │
│   ¿No tenés cuenta?          │  ← body.md, muted
│   Registrate                 │  ← Link primary
│                              │
│   [O2 logo + Wellness Club]  │  ← branding sutil bottom
└──────────────────────────────┘
```

**Componentes:** Button primary (lg, fullwidth), Link primary, Brand mark.

**Interacciones:**
- 600ms fade-in del título (Anton).
- 200ms delay → fade-in del párrafo.
- 400ms delay → slide-up del CTA.
- Glow del primary lateamente respira (loop 4s).

**Notas:** Foto de fondo es asset estático. Soporta crop center-bottom para no perder el rostro/elemento principal en aspect ratios distintos.

---

## 3. Pantalla 02 — Login

**Propósito:** Autenticación rápida de socio existente.

**Layout:**
```
┌──────────────────────────────┐
│ ← [back]                     │
│                              │
│ INICIÁ SESIÓN                │  ← display.md
│                              │
│ Entrá con tu cuenta de       │  ← body.md secondary
│ socio O2.                    │
│                              │
│ [Email                ]      │  ← Input
│ [Contraseña       👁  ]      │  ← Input + toggle eye
│                              │
│ ¿Olvidaste tu contraseña?    │  ← Link
│                              │
│ ┌────────────────────────┐   │
│ │       INGRESAR         │   │  ← Button primary fullwidth
│ └────────────────────────┘   │
│                              │
│ ── o ──                      │  ← Divider con label
│                              │
│ ┌────────────────────────┐   │
│ │  CONTINUAR CON GOOGLE  │   │  ← Button secondary (futuro)
│ └────────────────────────┘   │
│                              │
│ ¿Sos socio nuevo? Registrate │
└──────────────────────────────┘
```

**Estados:**
- **Default:** inputs vacíos, CTA deshabilitado hasta que ambos campos tengan contenido.
- **Loading:** CTA muestra spinner, inputs disabled.
- **Error:** banner inline arriba del primer input — "Email o contraseña incorrectos."

**Interacciones:**
- Email auto-focus al entrar.
- Tab/next del teclado salta al siguiente input.
- Submit con enter habilitado.

**Notas:** Google sign-in queda fuera del MVP pero el espacio está reservado. Auth con Supabase email+password.

---

## 4. Pantalla 03 — Register

**Propósito:** Onboarding de nuevo socio. Invite code obligatorio.

**Layout:**
```
┌──────────────────────────────┐
│ ← [back]                     │
│                              │
│ HACETE SOCIO O2 PRODE        │  ← display.md
│                              │
│ El acceso es solo para       │  ← body.md secondary
│ socios del gimnasio.         │
│                              │
│ [Código de invitación   ]    │  ← Input mono, autocaps
│                              │
│ ┌────────────────────────┐   │
│ │      VALIDAR CÓDIGO    │   │
│ └────────────────────────┘   │
│                              │
└──────────────────────────────┘

(Tras validar código exitoso, transición a:)

┌──────────────────────────────┐
│ ← [back]                     │
│                              │
│ CÓDIGO OK ✓                  │  ← badge success
│ Bienvenido, socio O2.        │
│                              │
│ [Nombre completo       ]     │
│ [Email                 ]     │
│ [Contraseña       👁   ]     │
│ [Repetir contraseña    ]     │
│                              │
│ ☐ Acepto los términos        │  ← Switch + label
│                              │
│ ┌────────────────────────┐   │
│ │       CREAR CUENTA     │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

**Estados:**
- Invite code inválido → input border error + helper text.
- Contraseñas no coinciden → input.repetir con error.
- Email ya registrado → toast error + link "¿Querés iniciar sesión?"

**Notas:** Invite code valida contra tabla `invite_codes` con flag `used = false`. Una vez creado el user, se marca como usado y queda asociado.

---

## 5. Pantalla 04 — Onboarding (3 pantallas)

**Propósito:** Activar al usuario hacia su primera predicción en ≤ 90s.

### 4a — Cómo funciona
```
┌──────────────────────────────┐
│                       skip → │
│                              │
│   [Ilustración minimal:      │
│    cancha + pelota + flecha] │
│                              │
│ CÓMO FUNCIONA                │  ← display.md
│                              │
│ Predecí los resultados de    │  ← body.lg
│ cada partido. Cuanto más     │
│ acertás, más puntos sumás.   │
│ Competís contra el resto     │
│ de los socios del gimnasio.  │
│                              │
│ ● ○ ○                        │  ← Pagination dots
│                              │
│ ┌────────────────────────┐   │
│ │       SIGUIENTE        │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

### 4b — Predicción inicial (lo más importante)
```
┌──────────────────────────────┐
│                       skip → │
│                              │
│ TU PREDICCIÓN INICIAL        │  ← display.md
│                              │
│ Antes de que empiece el      │  ← body.md
│ Mundial, marcá tu apuesta:   │
│                              │
│ CAMPEÓN DEL MUNDIAL          │  ← label-uppercase
│ [Seleccionar selección ▾]    │  ← Select abre bottom sheet
│                              │
│ GOLEADOR DEL TORNEO          │
│ [Seleccionar jugador ▾]      │
│                              │
│ RESULTADO DE LA FINAL        │
│ [Local] - [Visit]            │  ← Score input × 2
│ [Seleccionar finalistas]     │
│                              │
│ ● ● ○                        │
│                              │
│ ┌────────────────────────┐   │
│ │       SIGUIENTE        │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

### 4c — Notificaciones
```
┌──────────────────────────────┐
│                       skip → │
│                              │
│   [Bell icon grande pulsante]│
│                              │
│ ACTIVÁ NOTIFICACIONES        │
│                              │
│ Te avisamos antes de cada    │
│ partido para que no te       │
│ pierdas de cargar tu prode.  │
│                              │
│ ● ● ●                        │
│                              │
│ ┌────────────────────────┐   │
│ │       ACTIVAR          │   │
│ └────────────────────────┘   │
│ AHORA NO                     │  ← Ghost button
└──────────────────────────────┘
```

**Notas:** Las 3 pantallas son swipeables horizontalmente. El usuario puede salirse en cualquier momento con "skip" y va directo a Home. La predicción inicial es opcional pero re-prompted con banner si la skipea.

---

## 6. Pantalla 05 — Home Dashboard ★

**Propósito:** El "first paint" de cada apertura. Debe contestar 3 preguntas en menos de 1 segundo: **¿dónde estoy en el ranking? ¿qué partido sigue? ¿hay algo nuevo en el muro?**

**Layout:**
```
┌──────────────────────────────┐
│  [O2 logo]      🔔 (dot)     │  ← Top bar minimal
│                              │
│ Hola, Nahuel 👋              │  ← display.md
│                              │
│ ┌──────────┬──────────┐      │  ← StatCard × 2
│ │ TU POS.  │ TUS PTS  │      │
│ │   #8     │   124    │      │  ← Anton 40, primary y lime
│ │   ↑ 2    │   +12    │      │
│ └──────────┴──────────┘      │
│                              │
│ ┌──────────────────────────┐ │  ← NextMatchHero
│ │ PRÓXIMO PARTIDO          │ │
│ │                          │ │
│ │ 🇦🇷 Argentina  vs  Brasil 🇧🇷│
│ │                          │ │
│ │ Faltan 2h 14m            │ │
│ │ ┌──────────────────────┐ │ │
│ │ │     IR A MI PRODE    │ │ │
│ │ └──────────────────────┘ │ │
│ └──────────────────────────┘ │
│                              │
│ PROGRESO DEL TORNEO          │  ← label-uppercase
│ [● G —○ O —○ C —○ S —○ F ]   │  ← PhaseProgress
│                              │
│ ACTIVIDAD RECIENTE           │  ← label-uppercase
│ ┌──────────────────────────┐ │
│ │ [N] Lucas predijo 2-1    │ │  ← Post compacto
│ │     para Argentina       │ │
│ │     hace 10 min       →  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ [M] Martín ganó logro    │ │
│ │     "Constante"          │ │
│ │     hace 1h           →  │ │
│ └──────────────────────────┘ │
│                              │
│ [Bottom nav: Inicio activo]  │
└──────────────────────────────┘
```

**Componentes:** StatCard × 2, NextMatchHero, PhaseProgress, PostCard compacto × 2, BottomNav, ScreenHeader.

**Estados:**
- **Empty (sin actividad reciente):** "Todavía no hay actividad. Sé el primero en postear."
- **Loading (refresh):** skeleton de los bloques principales preservando layout.
- **Sin próximo partido (post-torneo):** sustituye NextMatchHero por card "Mirá tu resumen del Mundial" + CTA al share final.

**Interacciones:**
- Pull-to-refresh sutil (no animación dramática).
- StatCards no son clickeables (son info, no acción).
- PhaseProgress es navegable: tap en nodo → va al detalle de esa fase (si está unlocked).
- Cards de actividad → /muro/post/[id].
- Bell tap → /notificaciones.

**Notas implementación:**
- Server component para la base, con `Suspense` por bloque para hidratar progresivamente.
- Actividad reciente es polling cada 30s mientras la pantalla está visible.
- El "↑ 2" del delta se computa contra la semana anterior — el Agente 9 implementa.

---

## 7. Pantalla 06 — Group Stage Predictions ★

**Propósito:** Cargar/editar predicciones de los 12 grupos del Mundial 2026.

**Layout:**
```
┌──────────────────────────────┐
│ ←  MI PRODE                  │  ← ScreenHeader
│                              │
│ [FASE DE GRUPOS][ELIMINAT 🔒]│  ← Tabs primarios
│                              │
│ [A][B][C][D]...[L] →         │  ← Chips horizontales swipeables
│                              │     (12 grupos)
│ ┌──────────────────────────┐ │
│ │ 🇦🇷 Argentina    vs   🇯🇵 │ │  ← MatchCard
│ │                  Japón    │ │
│ │   [2]     —     [0]      │ │
│ │       ⏱ Faltan 2h 14m    │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🇧🇷 Brasil      vs   🇩🇪  │ │
│ │              Alemania     │ │
│ │   [1]     —     [1]      │ │
│ │      ⏱ Mañana 18:00      │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🇭🇷 Croacia    vs   🇲🇦   │ │
│ │            Marruecos      │ │
│ │   [2]     —     [1]      │ │
│ │     ✓ Cerrado            │ │
│ └──────────────────────────┘ │
│                              │
│ 4 de 6 cargados              │  ← Progress label discreto
│ ▰▰▰▰▱▱                       │  ← ProgressBar
│                              │
│ [Bottom nav: Prode activo]   │
└──────────────────────────────┘

╔══════ NUMPAD MODAL ══════╗
║  Cargá el resultado:      ║
║  Argentina vs Japón       ║
║                           ║
║       [2]   —   [0]       ║  ← ScoreInput resaltado
║                           ║
║  ┌─┬─┬─┐                  ║
║  │1│2│3│                  ║
║  ├─┼─┼─┤                  ║
║  │4│5│6│                  ║
║  ├─┼─┼─┤                  ║
║  │7│8│9│                  ║
║  ├─┼─┼─┤                  ║
║  │←│0│✓│                  ║
║  └─┴─┴─┘                  ║
╚═══════════════════════════╝
```

**Componentes:** Tabs (Fase de grupos / Eliminatorias), Chip group (A-L), MatchCard × 6, ScoreInput, Tag (estado), ProgressBar, BottomNav, Numpad modal.

**Estados:**
- **Default:** todos los partidos editables si no han cerrado.
- **Empty (grupo no cargado):** scores muestran "—".
- **Locked (kickoff < 1h):** ScoreInput.locked con candado + countdown debajo.
- **Settled (post-partido):** ScoreInput.correct o .wrong, badge con puntos ganados.
- **Eliminatorias bloqueadas:** tab "Eliminatorias" con candado, tap → muestra estado locked con countdown.

**Interacciones clave:**
- **Swipe horizontal en el body** → cambia de grupo (A → B → ... → L).
- **Tap en chip de grupo** → cambia + scroll-to-top con fade.
- **Tap en ScoreInput** → abre numpad modal bottom sheet con el partido contextualizado.
- **Auto-save:** 600ms después del último input change, side toast "Guardado ✓".
- **Auto-focus next:** tras cargar visitante, se cierra numpad y se posiciona en el siguiente partido (UX flow).
- **Long-press en MatchCard** → preview de cómo se está calculando ese resultado (futuro).

**Notas implementación:**
- Cada grupo es un route segment para deep-link share (`/prode/grupos/a`).
- Numpad es un compound component reutilizable (`ScoreInputDialog`).
- El indicador "4 de 6 cargados" se actualiza optimisticamente.
- Si el server rechaza un save (partido cerró mientras cargaba) → toast error + revertir.

---

## 8. Pantalla 07 — Knockout Stage

**Propósito:** Predicción de las 4 fases eliminatorias. Visualización tipo bracket.

**Layout (fase activa = Octavos):**
```
┌──────────────────────────────┐
│ ← ELIMINATORIAS              │
│                              │
│ ┌────────────────────────┐   │
│ │ OCTAVOS — Activo       │   │  ← Hero card con multiplicador x2
│ │ Multiplicador x2       │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ 🇦🇷 Argentina           │   │  ← Cruce 1
│ │     [2]  —  [0]        │   │
│ │ 🇲🇽 México              │   │
│ │ 30/06 · 14:00          │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ 🇧🇷 Brasil             │   │
│ │     [3]  —  [1]        │   │
│ │ 🇸🇳 Senegal             │   │
│ │ 30/06 · 17:00          │   │
│ └────────────────────────┘   │
│                              │
│ ... (6 cruces más)           │
│                              │
│ ┌────────────────────────┐   │
│ │ CUARTOS                │   │  ← LockedState
│ │ 🔒                     │   │
│ │ Disponible 04/07       │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ SEMIS · 🔒 09/07       │   │  ← Locked compacto
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ FINAL · 🔒 14/07       │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

**Componentes:** MatchCard (variante eliminatoria, sin tabs internos), LockedState compacto + expandido, Tag de multiplicador.

**Estados especiales:**
- Las fases bloqueadas se muestran como cards colapsadas con countdown.
- Al desbloquearse una fase → animación de unlock fullscreen (320ms) + push notif.

**Notas:** El bracket NO es horizontal (no entra en mobile). Es vertical, fase por fase. Si el usuario quiere ver el bracket completo, hay un toggle "Vista bracket" que muestra una visualización SVG ampliada con pinch-to-zoom.

---

## 9. Pantalla 08 — Ranking ★

**Propósito:** Competencia social. Mi posición SIEMPRE visible.

**Layout:**
```
┌──────────────────────────────┐
│ ←  RANKING                   │
│                              │
│ [GLOBAL][SEMANAL][POR FASE]  │  ← Tabs
│                              │
│        ┌───────┐             │  ← Podium
│        │ #1 👑 │             │
│   ┌────│ Martín│────┐        │
│   │ #2 │       │ #3 │        │
│   │ L. │ 156   │ N. │        │
│   │ 142│       │ 124│        │
│   └────┴───────┴────┘        │
│                              │
│ ─────────────────────────    │
│                              │
│ 4  [J] Julián          120   │  ← RankingRow
│ 5  [F] Facu            118   │
│ 6  [M] Mati            115   │
│ 7  [N] Nico            112   │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰        │  ← Mi fila destacada
│ 8  [N] Vos             124   │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰        │
│ 9  [P] Pablo           110   │
│ 10 [S] Sofi            108   │
│                              │
│ Ver ranking completo (32) ↓  │  ← CTA secundario
│                              │
│ [Bottom nav: Ranking activo] │
└──────────────────────────────┘

(Sticky bottom card si scroll fuera de mi fila:)
┌──────────────────────────────┐
│ ▰ 8  [N] Vos    124  · ↑2  ▰ │
└──────────────────────────────┘
```

**Componentes:** Tabs, PodiumCard, RankingRow × N, Sticky myPosition card.

**Estados:**
- **Mi puntaje = 0:** Mi fila aparece en gris ("Empezá a predecir para entrar al ranking").
- **Empate de puntos:** se desempata por: mayor cantidad de aciertos exactos → orden alfabético.

**Interacciones:**
- Tap en avatar de otro socio → /usuario/[id].
- Tap en mi fila → /perfil.
- **Scroll infinito con paginación virtualizada** (50 filas por chunk; padrón real ~800 socios). Lib recomendada: `react-virtual` o `@tanstack/virtual`.
- Si scrolleo y mi fila sale del fold → aparece sticky bottom con mi posición + CTA "Volver a mi posición".
- Search bar en header del ranking para buscar un socio por nombre (con 800 socios la búsqueda es necesaria).
- Delta de posición tiene flecha animada (↑ verde, ↓ rojo, = gris).

**Notas:** La animación del podio es secuencial (3 → 2 → 1) con bounce sutil. Solo al primer load por sesión.

---

## 10. Pantalla 09 — Social Wall ★

**Propósito:** Hub de comunidad. Posts + reacciones + comentarios.

**Layout:**
```
┌──────────────────────────────┐
│ MURO                         │  ← ScreenHeader
│                              │
│ [DESTACADOS][RECIENTES]      │  ← Tabs
│                              │
│ ┌──────────────────────────┐ │  ← PostCard
│ │ [L] Luciano · hace 20m   │ │
│ │                          │ │
│ │ Yo tengo a Argentina     │ │
│ │ campeón otra vez 🇦🇷🏆    │ │
│ │                          │ │
│ │ ♡ 24   💬 8   ↗ Comp.   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ [M] Martín · hace 1h     │ │
│ │                          │ │
│ │ Brasil llega a la final. │ │
│ │ No tengo dudas 🇧🇷       │ │
│ │                          │ │
│ │ [Card embed: Mi prode    │ │  ← Prode embed
│ │  Brasil 2-1 Final]       │ │
│ │                          │ │
│ │ ♡ 18   💬 5   ↗ Comp.   │ │
│ └──────────────────────────┘ │
│                              │
│ ... infinite scroll          │
│                              │
│            ┌──────────────┐  │  ← FAB
│            │ + COMPARTIR  │  │
│            │   MI PRODE   │  │
│            └──────────────┘  │
└──────────────────────────────┘
```

**Componentes:** Tabs, PostCard × N, FAB (Floating Action Button), Skeleton.

**Estados:**
- **Empty:** "El muro está vacío. Animate vos a postear primero." + CTA.
- **Sin conexión:** posts cached + banner "Sin conexión".
- **Optimistic posting:** mi nuevo post aparece arriba inmediatamente, en gris hasta confirmar.

**Interacciones:**
- Tap en corazón → reacción +1 con haptic + animación de corazón saliendo (1.4 → 1 con fade).
- Tap en comentario → /muro/post/[id] con focus en compose box.
- Tap en share → modal multi-canal del Agente 5.
- Long-press en post propio → menú "Borrar / Reportar".
- FAB siempre visible, pero se contrae a solo ícono al scrollear hacia abajo.

**Notas:** "Destacados" es algorítmico (top reacciones últimas 24h). "Recientes" es cronológico inverso. Polling 30s mientras está visible.

---

## 11. Pantalla 10 — Post Detail + Comments

**Layout:**
```
┌──────────────────────────────┐
│ ← [back]            ⋯ [menu] │
│                              │
│ ┌──────────────────────────┐ │
│ │ [L] Luciano · hace 20m   │ │
│ │                          │ │
│ │ Yo tengo a Argentina     │ │
│ │ campeón otra vez 🇦🇷🏆    │ │
│ │                          │ │
│ │ ♡ 24   💬 8   ↗ Comp.   │ │
│ └──────────────────────────┘ │
│                              │
│ COMENTARIOS (8)              │  ← label-uppercase
│                              │
│ [M] Martín · hace 15m        │
│ Estás re mufa, mejor cállate │
│ ♡ 3                          │
│                              │
│ [J] Julián · hace 12m        │
│ JAJAJA buena Lucho           │
│ ♡ 1                          │
│                              │
│ ...                          │
│                              │
│ ─────────────────────────    │
│ [Compose box]            ↗   │  ← Sticky bottom
└──────────────────────────────┘
```

**Notas:** Compose box sticky al teclado abierto. Sin threads anidados (regla UX-D9). Reacciones a comentarios sí, pero sin respuestas anidadas.

---

## 12. Pantalla 11 — User Profile (propio)

**Layout:**
```
┌──────────────────────────────┐
│           ⚙ [settings]       │
│                              │
│ ┌──────────────────────────┐ │
│ │       [Avatar XL]        │ │  ← Avatar 96 + level badge
│ │                          │ │
│ │       Nahuel             │ │  ← heading.lg
│ │       Socio O2 · Pro     │ │  ← label muted + nivel
│ └──────────────────────────┘ │
│                              │
│ ┌────────┬────────┬────────┐ │  ← 3 StatCards
│ │ POS    │ PTS    │ PRODE  │ │
│ │ #8     │ 124    │ 85%    │ │
│ └────────┴────────┴────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Mis predicciones      →  │ │  ← Lista de navegación
│ │ Historial             →  │ │
│ │ Logros        [Nuevo] →  │ │  ← Con badge "Nuevo"
│ │ Configuración         →  │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │   COMPARTIR MI PRODE     │ │  ← Button primary
│ └──────────────────────────┘ │
│                              │
│ [Bottom nav: Perfil activo]  │
└──────────────────────────────┘
```

**Componentes:** Avatar XL + level, StatCard × 3, NavRow × 4, Button primary.

**Notas:** El "Nuevo" badge en Logros aparece cuando hay achievements desbloqueados que el usuario aún no vio.

---

## 13. Pantalla 12 — Otro usuario (perfil público)

**Layout:** Similar al propio, pero sin "Configuración". Header muestra "Seguir" o "Mensaje" (futuro post-MVP). El share del prode propio se sustituye por "Ver su prode".

**Notas privacidad:** Por default todos los socios son visibles entre sí (es un círculo cerrado). Settings permite ocultar predicciones individuales pero no la posición en el ranking.

---

## 14. Pantalla 13 — Share Result Screen ★★★

**Propósito:** EL feature de máxima inversión. Cada share es un anuncio orgánico de O2.

**Layout:**
```
┌──────────────────────────────┐
│ ←  COMPARTÍ TU PRODE      ✕  │  ← Header con close
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │  [TEMPLATE 1 PREVIEW]    │ │  ← Card 1080×1920 escalada
│ │                          │ │
│ │  MI PRODE                │ │
│ │  MUNDIAL 2026   O2       │ │
│ │                          │ │
│ │  CAMPEÓN                 │ │
│ │  ARGENTINA 🇦🇷           │ │
│ │                          │ │
│ │  GOLEADOR                │ │
│ │  MBAPPÉ  🇫🇷             │ │
│ │                          │ │
│ │  RESULTADO FINAL         │ │
│ │  ARGENTINA 2-1 BRASIL    │ │
│ │                          │ │
│ │  PUNTOS  POSICIÓN        │ │
│ │  124     #8              │ │
│ │                          │ │
│ │  #PRODEMUNDIALO2         │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│ ● ● ○ ○                      │  ← Templates pagination
│                              │
│ ┌────┬────┬────┬────┐        │
│ │ ⬇  │ IG │ WA │ ↗  │        │  ← 4 CTAs equidistantes
│ │Down│ IG │ WA │Sh. │        │
│ └────┴────┴────┴────┘        │
└──────────────────────────────┘
```

**Componentes:** ShareCard (variants), Pagination, IconButton × 4, ScreenHeader.

**Variants de template (Agente 5 detalla):**
1. **Resumen general** — campeón + goleador + final + mis pts.
2. **Mi ranking actual** — podio + mi posición destacada.
3. **Predicción de un partido** — solo el partido + score predicho.
4. **Logro desbloqueado** — el logro como hero card.

**Interacciones:**
- Swipe horizontal entre templates.
- Tap [⬇] → descarga PNG nativo.
- Tap [IG] → abre Instagram con imagen en clipboard (PWA) o intent (PWA TWA).
- Tap [WA] → `wa.me/?text=...` con imagen pre-cargada.
- Tap [↗] → Web Share API nativa (fallback a copy link).

**Notas:**
- La imagen se genera **server-side** vía edge function que renderiza a canvas (resolución 1080×1920 para Stories, 1080×1080 para feed).
- La marca O2 aparece SUTIL (esquina inferior izquierda, con opacity 0.85).
- El hashtag tiene tipografía estática para asegurar reconocimiento de marca.

---

## 15. Pantalla 14 — Notifications Center

**Layout:**
```
┌──────────────────────────────┐
│ ← NOTIFICACIONES   Marcar ✓  │
│                              │
│ HOY                          │  ← label-uppercase
│                              │
│ ● ┌──────────────────────────┐│
│   │ 🏆 Sumaste 5 pts en      ││  ← Bullet primary = no leída
│   │ Argentina vs Japón.      ││
│   │ Subiste 2 posiciones.    ││
│   │ hace 10 min          →   ││
│   └──────────────────────────┘│
│                              │
│   ┌──────────────────────────┐│
│   │ 💬 Martín comentó tu     ││
│   │ post                     ││
│   │ hace 1h              →   ││
│   └──────────────────────────┘│
│                              │
│ AYER                         │
│                              │
│   ┌──────────────────────────┐│
│   │ ⏰ Argentina vs Japón     ││
│   │ en 2h. ¿Listo tu prode?  ││
│   │ ayer 19:00           →   ││
│   └──────────────────────────┘│
└──────────────────────────────┘
```

**Notas:** Tap en notificación → deep-link al recurso. "Marcar todas como leídas" arriba a la derecha. Notificaciones expiran a 30 días.

---

## 16. Pantalla 15 — Settings

**Layout:**
```
┌──────────────────────────────┐
│ ←  CONFIGURACIÓN             │
│                              │
│ CUENTA                       │
│ ┌──────────────────────────┐ │
│ │ Email                  → │ │
│ │ Cambiar contraseña     → │ │
│ │ Foto de perfil         → │ │
│ └──────────────────────────┘ │
│                              │
│ NOTIFICACIONES               │
│ ┌──────────────────────────┐ │
│ │ Próximos partidos      ● │ │  ← Switch
│ │ Resultados             ● │ │
│ │ Social (likes, com.)   ○ │ │
│ │ Resumen semanal        ● │ │
│ └──────────────────────────┘ │
│                              │
│ PRIVACIDAD                   │
│ ┌──────────────────────────┐ │
│ │ Mis predicciones       ● │ │  ← Toggle visibilidad
│ │ visibles a socios        │ │
│ └──────────────────────────┘ │
│                              │
│ APP                          │
│ ┌──────────────────────────┐ │
│ │ Términos y condiciones → │ │
│ │ Política de privacidad → │ │
│ │ Versión 1.0.0            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │      CERRAR SESIÓN       │ │  ← Button danger
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## 17. Estados globales (definidos una vez, reutilizados en todas las pantallas)

### Loading State (skeleton patterns)

| Vista | Skeleton |
|---|---|
| Home | StatCards skeleton + NextMatchHero skeleton + 2 PostCards skeleton |
| Group Stage | 6 MatchCard skeletons |
| Ranking | Podium skeleton + 8 RankingRow skeletons (luego paginación de 50 en 50 sobre ~800 socios) |
| Wall | 4 PostCard skeletons grandes |
| Profile | Avatar skeleton + StatCards + lista |

Tiempo objetivo de hidratación: < 500ms en buena red.

### Empty States

| Contexto | Copy | CTA |
|---|---|---|
| Sin predicciones | "Todavía no cargaste predicciones. Empezá por el Grupo A." | "IR A MI PRODE" |
| Muro vacío | "El muro está vacío. Animate vos a postear primero." | "+ COMPARTIR" |
| Sin notificaciones | "Sin novedades por ahora." | — |
| Sin actividad reciente | "Cuando los socios empiecen a postear, vas a ver su actividad acá." | — |
| Logros bloqueados (vista) | "Tus logros van apareciendo a medida que jugás." | — |

### Locked States

Card centrada con candado + countdown DD:HH:MM:SS. Variantes:
- **Octavos:** "Disponible el 30 de junio"
- **Cuartos:** "Disponible el 4 de julio"
- **Semis:** "Disponible el 9 de julio"
- **Final:** "Disponible el 14 de julio"

### Error States

| Tipo | Visual | Copy | CTA |
|---|---|---|---|
| Red / offline | Banner top warning | "Sin conexión. Tus cambios se sincronizan al reconectar." | "Reintentar" |
| Negocio (partido cerrado) | Toast error | "Este partido ya cerró. No podés modificar el score." | "Entendido" |
| 500 server | Full-screen | "Algo se rompió de nuestro lado. Estamos en eso." | "Reintentar" |
| 404 | Full-screen | "No encontramos lo que buscás." | "Volver a Home" |
| Sin permisos / no socio | Full-screen | "Esta sección es solo para socios activos." | "Contactar al gym" |

---

## 18. Comportamiento responsive

### Mobile (default, 360–767px)
- Container full width, padding lateral 24px.
- Bottom nav fijo abajo.
- Headers stick al top en scroll.

### Tablet (768–1023px)
- Container max-width 480px centrado (NO se ensancha el content).
- El espacio sobrante a los lados muestra un fondo sutil con foto cinematográfica desenfocada.
- Bottom nav sigue mostrándose (es PWA mobile-first).

### Desktop (1024px+)
- Mismo comportamiento que tablet.
- Decisión deliberada: NO hay versión desktop "ampliada". El producto vive en mobile. Quien lo abra en desktop ve la versión mobile centrada. Esto se comunica al final del onboarding ("Mejor experiencia en celular").

> Nota: Si una futura iteración pide desktop "nativo" (dashboard widescreen para el equipo del gym), se diseña aparte; no es responsive del mobile.

---

## 19. Accesibilidad (resumen — Agente 12 audita)

- Todo texto ≥ ratio 4.5:1 (verificado en Agente 3).
- Tap targets ≥ 44×44 (verificado en specs).
- Navegación por teclado funcional en toda pantalla (focus-visible activo).
- ARIA labels obligatorios en IconButton, FAB y elementos solo-ícono.
- Skip-link al main content.
- Soporte `prefers-reduced-motion`: animaciones de unlock, podium y celebración se reducen a fade.
- Idioma `lang="es-AR"` en `<html>`.

---

## 20. Decisiones que cierra este documento

| # | Decisión | Implicancia |
|---|---|---|
| UI-D1 | Container max-width 480px en todos los breakpoints | Sin diseño desktop separado en MVP |
| UI-D2 | Numpad propio, no teclado del SO en ScoreInput | Agente 7 implementa `ScoreInputDialog` compound |
| UI-D3 | Bracket de eliminatorias = vertical fase-por-fase + toggle a SVG horizontal | Agente 7 prepara dos vistas |
| UI-D4 | Podium con animación secuencial (3 → 2 → 1) | Agente 6 detalla variants |
| UI-D5 | FAB de "Compartir mi prode" en Muro, no en Home | Acción social, no acción de juego |
| UI-D6 | Sin threads anidados en comentarios | Reduce complejidad de Agente 10 |
| UI-D7 | Share screen genera imagen server-side, no client | Agente 7 expone `/api/share/[type]/[userId]` |
| UI-D8 | Onboarding skipeable en todas sus pantallas | Bajar fricción; banner persistente si se skipea |
| UI-D9 | **Match cards knockout usan abreviación FIFA de 3 letras** (ARG, MEX, BRA, SEN…) en lugar del nombre completo del país | Resuelve overflow en cards horizontales. Layout: bandera arriba + abreviación abajo. Nombre completo se mantiene en fase de grupos y share card. Tabla en `i18n.teamCodes`. |
| UI-D10 | **Cero ilustraciones decorativas complejas** (trofeo, sol de mayo) en mocks del MVP. Tipografía editorial hace el trabajo cinematográfico | Decisión post-review: las SVGs complejas renderizan pobres a tamaños chicos. Se mantienen en `icons.svg` por si se rescatan con foto real de fondo en iteración futura. |
| UI-D11 | **Imagen opcional en posts del muro** (1 por post, max 5MB) | Compose box agrega botón "Adjuntar imagen". 2 casos: screenshot del prode + foto del cliente para premios. |

---

## 21. Próximo paso

**Agente 5 — Viral Share Designer** recibe esta pantalla 13 como input principal y produce:
- 4 templates finales en SVG (1080×1920 + 1080×1080)
- Lógica de generación dinámica
- Variantes de marca (con/sin foto, con/sin podio)
- Specs para el endpoint que renderiza canvas server-side

---

*Fin Agente 4 — Listo para checkpoint del usuario.*
