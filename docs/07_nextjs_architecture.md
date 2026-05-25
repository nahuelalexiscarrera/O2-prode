# O2 PRODE — Next.js Architecture

**Agente 7 · Next.js Architect**
Versión 1.0 · 2026-05-18
Inputs: todos los agentes 1-6
Outputs:
- `docs/07_nextjs_architecture.md` (este documento)
- `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`
- `app/layout.tsx`, `app/page.tsx`, layouts de route groups
- `middleware.ts` (auth gate)
- Componentes base seleccionados

---

## 1. Stack confirmado

| Capa | Tecnología | Versión target |
|---|---|---|
| Framework | **Next.js** (App Router) | 15.x |
| Lenguaje | **TypeScript** strict | 5.5+ |
| Estilos | **Tailwind CSS** | 3.4+ |
| UI runtime | **React** | 18.3+ |
| Animación | **Framer Motion** | 11+ |
| Auth + DB | **Supabase** | js-v2 |
| Validación | **Zod** | 3+ |
| Edge image rendering | **@vercel/og** | 0.6+ |
| Linter | **Biome** o ESLint flat config | latest |
| Package manager | **pnpm** | 9+ |

---

## 2. Estructura de carpetas

```
pro 02/
├── app/
│   ├── (auth)/                      # Route group sin auth requerido
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot/page.tsx
│   │   └── onboarding/
│   │       └── [step]/page.tsx
│   ├── (app)/                       # Route group con auth requerido
│   │   ├── layout.tsx               # Bottom nav + auth check
│   │   ├── page.tsx                 # Home
│   │   ├── prode/
│   │   │   ├── layout.tsx
│   │   │   ├── grupos/[grupo]/page.tsx
│   │   │   ├── eliminatorias/page.tsx
│   │   │   └── predicciones/page.tsx
│   │   ├── ranking/
│   │   │   ├── page.tsx
│   │   │   ├── semanal/page.tsx
│   │   │   └── fase/page.tsx
│   │   ├── muro/
│   │   │   ├── page.tsx
│   │   │   ├── post/[id]/page.tsx
│   │   │   └── componer/page.tsx
│   │   ├── perfil/
│   │   │   ├── page.tsx
│   │   │   ├── mis-predicciones/page.tsx
│   │   │   ├── historial/page.tsx
│   │   │   ├── logros/page.tsx
│   │   │   └── configuracion/page.tsx
│   │   ├── usuario/[id]/page.tsx
│   │   ├── partido/[id]/page.tsx
│   │   ├── compartir/[type]/page.tsx
│   │   └── notificaciones/page.tsx
│   ├── api/
│   │   ├── share/[template]/[userId]/route.ts   # @vercel/og endpoint
│   │   ├── predictions/route.ts                  # POST/PATCH predicciones
│   │   ├── reactions/route.ts                    # Heart, comment
│   │   └── webhook/                              # Supabase realtime hooks
│   ├── splash/page.tsx              # Splash inicial
│   ├── layout.tsx                   # Root layout (fonts + providers)
│   ├── page.tsx                     # Redirect a /splash o /app
│   ├── error.tsx                    # Global error boundary
│   ├── not-found.tsx                # 404
│   └── styles/
│       └── globals.css              # Del Agente 3
│
├── components/
│   ├── ui/                          # Primitivas del DS (Agente 3 §9)
│   │   ├── Button.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Chip.tsx
│   │   ├── Input.tsx
│   │   ├── ScoreInput.tsx
│   │   ├── Switch.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Tag.tsx
│   │   ├── Flag.tsx                 # <use href="#flag-XX"/>
│   │   ├── Icon.tsx                 # <use href="icons.svg#..."/>
│   │   ├── ProgressBar.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── features/                    # Compuestos del DS (Agente 3 §10)
│   │   ├── MatchCard.tsx
│   │   ├── RankingRow.tsx
│   │   ├── PodiumCard.tsx
│   │   ├── PostCard.tsx
│   │   ├── StatCard.tsx
│   │   ├── NextMatchHero.tsx
│   │   ├── PhaseProgress.tsx
│   │   ├── AchievementCard.tsx
│   │   ├── BottomNav.tsx
│   │   └── ScreenHeader.tsx
│   ├── share/                       # Templates de share (Agente 5)
│   │   ├── templates/
│   │   │   ├── T01_Summary.tsx
│   │   │   ├── T02_Position.tsx
│   │   │   ├── T03_Match.tsx
│   │   │   └── T04_Achievement.tsx
│   │   └── ShareModal.tsx
│   └── providers/
│       ├── ThemeProvider.tsx        # CSS vars (placeholder for futuro)
│       ├── ToastProvider.tsx
│       └── SupabaseProvider.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client
│   │   └── middleware.ts            # Edge middleware client
│   ├── share/
│   │   ├── templates.ts             # Del Agente 5
│   │   ├── spec.json                # Del Agente 5
│   │   ├── dataFetchers.ts          # Queries para share render
│   │   └── render.ts                # Orquestador
│   ├── motion/
│   │   └── variants.ts              # Del Agente 6
│   ├── scoring/                     # Agente 9
│   │   ├── calculator.ts
│   │   ├── rules.ts
│   │   └── multipliers.ts
│   ├── ranking/                     # Agente 9
│   │   └── compute.ts
│   ├── achievements/                # Agente 11
│   │   ├── catalog.ts
│   │   └── triggers.ts
│   ├── i18n/
│   │   └── es-AR.json               # Del Agente 13
│   └── utils/
│       ├── date.ts                  # date-fns wrappers en es-AR
│       ├── cn.ts                    # clsx + tailwind-merge
│       └── format.ts
│
├── types/
│   ├── database.ts                  # Generado de Supabase (Agente 8)
│   ├── domain.ts                    # User, Match, Prediction, etc.
│   └── api.ts
│
├── data/
│   ├── mocks/                       # Agente 8 produce
│   │   ├── users.json
│   │   ├── matches.json
│   │   ├── predictions.json
│   │   └── posts.json
│   └── seed/                        # Datos del Mundial 2026 estáticos
│       ├── teams.json
│       └── schedule.json
│
├── design/                          # Assets ya entregados
│   ├── tokens.json
│   ├── icons.svg
│   ├── preview.html
│   ├── icons-system.html
│   ├── screens.html
│   ├── share-argentina-cinematic.html
│   └── motion-preview.html
│
├── docs/                            # Documentación viva
│   ├── 01_product_strategy.md
│   ├── 02_ux_architecture.md
│   ├── 03_design_system.md
│   ├── 04_ui_designs.md
│   ├── 05_viral_share.md
│   ├── 06_motion.md
│   └── 07_nextjs_architecture.md
│
├── public/
│   ├── manifest.json                # PWA
│   ├── favicon.svg
│   └── og-default.png               # OpenGraph default
│
├── middleware.ts                    # Auth gate global
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts               # Del Agente 3
├── package.json
├── pnpm-lock.yaml
├── .env.example
├── .env.local                       # gitignored
└── README.md
```

---

## 3. Convenciones técnicas

### 3.1 Server vs Client components

**Server Components (default):** todo lo que no necesita estado, eventos del browser o hooks de React. Listas de partidos, contenido del muro, profile read-only.

**Client Components (`"use client"`):** todo lo que tiene estado o handlers — score inputs, modales, toggles, animaciones (Framer Motion). Definidos en componentes hoja, no en layouts.

**Streaming:** uso de `<Suspense>` en boundaries naturales (StatCards, NextMatchHero, Activity) para hidratar progresivamente la Home.

### 3.2 Fetching strategy

- **Static data** (matches schedule, teams) → built-in static generation, revalidate weekly.
- **Dynamic user data** (predictions, ranking) → server fetch con `cache: 'no-store'` + revalidate tags.
- **Realtime** (heart en posts, scores en vivo) → Supabase realtime subscription en client component.

Revalidate tags:
```typescript
// Server action o route
await unstable_revalidateTag(`user-${userId}-predictions`);
await unstable_revalidateTag(`ranking-global`);
```

### 3.3 Naming conventions

- **Files:** `kebab-case.tsx` para rutas, `PascalCase.tsx` para componentes.
- **Variables:** `camelCase`. Const exportadas en `UPPER_SNAKE`.
- **Routes:** español rioplatense (`/prode`, `/muro`, `/perfil`) — no mezclar con inglés.
- **API routes:** inglés (`/api/predictions`, `/api/share`) — son técnicos.

---

## 4. Auth flow (Supabase)

### 4.1 Edge middleware

```
Request a `/app/**`
   │
   ▼
[middleware.ts]
   │
   ├── Lee cookie `sb-auth-token`
   ├── Refresh si está por expirar
   │
   ├── Si no hay sesión → redirect 302 a /login
   ├── Si hay sesión → next()
   │
   ▼
[Route handler]
```

### 4.2 Invite-only registration

El registro requiere `inviteCode` válido. Tabla `invite_codes` con flag `used boolean`. Una vez consumido, queda asociado al `userId` creado.

### 4.3 Session persistence

- Cookie httpOnly, sameSite lax, secure en prod, max-age 30 días.
- Refresh automático en middleware.
- Logout limpia cookies + redirige a /splash.

---

## 5. Endpoints API principales

| Método | Path | Propósito |
|---|---|---|
| GET | `/api/share/[template]/[userId]` | Genera PNG via @vercel/og (Agente 5) |
| POST | `/api/predictions` | Guarda/actualiza predicción (Agente 9 valida) |
| PATCH | `/api/predictions/[matchId]` | Edita prediction existente |
| POST | `/api/reactions` | Like/unlike en post del muro |
| POST | `/api/posts` | Crear post en muro |
| GET | `/api/ranking?scope=global\|weekly\|phase` | Ranking computado (Agente 9) |
| POST | `/api/webhook/match-settled` | Webhook al cerrar partido → triggers scoring |

Todos validan con Zod schema antes de tocar DB. RLS de Supabase como segunda barrera.

---

## 6. PWA / mobile-first

- `manifest.json` con icons + `display: standalone` + theme color `#0B0B0D`.
- Service Worker generado por `next-pwa` o `@serwist/next`.
- Offline-first para schedule (matches, teams). Predicciones se enculan en IndexedDB y sincronizan al reconectar.
- Web Push: registrar suscripción en `push_subscriptions` table. Edge function envía vía VAPID.

---

## 7. Performance

### 7.1 Bundle target
- First Load JS < 110KB gzipped (Home page).
- Each route ≤ 30KB JS marginal.

### 7.2 Imágenes
- Banderas: SVG inline (no `<Image>`).
- Photos (splash, share): `next/image` con `placeholder="blur"` data URL.

### 7.3 Fonts
- Anton + Inter via `next/font/google` con subset latin + preload selectivo.
- Display swap.

```typescript
// app/layout.tsx
import { Anton, Inter } from "next/font/google";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
```

### 7.4 Caching
- Static assets (icons.svg) → 1 year immutable.
- API responses → tag-based revalidation.
- Share PNG endpoint → edge cache + CDN (Agente 5 §4.3).

---

## 8. Testing

- **Unit:** Vitest para `lib/scoring/`, `lib/ranking/`, `lib/share/`.
- **Component:** Vitest + React Testing Library para primitivas críticas (ScoreInput, RankingRow).
- **E2E:** Playwright para 4 flows críticos del Agente 2 (onboarding, predicción, share, ranking).
- **Visual regression:** Playwright + screenshot diffs en CI (futuro).

CI runs: lint → typecheck → unit + component → e2e (paralelo) → build.

---

## 9. Deploy

- **Vercel** como host primario. Edge functions para share API y middleware.
- **Supabase** managed (DB + Auth + Realtime + Storage).
- **Branches:** `main` → producción. `staging` → preview deploy automático. Feature branches → preview por PR.
- **Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (server only), `NEXT_PUBLIC_APP_URL`.

---

## 10. Archivos generados en este checkpoint

Los archivos clave del scaffold ya creados:

- `package.json` con todas las deps
- `tsconfig.json` strict
- `next.config.ts` con experimental.typedRoutes
- `.env.example` con todas las variables
- `middleware.ts` con auth gate
- `app/layout.tsx` con fonts + providers
- `app/page.tsx` (redirect inicial)
- `app/(app)/layout.tsx` con BottomNav
- `app/(auth)/layout.tsx`
- `components/ui/Icon.tsx` (wrapper del sprite)
- `components/ui/Button.tsx`
- `lib/utils/cn.ts`

Los componentes restantes (Avatar, Badge, MatchCard, etc.) se completan en iteraciones posteriores siguiendo los specs del Agente 3 §9-§10. El esqueleto del proyecto es ejecutable: `pnpm install && pnpm dev` corre el server en desarrollo.

---

## 11. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| NX-D1 | App Router exclusivo (no Pages Router) | Server Components by default |
| NX-D2 | Route groups `(auth)` y `(app)` para separar layouts | Middleware solo protege `/app/**` |
| NX-D3 | Supabase como backend único | Auth + DB + Realtime + Storage en un solo provider |
| NX-D4 | pnpm como package manager | Lock file canónico, soporte workspaces futuro |
| NX-D5 | Biome para lint + format | Más rápido que ESLint+Prettier, single tool |
| NX-D6 | `next/font` para Anton + Inter | Sin requests a Google Fonts en runtime |
| NX-D7 | Edge runtime para `/api/share/` y middleware | Latencia baja global |
| NX-D8 | PWA via `@serwist/next` | Push notifications + offline-first para schedule |
| NX-D9 | Idioma único es-AR, sin i18n routing | `<html lang="es-AR">` hardcoded |
| NX-D10 | Sin Lucide (DS-D3) — icon sprite custom servido como SVG estático | `<Icon name="..."/>` wrapper hace `<use href="/design/icons.svg#name"/>` |

---

## 12. Próximo paso

**Agente 8 — Data Modeler** recibe la estructura y produce:
- Schemas TypeScript completos (User, Match, Prediction, Post, Comment, Achievement, RankingEntry, InviteCode)
- Mocks JSON realistas con ~30 socios + calendario Mundial 2026
- Esquema SQL para Supabase incluyendo RLS, índices, views materializadas
- Tipos generados de la DB

---

*Fin Agente 7 — Listo para checkpoint del usuario.*
