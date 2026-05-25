# O2 PRODE — Deploy Checklist

**Agente 14 · QA & Performance**
Pre-release sign-off para producción. Cada item debe estar ✅ antes de anunciar el lanzamiento al gym.

---

## Code quality
- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm lint` pasa sin warnings nuevos
- [ ] `pnpm test` (unit + component) pasa 100%
- [ ] `pnpm test:e2e` pasa los 4 flows críticos en 3 viewports
- [ ] `pnpm build` exitoso
- [ ] Bundle size dentro del budget (≤ 110KB first load JS)

## Performance
- [ ] Lighthouse mobile Performance ≥ 90 en Home, Prode, Ranking, Wall, Perfil
- [ ] Lighthouse mobile Accessibility = 100
- [ ] FCP < 1.4s · LCP < 2.0s · TBT < 200ms · CLS < 0.05
- [ ] Share PNG endpoint warm < 50ms, cold < 600ms
- [ ] Stress test k6 con 1000 concurrent passed

## Accesibilidad
- [ ] axe-core sin issues nuevos vs Agente 12 baseline
- [ ] Los 3 hallazgos críticos del Agente 12 parcheados (C1, C2, C3)
- [ ] Navegación completa por teclado verificada manualmente
- [ ] VoiceOver iOS y TalkBack Android anuncian correctamente las pantallas críticas
- [ ] Zoom 200% sin overflow horizontal
- [ ] `prefers-reduced-motion` respetado en todas las animaciones

## Backend (Supabase)
- [ ] Migración SQL aplicada en producción
- [ ] RLS habilitada en todas las tablas con datos de usuario
- [ ] Trigger `trg_match_finished` activo y testeado
- [ ] Materialized views `mv_user_summary` y `mv_ranking_global` creadas
- [ ] Tabla `tournament` con `slug='mundial-2026'`, `active=true`
- [ ] Tablas `team`, `group`, `match` seedeadas con datos finales del sorteo
- [ ] Tabla `achievement_catalog` poblada (19 logros)
- [ ] Tabla `invite_code` poblada con ~1000 códigos (margen sobre 800 socios)

## Environment
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (server only)
- [ ] `NEXT_PUBLIC_APP_URL` apuntando a la URL de producción
- [ ] `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` configuradas
- [ ] DNS apuntando al dominio final (verificar TTL si reciente)
- [ ] HTTPS con certificado válido

## Push notifications
- [ ] VAPID keys generadas y configuradas
- [ ] Service worker registrado al primer load
- [ ] Push notification de prueba enviada a 2 devices reales
- [ ] Notificaciones de los 12 tipos del catálogo verificadas en formato

## Realtime
- [ ] Supabase Realtime habilitado en tablas `post`, `comment`, `reaction`, `notification`, `ranking_snapshot`
- [ ] Conexión persistente desde client funcional
- [ ] Subscriptions filtradas funcionan (post detail, comments)

## PWA
- [ ] `manifest.json` válido con icons (192, 512, maskable)
- [ ] Service worker activo y cacheando shell + assets estáticos
- [ ] Install prompt funciona en Chrome Android
- [ ] Add-to-homescreen funciona en iOS Safari (PWA installable)
- [ ] Offline: app shell carga; mensaje "sin conexión" para data dinámica

## Rate limiting
- [ ] 5 posts/h por usuario configurado
- [ ] 30 comments/h por usuario configurado
- [ ] 60 reactions/min por usuario configurado
- [ ] Mensajes de error de rate limit testeados

## Cron jobs
- [ ] Cron diario de evaluación de logros de consistencia (rachas)
- [ ] Cron semanal de Remontada (P04)
- [ ] Cron de snapshot del ranking (semanal)
- [ ] Cron de notificación de Resumen Semanal (domingo 20:00 -03)
- [ ] Cron de refresh de `mv_*` materialized views (cada 5min)

## Legal y compliance
- [ ] Términos y condiciones publicados (URL accesible desde Settings)
- [ ] Política de privacidad publicada (URL accesible)
- [ ] Aviso de cookies configurado si aplica
- [ ] Comunicación clara de "premios simbólicos del gym, sin dinero" en TyC
- [ ] Procedimiento de baja de socio implementado (soft delete)

## Operations
- [ ] Health check `/api/health` retorna 200 con info de versión
- [ ] Logs en Vercel verificables y filtrables
- [ ] Alertas de error 5xx configuradas (canal de notificación interno)
- [ ] Plan de rollback documentado y testeado en staging
- [ ] Acceso de admin definido (quién puede ver tabla `user`, `invite_code`)

## Comunicación al lanzar
- [ ] Cartelería en el gym con QR a la app
- [ ] Mensaje a socios con sus invite codes (canal: email o WhatsApp del gym)
- [ ] Anuncio en clases del gym (semana del 11/06/2026)
- [ ] FAQ interna preparada para el staff del gym (cómo ayudar a un socio que no sabe usarlo)
- [ ] Premios definidos por la marca aliada (Nahuel coordina)

## Día del lanzamiento (11/06/2026)
- [ ] Monitoreo activo de logs durante las primeras 4hs
- [ ] Ronda de feedback rápido con 3-5 socios beta
- [ ] Verificar funcionamiento al partido inaugural del Mundial
- [ ] Verificar push de "próximo partido" se dispara a tiempo
- [ ] Verificar cálculo de puntos al primer partido finalizado

---

**Sign-off:** Producto listo cuando todos los items críticos están ✅. Items con "[ ]" pendiente se documentan y se mueven a backlog post-MVP solo si no son bloqueantes.
