# O2 PRODE — QA & Performance Plan

**Agente 14 · QA & Performance**
Versión 1.0 · 2026-05-19
Inputs: todos los agentes 1-13
Outputs:
- `docs/14_qa_performance.md` (este documento)
- `lib/qa/copy-check.ts` (script de validación de i18n)
- `vitest.config.ts` (config unit tests)
- `playwright.config.ts` (config e2e)
- `lighthouserc.json` (presupuesto Lighthouse CI)
- `docs/DEPLOY_CHECKLIST.md` (checklist pre-release)

---

## 1. Estrategia de QA

Tres capas de testing, una mantiene la otra:

```
                  ┌─────────────────┐
                  │   E2E (Playwr)  │   ≈ 12 tests (4 flows críticos x 3 viewports)
                  └─────────────────┘
                ┌───────────────────────┐
                │  Component (Vitest)   │   ≈ 30 tests (primitivas críticas)
                └───────────────────────┘
              ┌─────────────────────────────┐
              │     Unit (Vitest)           │   ≈ 80 tests (scoring, ranking, i18n)
              └─────────────────────────────┘
```

### 1.1 Unit tests (Vitest)
- `lib/scoring/__tests__/calculator.test.ts` — ya entregado (28 tests del Agente 9).
- `lib/social/__tests__/feed.test.ts` — timeAgo, truncateBody, destacadosScore, optimistic helpers.
- `lib/achievements/__tests__/triggers.test.ts` — evaluators puros.
- `lib/i18n/__tests__/coverage.test.ts` — corre `copyCheck()` y falla si faltan keys.
- `lib/a11y/__tests__/contrast.test.ts` — verifica WCAG ratios de toda la paleta.

### 1.2 Component tests
- ScoreInput: tap, keyboard, locked, settled states.
- BottomNav: active state, navigation.
- RankingRow: self highlight, delta arrow direction.
- PostCard: optimistic reaction, comment count.
- Modal: focus trap, Escape close, return focus.

### 1.3 E2E flows críticos (Playwright)
Los 6 flows del Agente 2 §5, priorizados en 4 obligatorios para CI:
1. Onboarding completo → 1ª predicción cargada (target ≤ 90s).
2. Cargar predicción de un grupo entero (auto-save).
3. Compartir prode → CTA Instagram → fallback.
4. Reaccionar + comentar un post.

Tres viewports en cada uno: 360×640, 390×844, 1024 (desktop centered).

---

## 2. Performance budget

### 2.1 Lighthouse mobile targets

| Métrica | Target | Stretch | Crítico si supera |
|---|---|---|---|
| Performance score | ≥ 90 | ≥ 95 | < 80 |
| Accessibility score | 100 | 100 | < 95 |
| Best practices | ≥ 95 | 100 | < 90 |
| SEO | ≥ 90 | 100 | < 80 |
| **FCP** (First Contentful Paint) | < 1.4s | < 1.0s | > 2.0s |
| **LCP** (Largest Contentful Paint) | < 2.0s | < 1.5s | > 2.5s |
| **TBT** (Total Blocking Time) | < 200ms | < 100ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.05 | 0 | > 0.1 |
| **TTI** (Time to Interactive) | < 3.0s | < 2.0s | > 4.0s |

Throttling: simulated mobile (Slow 4G, 1.6Mbps, 562ms RTT). Device: Moto G Power.

### 2.2 Bundle size targets

| Asset | Target | Crítico |
|---|---|---|
| JS Home page (first load) | < 110 KB gzip | > 150 KB |
| JS por route adicional | < 30 KB | > 60 KB |
| CSS total | < 25 KB gzip | > 50 KB |
| Fonts (Anton + Inter subset) | < 80 KB | > 150 KB |
| icons.svg sprite | < 12 KB | > 20 KB |
| Imagen share PNG | < 200 KB | > 400 KB |

Verificado vía `@next/bundle-analyzer` en CI.

### 2.3 Runtime performance

- 60 FPS en animaciones (Agente 6 enforced).
- Realtime Supabase: < 200ms desde cambio en DB hasta UI update.
- Score input save: < 300ms desde tap "confirmar" hasta toast.
- Page transition: < 500ms incluyendo data fetch.
- Share PNG generation (edge): < 600ms cold, < 50ms warm.

---

## 3. Auditoría de copy (i18n coverage)

Script `lib/qa/copy-check.ts` (entregado) recorre `lib/i18n/es-AR.json` y verifica:

1. **Todas las keys referenciadas en código existen.** Falla el build si un componente referencia `t.foo.bar` y no está en el JSON.
2. **No hay keys huérfanas** (en el JSON pero no usadas en código) — warning, no falla.
3. **Interpolaciones declaradas vs usadas:** si la copy dice `{points}` pero el code pasa `{score}`, error.
4. **Cobertura de aria-labels:** cada componente con prop `aria-*` debe tener fuente i18n.

Ejecutado en CI antes de `next build`.

---

## 4. Deploy checklist (pre-release)

Documento completo en `docs/DEPLOY_CHECKLIST.md`. Resumen:

- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm lint` pasa sin warnings nuevos.
- [ ] `pnpm test` (unit) pasa 100%.
- [ ] `pnpm test:e2e` pasa los 4 flows críticos en 3 viewports.
- [ ] `pnpm build` exitoso. Bundle size dentro de budget.
- [ ] Lighthouse mobile ≥ 90 en Performance/Accessibility.
- [ ] axe-core sin issues nuevos vs Agente 12.
- [ ] Variables de entorno presentes en Vercel (SUPABASE_URL, ANON_KEY, SERVICE_ROLE, VAPID).
- [ ] Migración SQL aplicada en Supabase producción.
- [ ] Tabla `invite_code` poblada con códigos para socios.
- [ ] Rate limits configurados en edge (Vercel KV).
- [ ] Web Push VAPID configurado y testeado.
- [ ] `tournament` activo en DB con `slug='mundial-2026'` y `active=true`.
- [ ] Equipos y partidos seedeados (`data/seed/*.json` → DB).
- [ ] Health check `/api/health` retorna 200.
- [ ] Probado en device real iOS Safari y Android Chrome.
- [ ] PWA installable (manifest + service worker activo).
- [ ] Notificaciones push funcionando en al menos 2 devices.
- [ ] Privacy policy y términos publicados.
- [ ] Comunicación al gym preparada (cartelería, mensaje a socios).

---

## 5. Monitoring post-release

| Métrica | Cómo | Alerta |
|---|---|---|
| Crash rate | Vercel Logs + Sentry (futuro) | > 0.5% sesiones |
| API latency p95 | Vercel Analytics | > 800ms |
| Realtime conexiones activas | Supabase dashboard | < 80% del padrón en horario peak |
| Share endpoint cache hit ratio | Vercel Edge logs | < 70% |
| Errores 5xx | Vercel Logs | Cualquier pico súbito |

Dashboards a crear post-release: ranking de socios activos por día, share intent funnel, retention cohort por semana del torneo.

---

## 6. Rollback strategy

- **DB:** Supabase mantiene 7 días de point-in-time recovery por default. Migrations son reversibles vía `supabase db reset` + restore.
- **Code:** Vercel preserva los últimos 100 deploys. Rollback con 1 click.
- **Triggers de rollback:**
  - Crash rate > 1% durante > 5min.
  - 5xx rate > 5% durante > 5min.
  - Share endpoint cae > 1min.
  - Reporte directo de socio (canal interno).

---

## 7. Plan de carga y stress

Padrón 800 socios. Estimación de carga peak:
- Inicio de partido Argentina: ~600 sesiones concurrentes esperadas.
- Cargas de predicción: ~400 POST en ventana de 1h pre-kickoff.
- Reacciones durante el partido: ~3000 events/h en horas pico.

**Tests previos:**
- k6 simulando 1000 usuarios concurrentes en `/api/predictions` y `/api/reactions`.
- Stress test del endpoint `/api/share/[template]/[userId]` con 100 RPS.

Pre-release: ejecutar suite al menos 1 semana antes del 11/06/2026.

---

## 8. Bugs conocidos / debt aceptado

Cosas que se decidieron NO hacer en MVP y se documentan:

| # | Item | Decisión | Cuándo |
|---|---|---|---|
| 1 | Modo claro | Postergado, dark-only | Post-MVP |
| 2 | i18n routing | Solo es-AR hardcoded | Post-MVP si llega a otro mercado |
| 3 | Imágenes en posts | No soportado | Reduce abuso + storage cost |
| 4 | Threads anidados en comments | No soportado | Simplifica UX (UX-D9) |
| 5 | Buscador full-text en posts | Solo búsqueda de socios en ranking | Post-MVP |
| 6 | Web Share API completion tracking | Heurística, no certeza | Limitación del estándar |
| 7 | Desktop UI nativa | No diseñada | Mobile-first, container 480 max |
| 8 | Google sign-in | Reservado el espacio, no implementado | Post-MVP |
| 9 | Edición de post después de publicar | No permitido | Evita drama (UX) |
| 10 | Cron jobs implementados | Configuración Vercel pendiente | Pre-release |

---

## 9. Checklist por feature

### Auth + Onboarding
- [ ] Invite code valida correctamente.
- [ ] Login persiste sesión 30 días.
- [ ] Logout limpia cookies y redirige.
- [ ] Onboarding skipeable en cada step.
- [ ] Predicción inicial guardada incluso si saltea steps 1-2 pero llena en 2.

### Predicciones
- [ ] Auto-save 600ms tras última edición.
- [ ] Toast confirma guardado.
- [ ] Locked state activa 1h antes del kickoff.
- [ ] Settled state muestra puntos ganados.
- [ ] Swipe horizontal entre grupos funciona en mobile real.
- [ ] Numpad cierra al confirmar el segundo número.

### Ranking
- [ ] Mi posición siempre visible (sticky si scrolleo fuera).
- [ ] Búsqueda funciona para nombres con tildes.
- [ ] Paginación de 50 en 50 lazy load.
- [ ] Delta de posición ↑↓ correcto.
- [ ] Tap en avatar de otro socio → su perfil público.

### Muro
- [ ] Optimistic UI funciona offline y revierte si falla.
- [ ] Banner "X posts nuevos" aparece sin auto-insertar.
- [ ] Comentario sticky al teclado abierto.
- [ ] Rate limit visible si lo dispara.

### Share
- [ ] 4 templates renderizan correctamente.
- [ ] Variante Argentina activa Sol de Mayo solo si campeón = ar.
- [ ] Descarga PNG funciona en iOS Safari (es el más restrictivo).
- [ ] WhatsApp deep link abre con imagen.
- [ ] Cache hit ratio > 70% post-warmup.

### Notificaciones
- [ ] Push opt-in funciona en PWA instalada.
- [ ] Deep links al recurso correcto (no a home).
- [ ] Centro de notificaciones marca leídas.

### Logros
- [ ] Modal M16 aparece para impact=high.
- [ ] Toast aparece para impact=medium/low.
- [ ] Cola de logros si hay ≥3 simultáneos.
- [ ] Bonus points se suman a total.

### Accesibilidad (regresión Agente 12)
- [ ] axe-core sin issues nuevos en cada pantalla.
- [ ] Navegación completa por teclado.
- [ ] Screen reader (VoiceOver iOS, TalkBack Android) anuncia correctamente.
- [ ] Zoom hasta 200% sin overflow horizontal.
- [ ] Reduced motion respetado.

---

## 10. Sign-off final del proyecto

El proyecto se considera **listo para release** cuando:

1. ✅ Los 14 agentes han producido sus entregables (este es el agente 14).
2. ✅ Los 3 hallazgos críticos del Agente 12 están parcheados.
3. ✅ Lighthouse mobile ≥ 90 en todos los scores.
4. ✅ E2E pasa los 4 flows en CI.
5. ✅ Stress test soportó 1000 concurrent.
6. ✅ Deploy checklist completo.
7. ✅ Probado en device real por al menos 3 socios beta.

Si todos los puntos arriba están ✅, **el producto está listo para que el gym anuncie el lanzamiento**.

---

## 11. Próximo paso

**Checkpoint final integral** (task #15): review cruzado de coherencia entre todos los entregables, validación de que no hay decisiones que se contradicen entre agentes, y handoff final al equipo de implementación.

---

*Fin Agente 14 — Listo para checkpoint del usuario.*
