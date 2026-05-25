# Sprint 8 — Beta Cerrada con Socios Reales

> **Objetivo:** Validar la app con 5–10 socios O2 reales antes del release público
> del 04/06/2026. Detectar fricciones de onboarding, bugs no cubiertos en testing,
> y problemas de copy o flow que solo emergen con usuarios no técnicos.

---

## 0. Pre-requisitos para arrancar la beta

Antes de mandar el primer invite code, todos estos items deben estar ✅.

### Deploy productivo
- [ ] Repo en GitHub con último build verde
- [ ] Proyecto Vercel conectado al repo, rama `main` desplegando automático
- [ ] Variables de entorno cargadas en Vercel Production
  (ver `docs/DEPLOY_CHECKLIST.md` §Environment)
- [ ] Dominio final apuntando a Vercel (o `*.vercel.app` provisorio aceptado)
- [ ] HTTPS válido, sin warnings de navegador
- [ ] `pnpm build` localmente pasa sin errores antes del último push

### Supabase Production
- [ ] Proyecto Supabase de PRODUCCIÓN separado del de dev
- [ ] `supabase/schema.sql` aplicado completo
- [ ] RLS habilitada y probada en todas las tablas con datos de usuario
- [ ] **Site URL** = dominio de Vercel
- [ ] **Redirect URLs** incluye `https://<dominio>/**`
- [ ] Materialized views creadas + cron de refresh activo
- [ ] Datos del Mundial 2026 seedeados (`tournament`, `team`, `group`, `match`)
- [ ] `achievement_catalog` poblado con los 19 logros

### Invite codes para la beta
- [ ] Lista definida de 5–10 socios beta (con email confirmado)
- [ ] Códigos `BETA-01` a `BETA-10` insertados en `invite_code` con `email` pre-asignado
- [ ] Mensaje preparado para enviar a cada beta tester (template abajo)

### Monitoreo mínimo
- [ ] Acceso a logs de Vercel verificado
- [ ] Acceso al dashboard de Supabase verificado
- [ ] Canal de feedback definido (WhatsApp grupo cerrado / email / form interno)

---

## 1. Selección de beta testers (5–10 socios)

Criterios para elegir bien:

- **Mix de perfiles** — al menos 1 socio jóven, 1 socio +40, 1 mujer, 1 que no sea fan acérrimo de fútbol.
- **Mix de devices** — apuntar a ≥ 2 iPhone, ≥ 2 Android, ≥ 1 device de gama baja.
- **Disponibilidad real** — confirmar que estarán disponibles para feedback durante la semana de beta.
- **Confianza** — gente que va a reportar lo que falla, no a quedarse callada para "no molestar".

Anotar acá los seleccionados:

| # | Nombre | Device | Edad aprox | Contacto | Estado |
|---|---|---|---|---|---|
| 1 | | | | | pendiente |
| 2 | | | | | pendiente |
| 3 | | | | | pendiente |
| 4 | | | | | pendiente |
| 5 | | | | | pendiente |

---

## 2. Mensaje a beta testers

Template para enviar (vía WhatsApp del gym o email):

```
Hola [NOMBRE], te queremos invitar a probar antes que nadie la app del PRODE
del Mundial 2026 que estamos armando para los socios del gym.

Sos 1 de 10 personas que la prueban antes del lanzamiento general.

→ Link: https://[dominio-vercel]
→ Tu código de invitación: BETA-0X
→ Ingresá con tu email: [email-del-socio]

Lo que te pedimos:
- Probala 2-3 ratos durante la semana.
- Cargá predicciones para los primeros partidos del Mundial.
- Si algo no se entiende, no funciona, o te tira error: avisanos por acá.

Cualquier feedback (lo bueno y lo malo) suma. Gracias por bancar.
```

---

## 3. Qué medir durante la beta

### Métricas cuantitativas (revisar día por medio)
- [ ] Cuántos completaron onboarding / cuántos quedaron a mitad
- [ ] Cuántas predicciones cargó cada uno (esperado: ≥ 10 en primera sesión)
- [ ] Tiempo promedio en la app por sesión
- [ ] Cuántos volvieron al día siguiente
- [ ] Cuántos usaron el muro social (publicaron, comentaron, reaccionaron)
- [ ] Errores 5xx en logs de Vercel (esperado: 0)
- [ ] Errores de cliente reportados en Supabase logs

### Observaciones cualitativas (anotar a medida que llegan)
- [ ] ¿Entendieron el sistema de puntos sin explicación?
- [ ] ¿La carga de predicción de knockout fue clara?
- [ ] ¿El muro se sintió "vivo" o vacío?
- [ ] ¿Algún término / copy generó confusión?
- [ ] ¿Hubo fricción con login / invite code?
- [ ] ¿Funcionaron las push notifications? ¿Llegaron a tiempo?

---

## 4. Bitácora de bugs / feedback

Registrar acá cada item con: `[severity] descripción · reportado por · estado`.

**Severidades:**
- `P0` — bloqueante, parchea antes de seguir
- `P1` — feo, parchea esta semana
- `P2` — mejora, va a backlog post-MVP
- `P3` — nice-to-have / opinión

```
[ ] P? - [Descripción del bug/feedback] · Reportado por [nombre] · [pendiente/en progreso/resuelto]
```

---

## 5. Ciclo de iteración

Durante la beta (semana del **25/05/2026 → 01/06/2026**):

1. **Lunes-martes** — Mandar invites, monitorear primer onboarding.
2. **Miércoles** — Check-in 1:1 rápido con 2–3 beta testers (chat o llamada de 10 min).
3. **Jueves-viernes** — Parche de bugs P0/P1 → push a `main` → verificar en producción.
4. **Sábado** — Round-up de feedback, decisión de qué entra al release y qué va a backlog.
5. **Domingo (01/06)** — Sign-off interno. Si todo verde, release público se mantiene para 04/06.

---

## 6. Criterios de "listo para release público"

Solo se anuncia al gym entero cuando:

- [ ] Cero bugs P0 abiertos
- [ ] Cero bugs P1 abiertos relacionados con onboarding o carga de predicción
- [ ] Al menos 7 de 10 beta testers cargaron predicciones completas de fase de grupos
- [ ] Al menos 5 de 10 publicaron algo en el muro
- [ ] Lighthouse mobile sigue ≥ 90 Performance, = 100 Accessibility
- [ ] `docs/DEPLOY_CHECKLIST.md` 100% chequeado
- [ ] Nahuel firma OK (decisión final de release)

---

## 7. Post-beta — qué hacer con el feedback

### Lo que entra al MVP (semana del 02/06–04/06)
- Bugs P0/P1
- Fixes de copy si generaron confusión
- Ajustes menores de UI que afecten primera impresión

### Lo que va a backlog post-MVP
- Features nuevas que pidieron pero no eran del scope original
- Mejoras nice-to-have sin impacto en retención
- Cambios de diseño grandes

Mover lo de backlog a un GitHub Project o issue con label `post-mvp`.

---

## 8. Comunicación al lanzar (post-beta exitosa)

Una vez sign-off OK, ver `docs/DEPLOY_CHECKLIST.md` §Comunicación al lanzar:
- Cartelería en el gym con QR
- Anuncio en clases la semana del 11/06
- FAQ interna lista para el staff

---

*Mantenimiento de este doc: actualizar la tabla de §1, la bitácora de §4 y los chequeos de §6 a medida que avanza la beta. Al terminar, archivar este doc con el resultado final.*
