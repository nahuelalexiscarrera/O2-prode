# O2 PRODE — Gamification Engine

**Agente 11 · Gamification**
Versión 1.0 · 2026-05-19
Inputs: `02_ux_architecture.md` §10, `09_game_logic.md`, `10_social_feed.md`
Outputs:
- `docs/11_gamification.md` (este documento)
- `lib/achievements/catalog.ts` (19 logros tipados)
- `lib/achievements/triggers.ts` (motor de evaluación + unlock)
- `lib/achievements/levels.ts` (niveles 1-5)
- `lib/achievements/actions.ts` (server action de unlock + notify)
- `lib/achievements/index.ts` (public API)

---

## 1. Filosofía

La gamificación NO es dopamina barata. Se basa en **señales legítimas de competencia**: rachas, aciertos finos, constancia, sociabilidad. Tres reglas que la separan del juego pavo:

1. **Cada logro es derivable.** El usuario sabe exactamente qué tiene que hacer para conseguirlo. Sin "logros sorpresa" oscuros.
2. **Desbloqueo único.** Una vez ganado, no se gana de nuevo. Se queda guardado en `user_achievement` con timestamp.
3. **Bonus de puntos modesto.** Los logros suman al ranking pero no lo definen — la skill predictiva sigue siendo el driver principal.

---

## 2. Catálogo (19 logros, 4 categorías)

Definido en `lib/achievements/catalog.ts`. Fuente: Agente 2 §10.2 + Agente 8 `data/mocks/achievements.json`.

| ID | Categoría | Nombre | Trigger | Bonus |
|---|---|---|---|---|
| A01 | skill | El que sabe | 5 resultados exactos seguidos | +15 |
| A02 | skill | Visionario | Acertaste al campeón pre-torneo | +40 |
| A03 | skill | Mufa controlada | Acertaste un upset | +10 |
| A04 | skill | Pleno | Todos los partidos de un grupo | +20 |
| A05 | skill | Eliminator | Todos los octavos | +25 |
| C01 | consistency | Constante | 7 días seguidos | +10 |
| C02 | consistency | Maratonista | 21 días seguidos | +30 |
| C03 | consistency | Todoterreno | 100% del torneo | +50 |
| C04 | consistency | Madrugador | Grupo completo día 1 | +5 |
| S01 | social | Inicio fuerte | Primer post en muro | +5 |
| S02 | social | Popular | 10 reacciones en un post | +5 |
| S03 | social | Embajador | 5 shares externos | +10 |
| S04 | social | Conector | 10 comments hechos | +5 |
| S05 | social | Tribu | 3 amigos activan la app | +10 |
| P01 | position | Top 10 | Llegaste al top 10 | +10 |
| P02 | position | Podio | Llegaste al top 3 | +25 |
| P03 | position | Líder | Liderás el ranking | +50 |
| P04 | position | Remontada | +10 posiciones en una semana | +15 |
| P05 | position | Campeón | Seleccion campeona del mundo | +100 |

---

## 3. Modelo de triggers

Cada logro tiene un **trigger key** que mapea a un evaluador puro. Los evaluadores reciben un `Context` con la data necesaria y retornan `boolean`.

```typescript
type TriggerContext = {
  userId: string;
  predictions: Prediction[];
  streakDays: number;
  groupCompletions: GroupCompletionSummary[];
  position: number;
  weeklyPositionDelta: number;
  postsCount: number;
  commentsCount: number;
  bestPostReactions: number;
  externalSharesCount: number;
  activatedFriendsCount: number;
  championPredicted: string | null;
  championActual: string | null;
  tournamentEnded: boolean;
  tournamentWinner: string | null;
};

type Evaluator = (ctx: TriggerContext) => boolean;
```

El motor se ejecuta en 2 momentos:
- **Tras settle de un match** (Agente 9 dispara → triggers de skill + position).
- **Tras un evento social** (Agente 10 dispara → triggers social).
- Cron diario al cierre del día → triggers de consistency (rachas).

---

## 4. Flujo de desbloqueo

```
[Evento — match settled / post created / streak day rollover]
       │
       ▼
[Motor evalúa logros relevantes para el usuario]
       │
       ├── Para cada logro NO desbloqueado aún:
       │   - Construye context
       │   - Ejecuta evaluator(context) → boolean
       │   - Si true:
       │       1. INSERT en user_achievement
       │       2. Suma pointsBonus al user.total_points
       │       3. Recalcular position
       │       4. Crear notification tipo "achievement-unlocked"
       │       5. Push notification (si user opt-in)
       │
       └── Idempotente: si ya está desbloqueado, no-op.
       │
       ▼
[Client recibe realtime event → muestra Modal M16 (achievement unlock)]
```

---

## 5. Niveles 1-5

| Nivel | Nombre | Threshold (pts) | Badge color |
|---|---|---|---|
| 1 | Rookie | 0 | gris |
| 2 | Aplicado | 51 | naranja soft |
| 3 | Pro | 151 | naranja primary |
| 4 | Crack | 301 | lime |
| 5 | Leyenda O2 | 501 | lime + glow |

Función pura `pointsToLevel(points)` ya existe en `lib/ranking/compute.ts`. Se replica en `lib/achievements/levels.ts` con helpers de UI: color, glow, displayName.

---

## 6. Cuándo se notifica al usuario

| Tipo de logro | UX al desbloquear |
|---|---|
| skill / position high-impact (A02, A05, P02, P03, P05) | Modal M16 fullscreen + push |
| skill / position medium (A01, A03, A04, P01, P04) | Modal M16 + toast |
| consistency | Toast + entry en perfil/logros (sin interrumpir flow) |
| social (S01-S05) | Toast solo |

**Regla:** Si hay 3+ logros desbloqueados al mismo tiempo (raro pero posible al final del torneo), se muestran en cola, uno por vez. El usuario puede skipear.

---

## 7. Bonus de puntos: ¿al ranking global o paralelo?

**Decisión cerrada:** los bonus suman al `total_points` del user, igual que los puntos por predicción. NO hay "score paralelo de logros". Esto mantiene la simplicidad del ranking y honra el esfuerzo de las dos vías (acertar predicciones + cumplir logros).

Implicancia: cuando se suma el bonus, se llama a `fn_recalculate_positions` (Agente 8). Esto puede generar un cambio de posición visible — bien, es premio.

---

## 8. Achievements compartibles

Cada `user_achievement` tiene un flag `shared boolean`. Cuando se desbloquea, el modal M16 incluye un CTA "Compartir" que abre el flow del Agente 5 con template T04 (Achievement). Tap → `share_intent` registrado + `shared = true`.

Si el usuario shareó ≥ 5 logros externamente → desbloquea **S03 Embajador** (meta-achievement).

---

## 9. Privacidad

- Cada socio ve sus propios logros en `/perfil/logros`.
- En el perfil público de otro socio se ve **el conteo** de logros + las medallas más recientes, pero NO la lista completa. El user puede opt-out de mostrar logros vía Settings.
- Los logros en el podio (P03 Líder, P05 Campeón) son siempre públicos.

---

## 10. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| GA-D1 | Cada logro = una función pura evaluator | Testeable, sin side effects |
| GA-D2 | Triggers se disparan en 3 momentos: post-settle, post-social, daily cron | No hay watchers globales costosos |
| GA-D3 | Bonus suma al `user.total_points` (no paralelo) | Una sola escala de ranking |
| GA-D4 | Idempotente: re-evaluar nunca duplica logros | Constraint UNIQUE en user_achievement |
| GA-D5 | Modal M16 solo para logros high-impact | Resto = toast |
| GA-D6 | Logros tienen niveles de impacto (high / medium / low) en el catálogo | Controla UX de notificación |
| GA-D7 | Cola de logros si ≥ 3 desbloqueos simultáneos | Evita stacking de modales |
| GA-D8 | Privacidad granular: conteo público, lista privada por default | Settings permite full público |

---

## 11. Próximo paso

**Agente 12 — Accessibility Auditor** revisa todo lo construido y produce reporte + parches WCAG 2.1 AA.

---

*Fin Agente 11 — Listo para checkpoint del usuario.*
