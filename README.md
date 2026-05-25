# O2 PRODE

App web mobile-first para que los socios del gimnasio **O2** compitan prediciendo
los partidos del **Mundial 2026**. Asset de marca + retención de socios + viralidad orgánica.

> **Estado:** Sprints 0–7 completos. Próximo: Sprint 8 (beta cerrada con socios reales).
> Ver [`docs/SPRINT_8_BETA.md`](docs/SPRINT_8_BETA.md) y [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md).

---

## Quick start

```bash
pnpm install
cp .env.example .env.local
# editar .env.local con credenciales de Supabase
pnpm dev
```

App corre en `http://localhost:3000`.

---

## Stack

- **Next.js 15** App Router + **TypeScript** strict (`noUncheckedIndexedAccess`)
- **Tailwind CSS** con design tokens propios
- **React 18** + **Framer Motion 11**
- **Supabase** — auth + DB + Realtime + Storage
- **@vercel/og** — share PNG server-side
- **Zod** — validación de input en server actions
- **Vitest** unit + **Playwright** e2e
- **Biome** lint + format
- **pnpm** package manager

---

## Comandos

```bash
pnpm dev              # Dev server con Turbopack
pnpm build            # Production build
pnpm start            # Run production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # Biome lint
pnpm format           # Biome format
pnpm test             # Vitest (unit + component)
pnpm test:e2e         # Playwright (requiere dev server corriendo)
pnpm supabase:types   # Regenera types/database.ts desde la DB
```

---

## Estructura del repo

```
app/                  Next.js App Router
  (auth)/             Login, register, onboarding
  (app)/              Home, Prode, Ranking, Muro, Perfil
  api/                Edge handlers (share, predictions, reactions)
components/
  ui/                 Primitivas (Button, Avatar, ScoreInput, Icon, Flag…)
  features/           Compuestos (MatchCard, RankingRow, PostCard, BottomNav…)
  share/              Templates de share card (Satori JSX)
lib/
  supabase/           Clients (browser, server, middleware)
  scoring/            Engine de puntos
  ranking/            Cómputo de ranking
  achievements/       Catálogo + triggers + niveles
  social/             Queries, actions, realtime del muro
  share/              Pipeline server-side de share PNG
  motion/             Variants Framer
  a11y/               Helpers de accesibilidad
  i18n/               es-AR.json (source of truth de copy)
types/
  domain.ts           Tipos de dominio (escritos a mano)
  database.ts         Auto-generado de Supabase
data/
  seed/               Datos del Mundial 2026
  mocks/              Mocks de dev
public/               Assets servidos (íconos, sprite, manifest, sw.js)
supabase/
  schema.sql          DDL completo con RLS, triggers, views
scripts/              Scripts de DB y mantenimiento
design/               Mockups HTML + sprite SVG fuente + tokens.json
docs/                 Documentación arquitectónica (01-15 + extras)
_internal/            Material histórico (presentaciones, conceptos visuales)
```

> **Nota:** `_internal/` queda fuera del build y no se sirve. Es archivo histórico
> del proceso de desarrollo. Ver [`_internal/README.md`](_internal/README.md).

---

## Documentación

| Tema | Doc |
|---|---|
| Estrategia de producto, KPIs, personas | [`docs/01_product_strategy.md`](docs/01_product_strategy.md) |
| Sitemap, flows, scoring, notificaciones | [`docs/02_ux_architecture.md`](docs/02_ux_architecture.md) |
| Design tokens, tipografía, componentes | [`docs/03_design_system.md`](docs/03_design_system.md) |
| Specs por pantalla + estados | [`docs/04_ui_designs.md`](docs/04_ui_designs.md) |
| Pipeline share PNG + 4 templates | [`docs/05_viral_share.md`](docs/05_viral_share.md) |
| Catálogo de animaciones Framer | [`docs/06_motion.md`](docs/06_motion.md) |
| Arquitectura Next.js + auth | [`docs/07_nextjs_architecture.md`](docs/07_nextjs_architecture.md) |
| Modelo de datos + RLS | [`docs/08_data_model.md`](docs/08_data_model.md) |
| Lógica del juego (scoring) | [`docs/09_game_logic.md`](docs/09_game_logic.md) |
| Muro social + realtime | [`docs/10_social_feed.md`](docs/10_social_feed.md) |
| Gamificación + niveles | [`docs/11_gamification.md`](docs/11_gamification.md) |
| Auditoría WCAG | [`docs/12_a11y_report.md`](docs/12_a11y_report.md) |
| Voz, tono, copy | [`docs/13_ux_copy.md`](docs/13_ux_copy.md) |
| Plan de testing + performance | [`docs/14_qa_performance.md`](docs/14_qa_performance.md) |
| Sign-off final del diseño | [`docs/15_final_checkpoint.md`](docs/15_final_checkpoint.md) |
| **Checklist pre-deploy** | [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md) |
| **Sprint 8 (beta cerrada)** | [`docs/SPRINT_8_BETA.md`](docs/SPRINT_8_BETA.md) |

Diseño visual interactivo en [`design/`](design/):
- `preview.html` — design system completo navegable
- `icons-system.html` — sprite de iconografía custom
- `share-argentina-cinematic.html` — share card hero
- `screens.html` — mockup de 9 pantallas
- `motion-preview.html` — demos de animaciones

---

## Reglas innegociables

- **Cero emojis Unicode.** Iconografía custom desde `public/design/icons.svg`.
- **Branding: solo "O2".** Sin referencias a "C2" en ningún lado.
- **es-AR rioplatense.** Voseo siempre. Todo copy en `lib/i18n/es-AR.json`.
- **Mobile-first PWA.** Container max-width 480px en todos los breakpoints.
- **Solo dark mode** en MVP.
- **Auth invite-only.** Padrón cerrado de socios O2.
- **Sin dinero ni apuestas.** Premios simbólicos definidos por marca aliada.
- **WCAG 2.1 AA** mínimo en release.

Ver [`CLAUDE.md`](CLAUDE.md) para la constitución completa del repo.

---

## Deploy

Plataforma: **Vercel** (Next.js detectado automático).

Pasos resumidos:

1. Push del repo a GitHub.
2. Importar el repo en Vercel → New Project.
3. Configurar variables de entorno (ver `.env.example` y [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md)).
4. Actualizar **Site URL** y **Redirect URLs** en Supabase con el dominio de Vercel.
5. Insertar invite codes manuales para los primeros 5–10 beta testers.

Checklist completo y comandos en [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md).

---

## Branding

El gimnasio se llama **O2**.
- Socios: **Socio O2**
- Nivel top de gamificación: **Leyenda O2**
- Hashtag de viralidad: **#PRODEMUNDIALO2**

---

*Mundial 2026. Inicio 11/06/2026. Release objetivo: 04/06/2026.*
