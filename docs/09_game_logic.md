# O2 PRODE — Game Logic Engine

**Agente 9 · Game Logic**
Versión 1.0 · 2026-05-18
Inputs: `02_ux_architecture.md` §7-§10, `08_data_model.md`
Outputs:
- `docs/09_game_logic.md` (este documento)
- `lib/scoring/rules.ts` (constantes y types)
- `lib/scoring/calculator.ts` (función pura de scoring por match)
- `lib/scoring/specials.ts` (predicciones especiales one-shot)
- `lib/scoring/bonuses.ts` (rachas y constancia)
- `lib/scoring/index.ts` (public API)
- `lib/ranking/compute.ts` (cálculo de ranking)
- `lib/scoring/__tests__/calculator.test.ts` (Vitest suite)

---

## 1. Filosofía

El motor de scoring es **el corazón de la confianza del usuario**. Si los puntos parecen mal calculados, el producto pierde credibilidad inmediatamente. Por eso:

1. **Funciones puras.** Sin side effects. Misma entrada → misma salida, siempre.
2. **Determinístico al 100%.** Cero randomness, cero dependencia de `Date.now()` dentro del cálculo (los timestamps son inputs, no `now()` interno).
3. **Tests unitarios extensivos.** Cada regla del Agente 2 §7 tiene al menos un test. Edge cases nombrados.
4. **Transparente al usuario.** Cada predicción retorna un `PointsBreakdown` que se muestra en el historial (regla UX de Agente 2 §7.6: "transparencia = confianza").
5. **Dos backends idénticos.** El cálculo vive en TypeScript (cliente y server) Y en PostgreSQL (`fn_calculate_points` del Agente 8). Tests verifican que coinciden bit-a-bit.

---

## 2. Reglas implementadas (resumen del Agente 2 §7)

| Regla | Valor | Implementación |
|---|---|---|
| Acierto exacto | 8 pts base | `rules.ts: EXACT_RESULT` |
| Acierto ganador (no exacto) | 3 pts | `rules.ts: WINNER_ONLY` |
| Empate sin score exacto | 1 pt | `rules.ts: DRAW_ONLY` |
| Bonus diferencia de gol | +2 pts | `rules.ts: DIFF_BONUS` |
| Multiplicador fase grupos | x1 | `multipliers.ts` |
| Octavos | x2 | idem |
| Cuartos | x3 | idem |
| Semis | x4 | idem |
| Final | x5 | idem |
| Predicción campeón | 40 pts | `specials.ts` |
| Subcampeón | 20 | idem |
| Goleador | 30 | idem |
| Mejor selec grupos | 15 | idem |
| Revelación | 15 | idem |
| Racha 7 días | +10 | `bonuses.ts` |
| Racha extendida (cada +7) | +15 | idem |
| Grupo entero ganador correcto | +5 | idem |
| Grupo con 3+ exactos | +10 | idem |
| Jornada perfecta (4/4 ganadores) | +8 | idem |
| 4 fases knockout completas | +20 | idem |
| Pleno cruce eliminatorio | +25 | idem |
| Penalización inactividad (semanal) | -2 | idem |

---

## 3. API pública

```typescript
import {
  calculateMatchPoints,
  calculateSpecialPoints,
  calculateBonusPoints,
} from "@/lib/scoring";

// Cálculo por predicción individual
const breakdown = calculateMatchPoints({
  prediction: { homeScore: 2, awayScore: 1 },
  result:     { homeScore: 3, awayScore: 1 },
  phase: "quarter",
});
// → { exactResult: 0, winnerCorrect: 3, drawCorrect: 0, diffBonus: 2,
//     phaseMultiplier: 3, total: 15 }

// Predicciones especiales (one-shot pre-torneo)
const specialPoints = calculateSpecialPoints({
  prediction: { champion: "ar", topScorer: "mbappe", ... },
  actual:     { champion: "ar", topScorer: "messi", ... },
});
// → { champion: 40, runnerUp: 0, topScorer: 0, ..., total: 40 }
```

---

## 4. Equivalencia TS ↔ SQL

Los tests del scoring incluyen un escenario "parity": ejecutan los mismos inputs en TypeScript y comparan con el resultado de `fn_calculate_points` de Postgres (a través de un fixture pre-computado). Cualquier divergencia rompe el build.

---

## 5. Performance

- Cálculo por predicción: O(1), < 1ms.
- Settle de match con 32 predicciones: < 50ms total (incluyendo update DB).
- Recalcular ranking de 50 socios: < 30ms (single CTE en Postgres).

---

## 6. Edge cases cubiertos en tests

1. Empate exacto (0-0 dijiste, 0-0 fue) → 8 base × multiplicador.
2. Empate sin score (1-1 dijiste, 2-2 fue) → 1 pt + bonus de diff (0 = 0 ✓) = 3 pts.
3. Goleada predicha al revés (3-0 dijiste, 0-3 fue) → 0 pts.
4. Predicción negativa o > 20 → rechazada por validación Zod antes de llegar al engine.
5. Match no jugado (result null) → throw `MatchNotSettledError`.
6. Phase desconocida → throw `UnknownPhaseError`.
7. Predicciones con misma diff de gol pero ganador opuesto → solo bonus si ganador acierta. **No se suma diff si ganador erró.**

---

## 7. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| GL-D1 | Cálculo en TypeScript Y SQL, paridad obligatoria | Mantener fixtures comunes en `lib/scoring/__tests__/parity.json` |
| GL-D2 | PointsBreakdown siempre se persiste con la predicción | El usuario puede inspeccionar "cómo se sumaron mis puntos" |
| GL-D3 | Penalización por inactividad NO afecta ranking global, solo semanal | Decisión UX del Agente 2: no castigar mala semana |
| GL-D4 | Bonus de diff solo cuenta si ganador correcto | Predicciones con "misma diff pero ganador opuesto" no premian |
| GL-D5 | Especiales se settle al final del torneo, no progresivo | Una sola escritura post-final |

---

## 8. Próximo paso

**Agente 10 — Social Feed** consume `types/domain.ts` (Posts, Comments, Reactions) y construye el módulo del muro: queries, optimistic UI, realtime subscriptions.

---

*Fin Agente 9 — Listo para checkpoint del usuario.*
