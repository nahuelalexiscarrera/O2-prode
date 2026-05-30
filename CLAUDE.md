# O2 PRODE — Repo Constitution

**Propósito:** Este archivo orienta a Claude Code (y a cualquier desarrollador que se sume) sobre el proyecto. Es la "constitución" del repo: reglas duras, decisiones ya cerradas, dónde está cada cosa. **Si una decisión está acá, no se re-discute** — se lee, se respeta.

---

## 1. Qué es esto

**O2 PRODE.** App web mobile-first para que los ~800 socios del gimnasio **O2** compitan prediciendo los partidos del **Mundial 2026**. No es betting, no es fantasy genérico. Es un asset de marca del club + retención de socios + viralidad orgánica.

Estado actual: **diseño y arquitectura cerrados. Scaffold de Next.js ejecutable. Falta el desarrollo de pantallas + features.**

---

## 2. Stack (confirmado, no cambiar sin razón)

- **Next.js 15** (App Router) + **TypeScript strict** (`noUncheckedIndexedAccess`)
- **Tailwind CSS** con tokens propios del DS
- **React 18** + **Framer Motion 11**
- **Supabase** (auth + DB + Realtime + Storage)
- **@vercel/og** para share PNG server-side
- **Zod** para validación
- **Vitest** unit + **Playwright** e2e
- **Biome** lint + format
- **pnpm** package manager

---

## 3. Reglas innegociables

Estas son **hard rules**. No se ignoran.

1. **Cero emojis Unicode** en el producto (🇦🇷🏆🔒💬 etc). Iconografía 100% custom desde `design/icons.svg`. Si un componente necesita un símbolo visual, se usa `<Icon name="..."/>` desde el sprite. Banderas también — son SVG inline, no emoji.

2. **Branding: solo "O2"**. C2 aparecía en mockups originales como placeholder; está descartado. Socios = "Socio O2". Hashtag = `#PRODEMUNDIALO2`. Nivel top = "Leyenda O2".

3. **Idioma único: español rioplatense (es-AR)**. Voseo siempre (`cargá`, `tenés`, `podés`). Todo copy vive en `lib/i18n/es-AR.json`. Sin i18n routing.

4. **Mobile-first PWA.** Container max-width 480px en todos los breakpoints. No hay versión desktop nativa separada.

5. **Solo dark mode** en MVP. Sin tema claro.

6. **Match cards de knockout: abreviación FIFA 3 letras** (ARG, MEX, BRA, SEN...). Tabla en `lib/i18n/es-AR.json` bajo `teamCodes`. Nombre completo solo en fase de grupos y share card.

7. **Sin ilustraciones decorativas complejas** en mockups (trofeo, sol de mayo). Renderizan pobres. Tipografía editorial hace el trabajo cinematográfico.

8. **Auth: registro abierto** (email + teléfono opcional). El flujo *invite-only* original se removió en **Sprint 8** (decisión de Nahuel, 2026-05-29) para construir una base de socios usable. La tabla `invite_code`, sus scripts y `validateInviteAction` se **conservan** por si se reactiva el padrón cerrado — solo se sacó del flujo de registro.

9. **Sin dinero, sin apuestas**. Premios simbólicos definidos por marca aliada. Cero referencias a "apostar", "ganar plata", "casino". Glosario en `docs/13_ux_copy.md` §2.

10. **WCAG 2.1 AA** mínimo. Los 3 críticos del Agente 12 deben parchearse antes de release (ver `docs/12_a11y_report.md` §5).

---

## 4. Convenciones de código

### Estructura general
- **Server Components por default.** Solo `"use client"` cuando hace falta estado, eventos del browser o hooks.
- **Aliases TS:** `@/components/*`, `@/lib/*`, `@/types/*`, `@/data/*`. No usar rutas relativas largas.
- **Files:** `kebab-case.tsx` para rutas, `PascalCase.tsx` para componentes.
- **Variables:** `camelCase`. Const exportadas en `UPPER_SNAKE_CASE`.
- **Routes:** español (`/prode`, `/muro`, `/perfil`). API routes en inglés (`/api/share`, `/api/predictions`).

### Componentes
- Primitivas en `components/ui/`. Compuestos (features) en `components/features/`.
- Cada primitiva acepta `className` para overrides; usa `cn()` de `@/lib/utils/cn` para combinar.
- `Icon` es el wrapper canónico del sprite. NO usar `lucide-react` ni emojis.

### Motion
- Toda animación importa variants desde `@/lib/motion/variants`. Cero `motion.div` con animaciones inline custom.
- Solo animar `transform` y `opacity`. NUNCA `width/height/top/left`.
- Respetar `prefers-reduced-motion` (Framer Motion lo hace automático si usás `useReducedMotion`).

### Data
- Server queries en `lib/<domain>/queries.ts`.
- Server actions en `lib/<domain>/actions.ts` con validación Zod obligatoria.
- Realtime hooks en `lib/<domain>/realtime.ts` (client-only).
- Types del dominio en `types/domain.ts` (escritos a mano, source of truth).
- Types de la DB en `types/database.ts` (auto-generados con `pnpm supabase:types`).

### Scoring (no tocar sin tests)
- `lib/scoring/` tiene paridad obligatoria con `fn_calculate_points` de Postgres.
- Cualquier cambio a reglas pasa por: editar `rules.ts` → actualizar SQL → correr tests → verificar paridad.

---

## 5. Mapa de carpetas

```
app/                    Next.js App Router
  (auth)/               Login, register, onboarding (sin BottomNav)
  (app)/                Home, Prode, Ranking, Muro, Perfil (con BottomNav, auth required)
  api/                  Edge handlers (share, predictions, reactions)
components/
  ui/                   Primitivas (Button, Avatar, ScoreInput, Icon, Flag, etc.)
  features/             Compuestos (MatchCard, RankingRow, PostCard, BottomNav, etc.)
  share/                Templates de share card (T01-T04, Satori JSX)
lib/
  supabase/             Clients (browser, server, middleware)
  scoring/              Engine de puntos + tests
  ranking/              Cómputo de ranking
  achievements/         Catálogo + triggers + actions + niveles
  social/               Queries, actions, realtime, helpers de feed
  share/                Templates types + spec
  motion/               Variants Framer
  a11y/                 Helpers (focus trap, contrast, etc.)
  i18n/                 es-AR.json (~400 strings, source of truth de copy)
  utils/                cn, date, format
  qa/                   copy-check.ts
types/
  domain.ts             Dominio limpio (escrito a mano)
  database.ts           Auto-generado de Supabase
data/
  seed/                 Mundial 2026: teams, groups, schedule
  mocks/                Dev: users, posts, achievements
design/                 Assets visuales (sprite SVG, mockups HTML, tokens.json)
docs/                   16 documentos de arquitectura (01-15 + extras)
supabase/
  schema.sql            DDL completo con RLS, triggers, views
```

---

## 6. Documentación viva — dónde mirar qué

| Pregunta | Archivo |
|---|---|
| Por qué este producto existe / personas / KPIs | `docs/01_product_strategy.md` |
| Sitemap, user flows, scoring formal, notificaciones | `docs/02_ux_architecture.md` |
| Design tokens, tipografía, espaciado, componentes | `docs/03_design_system.md` |
| Specs detalladas de cada pantalla + estados | `docs/04_ui_designs.md` |
| Pipeline server-side de share PNG + 4 templates | `docs/05_viral_share.md` |
| Catálogo de animaciones + variants Framer | `docs/06_motion.md` |
| Estructura Next.js + auth flow + decisiones técnicas | `docs/07_nextjs_architecture.md` |
| Modelo de datos + RLS + views + escala | `docs/08_data_model.md` |
| Cómo se calculan los puntos (con ejemplos) | `docs/09_game_logic.md` |
| Muro: queries, optimistic UI, realtime, image upload | `docs/10_social_feed.md` |
| Sistema de logros + niveles | `docs/11_gamification.md` |
| Auditoría WCAG con 15 findings | `docs/12_a11y_report.md` |
| Voz, tono, glosario de palabras canónicas | `docs/13_ux_copy.md` |
| Plan de testing + performance budget | `docs/14_qa_performance.md` |
| Review final + sign-off del diseño | `docs/15_final_checkpoint.md` |
| Checklist pre-release | `docs/DEPLOY_CHECKLIST.md` |

---

## 7. Comandos comunes

```bash
# Setup inicial (una vez)
pnpm install
cp .env.example .env.local              # editar con credenciales reales
supabase start                           # local dev DB

# Desarrollo
pnpm dev                                 # Next.js + Turbopack en localhost:3000
pnpm typecheck                           # tsc --noEmit
pnpm lint                                # Biome
pnpm format                              # Biome format

# Tests
pnpm test                                # Vitest unit + component
pnpm test:e2e                            # Playwright (necesita server corriendo)

# DB
pnpm supabase:types                      # regenera types/database.ts desde DB
supabase migration new <nombre>          # nueva migration
supabase db push                         # aplica migrations
```

---

## 8. Sprints — estado y roadmap

Detalle completo en `docs/15_final_checkpoint.md` §8. Resumen:

| Sprint | Qué incluye | Estado |
|---|---|---|
| 0 | Setup, Supabase project, aplicar schema | Pendiente |
| 1 | Primitivas UI faltantes (Avatar, Badge, ScoreInput, Input, Tabs, Modal, Toast, etc.) | Pendiente |
| 2 | Home + Group Stage funcionales contra DB | Pendiente |
| 3 | Knockout + Ranking + Settings | Pendiente |
| 4 | Muro social + reactions + comments + image upload | Pendiente |
| 5 | Share endpoint + 4 templates renderizando | Pendiente |
| 6 | Gamificación + push notifications + cron jobs | Pendiente |
| 7 | Hardening: a11y fixes (3 críticos), perf, stress test | Pendiente |
| 8 | Beta cerrada con socios reales, ajustes | Pendiente |

**Objetivo de release:** semana del 4/06/2026 para llegar al 11/06 (inicio Mundial).

---

## 9. Próximos pasos inmediatos (Sprint 0)

1. `pnpm install` en la carpeta del proyecto.
2. Crear proyecto en Supabase + obtener credenciales.
3. Aplicar `supabase/schema.sql` a la DB (vía CLI o dashboard).
4. Llenar `.env.local` con las credenciales.
5. `pnpm dev` → verificar que la app levanta en `localhost:3000`.
6. `pnpm supabase:types` → regenerar tipos de la DB.
7. Seed inicial de `tournament`, `team`, `group`, `match` con los datos del Mundial 2026 cuando FIFA confirme el sorteo (mientras tanto, usar placeholders de `data/seed/`).
8. Empezar Sprint 1: completar primitivas UI faltantes siguiendo specs de `docs/04_ui_designs.md` y el design system (`docs/03_design_system.md`).

---

## 10. Lo que NO hay que hacer

- ❌ Agregar emojis Unicode al producto (ni en copy, ni como íconos).
- ❌ Instalar `lucide-react` ni ninguna librería de íconos. El sprite custom es el único.
- ❌ Cambiar las reglas de scoring sin actualizar tests + SQL en paralelo.
- ❌ Editar copy directo en componentes. Todo copy vive en `lib/i18n/es-AR.json`.
- ❌ Animar propiedades de layout (`width`, `height`, `top`, `left`, `margin`). Solo `transform` y `opacity`.
- ❌ Saltarse Zod en server actions. Toda mutation valida input antes de tocar DB.
- ❌ Usar OFFSET en queries paginadas profundas (ranking 800 socios). Usar cursor por `created_at` o `position`.
- ❌ Crear nuevos modales que no implementen focus trap + Escape close + return focus.
- ❌ Hardcodear nombres del país en componentes. Importar de `i18n.teamCodes` o `data/seed/teams.json`.
- ❌ Postergar tests del scoring engine. Es el corazón de la confianza del usuario.
- ❌ Mencionar "C2" en ningún lado. La marca es **O2**.

---

## 11. Cuando dudes

- **Dónde mirar primero:** el doc de la sección correspondiente en `docs/`. Las decisiones ya están tomadas, solo hay que ejecutarlas.
- **Si encontrás contradicciones entre docs:** ganan los docs más recientes y la memoria del proyecto. Avisame antes de cambiar nada.
- **Si tenés que tomar una decisión de producto nueva:** consultar a Nahuel. Las decisiones técnicas dentro de las reglas de este archivo se pueden tomar sin consultar.

---

*Mantenimiento: este archivo se actualiza cuando se cierran nuevas decisiones de scope o convención. No se actualiza por features individuales — eso va en commits y PRs.*
