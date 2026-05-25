# O2 PRODE — Data Model

**Agente 8 · Data Modeler**
Versión 1.0 · 2026-05-18
Inputs: todos los agentes 1-7
Outputs:
- `docs/08_data_model.md` (este documento)
- `types/domain.ts` (interfaces TypeScript del dominio)
- `data/seed/teams.json`, `data/seed/groups.json`, `data/seed/schedule.json`
- `data/mocks/users.json`, `predictions.json`, `posts.json`, `achievements.json`
- `supabase/schema.sql` (DDL completo con RLS, índices, views)

---

## 1. Filosofía del modelo

**Tournament-agnostic, MVP Argentina-only (D8 del Agente 1).** El modelo soporta torneos futuros (Libertadores, Copa América) sin refactor, pero el deploy MVP solo carga datos del Mundial 2026.

**Source of truth → Supabase.** Mocks JSON son para desarrollo local + Storybook + tests. Todo path de producción pega contra DB.

**Tipos generados ↔ schema sincronizado.** El comando `pnpm supabase:types` regenera `types/database.ts` desde la DB. `types/domain.ts` se mantiene a mano (es la capa de dominio limpia que consumen componentes).

---

## 2. Entidades del dominio

### 2.1 Diagrama relacional

```
                          ┌──────────────┐
                          │  invite_code │
                          └──────┬───────┘
                                 │ used_by
                                 ▼
┌──────────┐ ──── creates ──▶ ┌─────────┐ ─── makes ──▶ ┌──────────────┐
│ tournament│                  │  user   │              │  prediction  │
└──────────┘                   └─────────┘              └──────────────┘
     │                              │                          │
     │ has                          │ posts                    │ for
     ▼                              ▼                          ▼
┌──────────┐                   ┌─────────┐              ┌──────────────┐
│   group  │ ──── contains ──▶ │  team   │ ── plays ──▶ │     match    │
└──────────┘                   └─────────┘              └──────────────┘
                                                              │
                                ┌──── post ─────┐             │
                                ▼               │             ▼
                          ┌──────────┐      ┌───────┐   ┌──────────────┐
                          │   user   │◀─────│ post  │   │ match_result │
                          └──────────┘ owns └───┬───┘   └──────────────┘
                                                │
                          ┌── reactions ────────┼── comments ─────┐
                          ▼                     ▼                  ▼
                    ┌──────────┐          ┌──────────┐       ┌──────────┐
                    │ reaction │          │ comment  │       │ comment  │
                    └──────────┘          └──────────┘       └──────────┘

                    ┌────────────────────┐       ┌──────────────────────┐
                    │ achievement_catalog │      │  user_achievement     │
                    └────────────────────┘──────▶└──────────────────────┘
                                                          ▲
                                                          │ unlocks
                                                          │
                                                     ┌────┴────┐
                                                     │  user   │
                                                     └─────────┘
```

### 2.2 Lista canónica

| Entidad | Propósito | Volumen esperado |
|---|---|---|
| `tournament` | Torneo (Mundial 2026 en MVP) | 1 |
| `team` | Selección nacional | ~48 (todos los clasificados) |
| `player` | Jugador (para predicción de goleador) | ~50 (top scorers candidates) |
| `group` | Grupo del torneo | 12 (Mundial 2026 tiene 12 grupos) |
| `match` | Partido programado | ~102 (72 grupos + 30 knockout) |
| `match_result` | Resultado real (post-partido) | 1 por match |
| `phase` | Fase del torneo (constante) | 5 (grupos, octavos, cuartos, semis, final) |
| `user` | Socio del gym | ~800 (padrón confirmado) |
| `invite_code` | Código de invitación one-use | 1 por user creado |
| `prediction` | Predicción de un match | users × matches predichos |
| `special_prediction` | Campeón/goleador/finalistas one-shot | 1 por user |
| `post` | Posteo en muro social | ~5-20 por user durante torneo |
| `comment` | Comentario en post (sin nesting) | ~3-8 por post |
| `reaction` | Like/heart en post o comment | high volume |
| `achievement_catalog` | Catálogo de logros (Agente 11) | ~18 |
| `user_achievement` | Logro desbloqueado por user | varios por user |
| `ranking_snapshot` | Snapshot semanal del ranking | weekly cron |
| `notification` | Notif in-app + push history | history |
| `push_subscription` | VAPID subscription per device | 1-3 por user |
| `share_intent` | Telemetría de tap en CTA share | high volume |

---

## 3. Schemas TypeScript principales

Detalle completo en `types/domain.ts`. Resumen aquí:

```typescript
export type Phase = "groups" | "round-of-16" | "quarter" | "semi" | "final";
export type UserLevel = 1 | 2 | 3 | 4 | 5;
export type AchievementCategory = "skill" | "consistency" | "social" | "position";

export interface User {
  id: string;            // uuid
  email: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  level: UserLevel;
  totalPoints: number;
  position: number;
  joinedAt: string;
  inviteCodeUsed: string;
  notificationPrefs: NotificationPrefs;
  visibility: "public" | "private";
}

export interface Team {
  code: string;          // ISO 3166-1 alpha-2 lowercased: "ar", "br", "fr"
  name: string;          // "Argentina"
  groupId: string | null; // "A", "B", ... null si aún no asignada (early MVP)
}

export interface Match {
  id: string;
  tournamentId: string;
  phase: Phase;
  groupId: string | null;
  homeTeamCode: string;
  awayTeamCode: string;
  kickoffISO: string;
  venueCity?: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  lockoutISO: string;     // kickoff - 1h
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  topScorerPlayerId?: string | null;
  finishedAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number | null;  // null hasta que match finishedAt + scoring run
  createdAt: string;
  updatedAt: string;
}

export interface SpecialPrediction {
  userId: string;
  tournamentId: string;
  championTeamCode: string;
  runnerUpTeamCode: string;
  topScorerPlayerId: string;
  groupStageBestTeamCode: string;
  revelationTeamCode: string;
  lockedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  body: string;            // max 280 chars
  embedType: "prediction" | "match" | null;
  embedRefId: string | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  body: string;            // max 280 chars
  reactionCount: number;
  createdAt: string;
}

export interface Reaction {
  targetType: "post" | "comment";
  targetId: string;
  userId: string;
  createdAt: string;
}

export interface AchievementCatalog {
  id: string;              // "A01", "C01", etc.
  category: AchievementCategory;
  name: string;
  description: string;
  iconRef: string;
  pointsBonus: number;
  triggerKey: string;      // referencia que el engine de gamification interpreta
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  shared: boolean;
}
```

---

## 4. Esquema SQL para Supabase (resumen)

Detalle completo en `supabase/schema.sql`. Highlights:

### 4.1 Tablas con RLS

Todas las tablas con datos del usuario tienen Row-Level Security activado.

**Política base:**
- `SELECT`: cualquier socio autenticado puede leer datos públicos de otros socios (ranking, posts, etc.).
- `INSERT/UPDATE`: solo el dueño de la fila (`auth.uid() = user_id`).
- `DELETE`: solo el dueño + admin role.

### 4.2 Índices críticos

```sql
CREATE INDEX idx_prediction_user_match ON prediction(user_id, match_id);
CREATE INDEX idx_prediction_match_settled ON prediction(match_id) WHERE points_earned IS NULL;
CREATE INDEX idx_ranking_snapshot_week ON ranking_snapshot(week_number DESC, position);
CREATE INDEX idx_post_created ON post(created_at DESC);
CREATE INDEX idx_user_position ON "user"(position) WHERE deleted_at IS NULL;
```

> **Nota de escala (padrón ~800):** Con ~800 socios × ~102 partidos = potencial de ~82.000 filas en `prediction`. Los índices listados manejan eso sin problema con Postgres tunning default. La tabla `reaction` puede llegar a > 100k filas si engagement social es alto — monitorear y considerar particionado por `target_type` solo si crece > 1M.

### 4.3 Views materializadas

**`mv_user_summary`** — Vista crítica que el endpoint de share consume. Joina user + special_prediction + ranking actual + nivel + total points. Se refresca cada 5 minutos vía cron.

**`mv_ranking_global`** — Ranking total al día. Refresh on-demand cuando un partido se settle (Agente 9).

**`mv_ranking_weekly`** — Ranking de la semana actual.

### 4.4 Funciones (Postgres)

- `fn_calculate_points(prediction_id) returns int` — Implementa scoring rules del Agente 2 §7.
- `fn_settle_match(match_id)` — Trigger handler que recalcula todos los pointsEarned de predicciones del match.
- `fn_check_achievements(user_id)` — Llamado tras `fn_settle_match`. Itera triggers del catálogo y desbloquea los que aplican.

### 4.5 Constraints

- `prediction.home_score CHECK (>=0 AND <=20)` — Sanity. Nadie predice 21-15.
- `prediction.away_score CHECK` idem.
- `prediction` UNIQUE (user_id, match_id) — un user predice un partido una sola vez (UPDATE permitido).
- `post.body LENGTH(body) <= 280`.

---

## 5. Mocks JSON

### 5.1 `data/seed/groups.json`
Estructura oficial Mundial 2026 — 12 grupos (A-L). MVP carga estos con teams del sorteo cuando ocurra. Por ahora, placeholder con teams hipotéticos.

### 5.2 `data/seed/teams.json`
~48 selecciones clasificadas. Cada team: code (ISO), name (es-AR), groupId.

### 5.3 `data/seed/schedule.json`
72 partidos de fase de grupos + 30 de knockout. Cada match: id, phase, groupId, home, away, kickoff (ISO 8601, hora Buenos Aires GMT-3).

### 5.4 `data/mocks/users.json`
32 usuarios mock con nombres argentinos típicos para development (sub-set del padrón real ~800). Cada uno con email, name, level inicial 1-3, totalPoints variables. Para tests de stress / perf en staging se genera fixture extendido con 800 usuarios sintéticos via script (futuro).

### 5.5 `data/mocks/predictions.json`
~200 predicciones (32 users × 6 partidos del Grupo A como ejemplo).

### 5.6 `data/mocks/posts.json`
~15 posts del muro con diversidad de contenido (predicciones, reacciones a partidos, comentarios genéricos).

### 5.7 `data/mocks/achievements.json`
Catálogo de 18 logros del Agente 2 §10.2.

---

## 6. Tournament agnostic (decisión D8)

Para que la arquitectura sirva en Libertadores / Copa América 2027:

```sql
CREATE TABLE tournament (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,           -- 'mundial-2026', 'libertadores-2026'
  display_name TEXT NOT NULL,
  short_name TEXT NOT NULL,             -- 'Mundial 2026'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  phase_config JSONB NOT NULL,         -- definición de fases y multiplicadores
  active BOOLEAN DEFAULT false
);
```

Los multiplicadores por fase (Agente 2 §7.2) viven en `phase_config` como JSON:

```json
{
  "groups": { "label": "Fase de grupos", "multiplier": 1 },
  "round-of-16": { "label": "Octavos", "multiplier": 2 },
  "quarter": { "label": "Cuartos", "multiplier": 3 },
  "semi": { "label": "Semifinales", "multiplier": 4 },
  "final": { "label": "Final", "multiplier": 5 }
}
```

Esto permite definir un torneo con menos fases (Libertadores tiene fase de grupos + 16vos + etc) sin modificar código.

---

## 7. Realtime subscriptions

Tablas suscritas para Supabase Realtime:

| Tabla | Caso de uso | Channel pattern |
|---|---|---|
| `post` | Muro live feed | `public:post` |
| `reaction` | Heart count actualizado | `public:reaction:target=<postId>` |
| `comment` | Comentarios en post detail | `public:comment:postId=<id>` |
| `notification` | Notif drawer del usuario | `private:notification:userId=<authUid>` |
| `ranking_snapshot` | Ranking se actualiza tras settle | `public:ranking_snapshot` |

---

## 8. Seguridad y privacidad

- **Email del socio:** no visible para otros socios. Solo nombre + avatar son públicos dentro del padrón.
- **Predicciones individuales:** públicas por default; user puede ocultar specific predictions (excepto las del Top 3 del ranking, que siempre son visibles para legitimar el podio).
- **Comments y posts:** públicos dentro del padrón. Cero acceso de no-socios.
- **Invite codes:** se borran (soft delete) tras 30 días sin usar.
- **Soft delete en `user`:** `deleted_at TIMESTAMP NULL`. Predicciones quedan en histórico anónimo pero el ranking ya no las muestra.

---

## 9. Migraciones

Usar Supabase migrations CLI:

```bash
supabase migration new initial_schema
# editar el .sql generado con el contenido de supabase/schema.sql
supabase db push
pnpm supabase:types
```

Cada cambio futuro al schema → nueva migration timestamped. Nunca editar tablas en producción directamente.

---

## 10. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| DM-D1 | Supabase es la única fuente de verdad en runtime | Mocks JSON solo para dev local + tests |
| DM-D2 | Schema tournament-agnostic (D8) | Multiplicadores y fases en `phase_config` JSON |
| DM-D3 | RLS habilitada en todas las tablas con datos de usuario | Auth = autenticación → autorización a nivel DB |
| DM-D4 | Views materializadas para queries críticas (share, ranking) | Refresh on-demand vía trigger; Cron de fallback cada 5min |
| DM-D5 | Realtime en post, reaction, comment, notification, ranking | Resto sigue patrón request-response |
| DM-D6 | Soft delete en user (no hard) | Mantiene integridad histórica |
| DM-D7 | Scoring se ejecuta en Postgres function `fn_settle_match` | Trigger cuando match.status pasa a 'finished' |
| DM-D8 | Comments sin nesting (1 nivel) | UX-D9 del Agente 2. Schema lo refleja con `post_id` direct, sin `parent_comment_id` |

---

## 11. Próximo paso

**Agente 9 — Game Logic** recibe el modelo de datos y produce:
- Implementación del scoring engine en `lib/scoring/`
- Compute de ranking en `lib/ranking/`
- Tests unitarios extensivos (la integridad del scoring = confianza del usuario)
- Triggers SQL `fn_settle_match`, `fn_calculate_points`

---

*Fin Agente 8 — Listo para checkpoint del usuario.*
