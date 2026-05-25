# O2 PRODE — UX Copy Guide

**Agente 13 · UX Copy**
Versión 1.0 · 2026-05-19
Inputs: todos los agentes 1-12
Outputs:
- `docs/13_ux_copy.md` (este documento — guía de voz y tono)
- `lib/i18n/es-AR.json` (microcopy completo, machine-readable)

---

## 1. Voz y tono

**El producto le habla al usuario como un compañero del gym.** No como un servicio formal, no como un meme app. Cercano sin ser maleducado. Argentino sin ser chabacano.

### 1.1 Tres ejes del tono

| Eje | Inclinación | Ejemplo |
|---|---|---|
| **Formalidad** | Informal (voseo, sin "usted") | "Cargá tu prode" |
| **Familiaridad** | Familiar (asume confianza) | "Bien ahí" en lugar de "Felicitaciones" |
| **Energía** | Calmo, no eufórico | "Sumaste 5 pts" en lugar de "¡¡¡5 PUNTOS!!!" |

### 1.2 Reglas duras

1. **Voseo siempre.** "Cargá", "tenés", "podés", "querés". Nunca "tú" ni "tú tienes".
2. **Frases cortas.** Cap de 12 palabras por mensaje de UI. Si excede, partir en dos.
3. **Cero corporativo.** Nada de "Nuestro equipo está trabajando", "Estamos comprometidos", "Tu opinión es importante para nosotros".
4. **Cero exclamación gratuita.** Una sola exclamación es para momentos reales (logro, share final). Resto, punto o nada.
5. **Cero emojis en copy.** Los íconos del sistema reemplazan emoji decorativos (regla del proyecto).
6. **Acción primero.** "Cargá tu prode" mejor que "Es momento de cargar tu prode".
7. **No castigar.** Errores se expresan con propuesta de solución, no con culpa al usuario.

---

## 2. Glosario de palabras canónicas

Estas palabras se usan SIEMPRE igual en todo el producto:

| Concepto | Palabra canónica | NO usar |
|---|---|---|
| El acto de predecir | **cargar prode** | "apostar", "jugar", "votar" |
| El resultado individual | **predicción** | "voto", "apuesta", "pick" |
| El conjunto del usuario | **mi prode** | "mi quiniela", "mi pronóstico" |
| Subir en el ranking | **subir** | "escalar", "trepar" |
| Bajar | **bajar** | "caer", "descender" |
| Ganar puntos | **sumar puntos** | "ganar puntos", "obtener puntos" |
| Perder puntos | nunca aplica | (no hay puntos negativos) |
| Resultado de partido | **resultado** o **score** | "marcador" |
| Equipo / Selección | **selección** | "país", "team", "equipo" (en context de Mundial) |
| Logro | **logro** | "trofeo", "badge", "insignia" |
| Compañero del gym | **socio** | "miembro", "usuario", "fan" |
| Gimnasio | **el gym** o **el club** | "el lugar" |
| Compartir externo | **compartir** | "publicar", "postear afuera" |
| Postear en muro interno | **postear** | "subir post", "publicar" |
| Mundial | **el Mundial** | "el torneo" (salvo contexto post-MVP de otros) |

---

## 3. Patrones de copy

### 3.1 Empty states
**Estructura:** [Hecho actual del usuario] + [Propuesta concreta de acción].

- ✅ "Todavía no cargaste predicciones. Empezá por el Grupo A."
- ❌ "No tienes predicciones cargadas." (impersonal + no propone qué hacer)

### 3.2 Error messages
**Estructura:** [Qué pasó] + [Qué podés hacer].

- ✅ "Sin conexión. Tus predicciones se sincronizan cuando vuelva la señal."
- ❌ "Error 503: servidor no disponible." (técnico, no accionable)

### 3.3 Success / confirmation
**Estructura:** [Verbo en pasado simple] + opcional [stat o consecuencia].

- ✅ "Predicción guardada."
- ✅ "Sumaste 5 pts en Argentina vs Japón."
- ❌ "¡Éxito! Tu predicción ha sido guardada correctamente." (overkill)

### 3.4 Loading
**Idealmente: no hay copy de loading.** El skeleton es el "copy". Si hace falta texto (carga > 2s):
- ✅ "Cargando..."
- ❌ "Por favor espere mientras procesamos su solicitud" (formal + culpa al usuario por esperar)

### 3.5 Notifications (push + in-app)
**Estructura:** [Verbo en presente o pasado simple] + [Contexto puntual] + opcional [CTA implícito].

- ✅ "Argentina vs Japón en 2hs. ¿Listo tu prode?"
- ✅ "Sumaste 5 pts en Argentina vs Japón. Subiste 2 posiciones."
- ❌ "¡Hola! Te recordamos que en breve comienza el partido de Argentina." (saludo + verbo pasivo = lento)

---

## 4. Cómo se construye

El archivo `lib/i18n/es-AR.json` es la **fuente única de verdad** para todo el copy. Estructura jerárquica por dominio:

```
{
  "common": {...},
  "auth": {...},
  "onboarding": {...},
  "home": {...},
  "prode": {...},
  "knockout": {...},
  "ranking": {...},
  "wall": {...},
  "profile": {...},
  "share": {...},
  "notifications": {...},
  "achievements": {...},      // nombres + descripciones (mirror del catálogo)
  "toasts": {...},
  "emptyStates": {...},
  "lockedStates": {...},
  "errorStates": {...},
  "aria": {...},              // aria-labels para a11y (Agente 12)
  "meta": {...}
}
```

Los componentes consumen via helper:

```typescript
import t from "@/lib/i18n/es-AR.json";

<button>{t.common.continue}</button>
```

Para interpolación (variables):

```typescript
// "Sumaste {points} pts en {match}."
formatCopy(t.toasts.matchSettled, { points: 5, match: "Argentina vs Japón" })
```

---

## 5. Notificaciones (las 12 del Agente 2 §9)

Cada notificación tiene `{ title, body }`. La copy debajo está en el JSON.

| ID | Título | Body |
|---|---|---|
| N01 | Tu prode te espera | Cargá tus primeras predicciones del Mundial. |
| N02 | Próximo partido | {homeTeam} vs {awayTeam} en {time}. ¿Listo tu prode? |
| N03 | Empieza una nueva fase | Se desbloqueó {phaseName}. Multiplicador x{multiplier} activado. |
| N04 | Sumaste puntos | Ganaste {points} pts en {homeTeam} vs {awayTeam}. {delta}. |
| N05 | Tu post tiene reacción | A {userName} le gustó tu post. |
| N06 | Comentaron tu post | {userName} comentó tu post. |
| N07 | Logro desbloqueado | {achievementName}: {description} |
| N08 | Cerca del podio | Estás a {points} pts del top 3. |
| N09 | Cambio en tu ranking | {direction} {positions} posiciones esta semana. |
| N10 | Tu semana en el prode | Sumaste {points} pts y quedaste en el puesto {position}. |
| N11 | Terminó el Mundial | Mirá tu resumen del torneo. |
| N12 | Compartí tu prode | El Mundial arranca en 3 días. Mostrá tu predicción. |

---

## 6. Mensajes de error (clasificados)

### 6.1 Red / offline
- "Sin conexión. Tus cambios se sincronizan al reconectar."
- "Tardó mucho. Probá de nuevo en unos segundos."

### 6.2 Negocio
- "Este partido ya cerró. No podés modificar el score." (cuando intentás editar predicción post-lockout)
- "Las eliminatorias todavía no están disponibles. Disponibles el {date}." (acceso a fase locked)
- "Código inválido o ya usado." (invite code en register)
- "Email o contraseña incorrectos." (login)
- "Las contraseñas no coinciden." (register)
- "Ese email ya tiene una cuenta. ¿Querés iniciar sesión?" (register email duplicado)
- "Ese socio no acepta predicciones públicas." (acceso a perfil privado)

### 6.3 Sistema
- "Algo se rompió de nuestro lado. Ya lo estamos viendo."
- "No encontramos lo que buscás." (404)
- "Esta sección es solo para socios activos. Hablá con el gym." (no socio)

---

## 7. Reglas para los nombres de logros (mirror del catalog.ts)

Los nombres y descripciones de los 19 logros están en `lib/achievements/catalog.ts` (Agente 11). El JSON los mirrorea para que el copy pueda ser editado sin tocar TypeScript. Si hay discrepancia, el JSON manda en runtime para textos visibles; el catalog manda para lógica.

---

## 8. Próximo paso

**Agente 14 — QA & Performance** corre Lighthouse, audita bundles, verifica que el copy del JSON está completo (no faltan keys), valida que axe-core no encuentra issues nuevos vs Agente 12.

---

*Fin Agente 13 — Listo para checkpoint del usuario.*
