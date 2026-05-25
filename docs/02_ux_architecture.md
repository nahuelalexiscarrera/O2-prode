# O2 PRODE — Arquitectura UX

**Agente 2 · UX Architect**
Versión 1.0 · 2026-05-18
Input: `01_product_strategy.md`
Output que consumirán los Agentes 3, 4, 7, 8, 9, 10, 11, 13

---

## 1. Marco rector

Este documento traduce la estrategia del Agente 1 en **estructura accionable**: cómo se organiza la app, cómo se mueve el usuario por ella, cuándo se le habla, cómo se cuentan los puntos, qué pasa cuando algo falla y qué momentos de juego construyen identidad.

Toda decisión que tome el Agente 4 (UI) debe poder rastrearse a una decisión de este documento. Si una decisión visual no tiene contraparte aquí, hay un gap de arquitectura.

---

## 2. Arquitectura de Información

### 2.1 Modelo conceptual

La app se organiza en **5 dominios de información** que mapean 1:1 con los 5 ítems de la bottom navigation. Esto es deliberado: un usuario debe poder predecir el contenido de cada tab con solo leer el ícono.

```
┌─────────────────────────────────────────────────────────────┐
│                       O2 PRODE                              │
├──────────┬───────────┬───────────┬───────────┬─────────────┤
│  Inicio  │   Prode   │  Ranking  │   Muro    │   Perfil    │
├──────────┼───────────┼───────────┼───────────┼─────────────┤
│ Resumen  │ Acción    │ Competen- │ Comuni-   │ Identidad   │
│ + Próx.  │ principal │ cia       │ dad       │ + Historia  │
│ partido  │ del día   │ social    │ activa    │ personal    │
└──────────┴───────────┴───────────┴───────────┴─────────────┘
```

### 2.2 Jerarquía de contenido (lo más importante arriba)

**Tab Inicio:**
1. Estado del usuario (posición + puntos) — primer pantallazo
2. Próximo partido + CTA de predicción — la acción del día
3. Progreso del torneo (visualización de fases) — situarse en el tiempo
4. Actividad reciente del muro — gancho social

**Tab Prode:**
1. Toggle Fase de grupos / Eliminatorias — selección de etapa
2. Pestañas Grupo A/B/C/D — navegación horizontal
3. Tarjetas de partido con score input — acción nuclear

**Tab Ranking:**
1. Podio top 3 — narrativa visual
2. Mi posición (highlighted) — autorreferencia obligada
3. Lista contextual ±5 de mi posición — competencia inmediata
4. Switch a ranking global / por fase / semanal

**Tab Muro:**
1. Toggle Destacados / Recientes
2. Card de post con interacciones
3. CTA flotante "+ Compartir mi prode"

**Tab Perfil:**
1. Identidad (foto + nombre + rol "Socio O2")
2. KPIs personales (posición + puntos + completitud)
3. Atajos a: predicciones, historial, logros, configuración

### 2.3 Información NO presente en la home (decisión consciente)

- **Live scores de partidos en curso** → no es una app de fútbol, es una app de prode. El partido se ve en otro lado, acá se predice.
- **Estadísticas detalladas de equipos** → fuera de scope; no enriquecen la predicción de socios casuales.
- **Calendario completo del Mundial** → se accede desde Prode, no compite con la home.

---

## 3. Sitemap

```
/                           Splash / Auth gate
├── /auth
│   ├── /login              Email + password (socio)
│   ├── /register           Invite code + datos básicos
│   ├── /forgot             Recuperación
│   └── /onboarding         Flow de bienvenida (3 pantallas)
│
├── /app                    [Auth-protected layout]
│   ├── /                   Inicio (Home Dashboard)
│   │
│   ├── /prode
│   │   ├── /grupos         Fase de grupos (default grupo A)
│   │   │   └── /[grupo]    Vista de grupo individual (A/B/C/D)
│   │   ├── /eliminatorias  Bracket de eliminatorias
│   │   │   └── /[fase]     Octavos / cuartos / semis / final
│   │   └── /predicciones   Predicciones especiales (campeón, goleador)
│   │
│   ├── /ranking
│   │   ├── /               Ranking global (default)
│   │   ├── /semanal        Ranking de la semana en curso
│   │   └── /fase           Ranking por fase del torneo
│   │
│   ├── /muro
│   │   ├── /               Feed (destacados/recientes)
│   │   ├── /post/[id]      Detalle de post + comentarios
│   │   └── /componer       Componer nuevo post
│   │
│   ├── /perfil
│   │   ├── /               Vista de identidad
│   │   ├── /mis-predicciones
│   │   ├── /historial      Histórico de aciertos/fallos
│   │   ├── /logros         Logros desbloqueados + por desbloquear
│   │   └── /configuracion
│   │
│   ├── /partido/[id]       Detalle de partido (modal/sheet)
│   ├── /usuario/[id]       Perfil de otro socio
│   ├── /compartir/[type]   Share screen (prode | ranking | logro)
│   └── /notificaciones     Centro de notificaciones
│
└── /(modals)               Layout group para sheets/modals
    ├── /score-input        Modal de entrada de score
    ├── /comment            Modal de comentario
    └── /share              Modal de share multi-canal
```

### Notas de routing
- Toda ruta bajo `/app` requiere sesión.
- Los modales se gestionan con route groups + intercepting routes de Next.js App Router (Agente 7 detalla).
- Las URLs son shareables: `/usuario/123` debe abrirse desde un share externo.

---

## 4. Modelo de Navegación

### 4.1 Bottom Navigation (siempre visible en `/app/**`)

| Slot | Label | Ícono | Default route | Permanece visible en |
|---|---|---|---|---|
| 1 | Inicio | home | `/app` | Todas las top-level |
| 2 | Prode | award/check-square | `/app/prode/grupos` | Idem |
| 3 | Ranking | bar-chart | `/app/ranking` | Idem |
| 4 | Muro | message-square | `/app/muro` | Idem |
| 5 | Perfil | user | `/app/perfil` | Idem |

**Reglas:**
- El tab activo se resalta con color primario.
- Tocar el tab de la pestaña en la que ya estás → scroll-to-top + refresh suave.
- La bottom nav se oculta solo en: modals fullscreen (Share, Score input expandido) y onboarding.

### 4.2 Headers contextuales

- **Tabs principales:** header minimal con avatar + saludo + bell (notificaciones).
- **Sub-pantallas:** header con back arrow + título + acción opcional (compartir, settings).
- **Modales:** header con close (X) y acción primaria.

### 4.3 Gestos
- Swipe-back desde borde izquierdo → equivale a back arrow (alineado con iOS PWA).
- Swipe horizontal en Grupos (A→B→C→D) → cambio de tab.
- Pull-to-refresh en feed del muro y ranking.

---

## 5. User Flows Críticos

### Flow 1 — Onboarding (objetivo: 1ª predicción en ≤ 90s)

```
[Splash 2s]
     │
     ▼
[Pantalla 1: "Entrar"]
     │
     ├── Tap "Entrar" ────────────────► [Login]
     │                                       │
     │                                       ▼
     │                                  ¿Tiene cuenta?
     │                                       │
     │                            ┌──────────┴──────────┐
     │                            ▼                     ▼
     │                         [Sí: login]          [No: register]
     │                            │                     │
     │                            │                     ▼
     │                            │              [Invite code]
     │                            │                     │
     │                            │                     ▼
     │                            │              [Datos: nombre, foto]
     │                            │                     │
     │                            └─────────────────────┤
     │                                                  ▼
     │                                       [Onboarding 1/3: "Cómo funciona"]
     │                                                  │
     │                                                  ▼
     │                                       [Onboarding 2/3: "Predicción inicial"]
     │                                                  │
     │                                                  ▼
     │                                       [Onboarding 3/3: "Activá notifs"]
     │                                                  │
     │                                                  ▼
     ▼                                                 [HOME]
[Registrate] (CTA secundario)
```

**Reglas de oro:**
- Solo email + nombre obligatorios. Foto y bio son opcionales y se piden después.
- El invite code es obligatorio para registrarse → garantiza que solo socios entren.
- La 3ra pantalla del onboarding NO bloquea: si el usuario no acepta push, igual entra.
- Activación de la "predicción inicial" (campeón, goleador, finalista) → es opcional pero fuertemente sugerida. Si la skipea, se reseñala en home con un banner.

### Flow 2 — Predicción de Grupo (objetivo: cargar 6 partidos de un grupo en ≤ 60s)

```
[Home]
   │
   ▼
[Tap CTA "Ir a mi prode"]
   │
   ▼
[Prode › Fase de grupos › Grupo A] (default abierto)
   │
   ▼
[Lista de 6 partidos del grupo]
   │
   ▼
[Tap en score input del 1er partido]
   │
   ▼
[Numpad numérico modal sticky bottom]
   │
   ├── Cargar local
   ├── Cargar visitante
   │
   ▼
[Auto-save tras 600ms de inactividad]
   │
   ▼
[Indicador visual: ✓ guardado]
   │
   ▼
[Auto-focus en siguiente score]
   │
   ▼
... (repetir hasta cubrir el grupo)
   │
   ▼
[Swipe horizontal → Grupo B]
   │
   ▼
[Repetir]
```

**Reglas de oro:**
- **Sin botón "Guardar"**. El guardado es implícito y automático.
- El input nunca abre teclado del SO → numpad propio, controlable, predecible.
- Los partidos ya jugados (con resultado real) muestran badge "Cerrado" y son no-editables.
- Los partidos cuyo kickoff es en < 1h muestran lock con countdown.
- Indicador de progreso por grupo: "4 de 6 cargados".

### Flow 3 — Compartir Prode (objetivo: convertir un momento en viralidad)

```
[Cualquier pantalla con prode completo]
   │
   ▼
[CTA "Compartir" o "+ Compartir mi prode" flotante]
   │
   ▼
[Modal fullscreen: Compartí tu prode]
   │
   ▼
[Card visual "Mi Prode Mundial 2026" (preview)]
   │
   ├── Variantes de template (carrusel horizontal):
   │   ├── Template 1: Resumen general (campeón + goleador + final)
   │   ├── Template 2: Ranking actual + posición
   │   ├── Template 3: Predicción específica de un partido
   │
   ▼
[4 CTAs equidistantes abajo]
   │
   ├── [Descargar] → guarda PNG en device
   ├── [Instagram] → abre IG con imagen pre-cargada (Stories)
   ├── [WhatsApp] → abre WA con imagen + texto pre-cargado
   └── [Compartir] → sheet nativo del SO
```

**Reglas de oro:**
- La imagen se genera **server-side** (Edge function que renderiza canvas) para garantizar calidad consistente.
- La imagen incluye **marca O2 sutil** en una esquina + hashtag #PRODEMUNDIALO2.
- La pantalla se diseña para ser **screenshot-worthy aunque el usuario no use ningún CTA**: el solo hecho de hacer screenshot ya es viral.

### Flow 4 — Ver Ranking y Posicionarse

```
[Bottom nav › Ranking]
   │
   ▼
[Default: Ranking global]
   │
   ▼
[Podio (top 3) animado]
   │
   ▼
[Lista expandible ±5 de mi posición]
   │
   ▼
[Mi fila destacada con borde primario]
   │
   ├── Tap en avatar de otro socio → /usuario/[id]
   ├── Tap en mi fila → /perfil
   │
   ▼
[Swipe up → ver ranking completo en scroll infinito]
   │
   ▼
[Top header tabs: Global | Semanal | Por fase]
```

**Reglas de oro:**
- Mi posición SIEMPRE visible en pantalla (sticky bottom card si estoy fuera del fold).
- Animación de "cómo cambió mi posición esta semana" en la entrada (↑3 / ↓2 / =).
- Cuando estoy en top 3, el podio me hace zoom adicional.

### Flow 5 — Postear y Reaccionar en el Muro

```
[Bottom nav › Muro]
   │
   ▼
[Toggle: Destacados | Recientes]
   │
   ▼
[Feed scrolleable de cards]
   │
   ├── Tap en corazón ────► Reacción +1 (optimistic UI)
   ├── Tap en comentario ──► /muro/post/[id]
   ├── Tap en share ───────► Modal de compartir post
   │
   ▼
[CTA flotante "+ Compartir mi prode"]
   │
   ▼
[/muro/componer]
   │
   ├── Texto libre (límite 280 chars)
   ├── Opción: anexar mi prode actual (genera card visual)
   ├── Opción: anexar partido específico
   │
   ▼
[Tap "Publicar"]
   │
   ▼
[Post aparece arriba del feed con animación de entrada]
```

**Reglas de oro:**
- Optimistic UI en reacciones: el corazón cambia ANTES de la confirmación del servidor.
- Posts NO se pueden editar después de publicar (evita drama). Sí se pueden borrar.
- Comentarios: máximo 280 chars. Sin threads anidados (1 nivel de respuesta máximo).
- Sin "share count" público — solo el autor lo ve. Evita ansiedad social.

### Flow 6 — Recibir Notificación Push y Volver

```
[Usuario fuera de la app]
   │
   ▼
[Push: "Argentina vs Japón en 2hs. ¿Ya predijiste?"]
   │
   ▼
[Tap en push]
   │
   ▼
[Deep-link a /app/prode/grupos/[grupo de Argentina]]
   │
   ▼
[Auto-scroll al partido de Argentina]
   │
   ▼
[Numpad abierto en score input]
   │
   ▼
[Carga score, auto-save]
   │
   ▼
[Toast "¡Listo! Suerte con tu prode."]
   │
   ▼
[Usuario queda en la app, puede seguir explorando]
```

**Regla de oro:** El push **nunca lleva a home**, siempre lleva al sub-screen accionable más cercano.

---

## 6. Estados de Pantalla

Cada pantalla del producto debe contemplar **5 estados base**. Si una pantalla no los tiene definidos, está incompleta.

### 6.1 Loading State
- **Skeleton screens** (no spinners centrados).
- Skeleton respeta layout final: cards grises animados con shimmer suave.
- Duración esperada: < 500ms en buena red, < 2s en red lenta. Si excede, mostrar mensaje.

### 6.2 Empty State
- **Tono motivador**, no técnico. Mucha personalidad.
- Ejemplo Muro vacío: "Acá no hay nada todavía. Animate vos a postear primero."
- Ejemplo Predicciones vacías: "Todavía no cargaste predicciones. Empezá por el Grupo A 👇".
- Ilustración minimal (línea, no relleno).

### 6.3 Locked State
- Visual: ícono de candado primario + texto contextual.
- Mensaje claro: "Octavos de final disponibles el 30 de junio."
- NO bloquea la navegación: el usuario puede explorar la sección, ve la estructura, pero no interactúa.
- Si hay countdown, mostrarlo: "Faltan 12 días, 4 horas."

### 6.4 Error State
- Distinción crítica: error de red ≠ error de negocio ≠ error catastrófico.
- **Red:** "Sin conexión. Tus predicciones se sincronizan cuando vuelva la señal."
- **Negocio:** "Este partido ya cerró. No podés modificar el score."
- **Catastrófico (500):** "Algo se rompió de nuestro lado. Ya lo estamos viendo."
- Siempre hay un CTA: reintentar, volver, reportar.

### 6.5 Success/Confirmation State
- Toast no intrusivo (top, no center).
- Duración 2s.
- Tono celebrante en momentos clave: "🎯 6 de 6 acertados en el Grupo A."

### 6.6 Edge cases especiales

| Pantalla | Estado especial | Comportamiento |
|---|---|---|
| Predicción de partido en vivo | Lock automático al kickoff | El score se "congela" y aparece badge "En vivo" |
| Ranking durante recálculo | Estado "actualizando" | Skeleton sobre filas; valor anterior visible debajo, en gris |
| Muro durante moderación | Post oculto al autor también | Mensaje "Tu post está siendo revisado" (futuro, no MVP) |
| Logro desbloqueado | Modal de celebración fullscreen | Interrumpe el flow una sola vez, con animación |

---

## 7. Reglas de Scoring

Estas reglas son **producto**, no técnica. Son la base de la confianza del usuario. El Agente 9 (Game Logic) las implementa, pero las **define este documento**.

> **Nota de calibración (confirmado por Nahuel 2026-05-18):** Scoring AGRESIVO. La diferencia entre acertar fino y zafar debe sentirse fuerte. La final debe tener peso dramático.

### 7.1 Puntos por predicción individual

| Tipo de acierto | Puntos base | Aplica en |
|---|---|---|
| Resultado exacto (3-1 dijiste, 3-1 fue) | **8 pts** | Grupos + eliminatorias |
| Acierto de ganador (dijiste X, X ganó pero score distinto) | **3 pts** | Grupos + eliminatorias |
| Acierto de empate sin score exacto | **1 pt** | Solo grupos |
| Diferencia de gol acertada sin score exacto (bonus) | **+2 pts** | Grupos + eliminatorias |
| No predicción / fuera de plazo | **0 pts** | — |

### 7.2 Multiplicadores por fase (agresivos)

| Fase | Multiplicador | Score exacto vale |
|---|---|---|
| Fase de grupos | **x1** | 8 pts |
| Octavos de final | **x2** | 16 pts |
| Cuartos de final | **x3** | 24 pts |
| Semifinales | **x4** | 32 pts |
| Final | **x5** | **40 pts** |

Implementación: `puntos_finales = puntos_base × multiplicador_fase`.

**Implicancia psicológica:** acertar el resultado exacto de la final solo, suma 40 pts. Esto significa que el podio se puede definir en un único partido — el último. Es deliberado: mantiene tensión narrativa hasta el final.

### 7.3 Predicciones especiales (one-shot, antes del 11 jun)

| Predicción | Puntos si acierta |
|---|---|
| Campeón del Mundial | **40 pts** |
| Subcampeón | **20 pts** |
| Goleador del torneo | **30 pts** |
| Mejor selección de fase de grupos | **15 pts** |
| Equipo revelación (sorpresa que pasa de grupo) | **15 pts** |

Estas predicciones se hacen UNA SOLA VEZ y se cierran al inicio del torneo.

### 7.4 Bonus de constancia y dominio

- **Racha de 7 días seguidos con predicción cargada:** **+10 pts**
- **Racha extendida (cada 7 días adicionales):** **+15 pts** acumulativo
- **Grupo entero acertado al menos en ganador:** **+5 pts** por grupo
- **Grupo entero con ≥3 resultados exactos:** **+10 pts** (gran bonus)
- **Jornada perfecta (4 partidos del día acertados en ganador):** **+8 pts**
- **Predijiste antes del cierre las 4 fases eliminatorias completas:** **+20 pts**
- **Pleno de un cruce eliminatorio (acertaste todos los partidos de octavos):** **+25 pts**

### 7.5 Penalización por inactividad (suave)

- **Si no cargás predicción en ≥ 3 partidos seguidos:** se aplica **-2 pts** al ranking semanal (no al global). Esto incentiva participación sin castigar olvidos puntuales.

> Decisión de diseño: la penalización aparece solo en el ranking semanal para no romper el ánimo del usuario que tuvo una mala semana. El ranking global premia constancia positiva.

### 7.6 Ejemplo trabajado (transparencia con el usuario)

> **Caso 1 — Predicción de fase de grupos**
> Predicción: Argentina 2 - 1 Brasil
> Resultado real: Argentina 3 - 1 Brasil
> Cálculo:
> - Acierto de ganador: 3 pts
> - Diferencia de gol acertada (1 gol): +2 pts
> - Subtotal base: 5 pts
> - Multiplicador grupos: x1
> - **Total: 5 pts**

> **Caso 2 — Acierto exacto en la final**
> Predicción: Argentina 2 - 1 Brasil (Final)
> Resultado real: Argentina 2 - 1 Brasil
> Cálculo:
> - Acierto exacto: 8 pts
> - Multiplicador final: x5
> - **Total: 40 pts**

> **Caso 3 — Jornada perfecta + racha activa**
> Predijiste correctamente al ganador en los 4 partidos del día Y mantenés racha de 14 días:
> - 4 × 3 pts (ganador) = 12 pts
> - Bonus jornada perfecta: +8 pts
> - Bonus racha extendida (14 días): +15 pts
> - **Total del día: 35 pts**

Esta vista de "cómo se calcularon mis puntos" debe estar disponible en el detalle de cada predicción del historial. **Transparencia = confianza.**

---

## 8. Reglas de Locks (cuándo se cierra qué)

| Evento | Lock |
|---|---|
| 1h antes del kickoff de un partido | Score de ese partido se vuelve no-editable |
| Inicio del torneo (11 jun 2026) | Predicciones especiales (campeón, goleador) se cierran |
| Inicio de cada fase eliminatoria | Predicciones de esa fase se abren (estaban locked antes) |
| Cierre del torneo (19 jul 2026) | Toda predicción se cierra |

**Display:**
- Locks futuros: ícono de candado + countdown.
- Locks pasados: ícono de check + badge "Cerrado".
- En vivo: ícono de play + label "En vivo".

---

## 9. Mapa de Notificaciones

### 9.1 Inventario completo

| ID | Trigger | Canal | Copy (referencia, finaliza Agente 13) | Deep-link |
|---|---|---|---|---|
| N01 | Onboarding incompleto > 24h | Push | "Tu prode te espera. Cargá tus primeras predicciones." | /onboarding |
| N02 | Próximo partido importante en 2h | Push | "Argentina vs X en 2h. ¿Listo tu prode?" | /prode/grupos/[g] |
| N03 | Inicio de fase nueva | Push | "Empiezan los octavos. Sumá puntos x1.5." | /prode/eliminatorias |
| N04 | Resultado de partido procesado | Push | "Ganaste 5 pts en Argentina vs X. Subiste 2 posiciones." | /perfil/historial |
| N05 | Reacción en mi post | In-app + Push | "A Martín le gustó tu prode." | /muro/post/[id] |
| N06 | Comentario en mi post | In-app + Push | "Lucas comentó tu prode." | /muro/post/[id] |
| N07 | Logro desbloqueado | In-app modal + Push | "🏆 Logro desbloqueado: Racha de 7 días." | /perfil/logros |
| N08 | Estás a < 5 pts del podio | Push (sin acumular) | "Estás a 3 pts del podio. ¿Qué predicción ajustarías?" | /ranking |
| N09 | Cambio de posición ≥ 3 | In-app | "Subiste 4 posiciones esta semana." | /ranking |
| N10 | Resumen semanal (domingo 20hs) | Push + In-app digest | "Tu semana: 23 pts, 5 aciertos, posición #8." | /perfil |
| N11 | Cierre del torneo | Push masivo | "Terminó el Mundial. Mirá tu resumen." | /compartir/final |
| N12 | Recordatorio share de prode inicial | Push (D-3 antes del Mundial) | "El Mundial arranca en 3 días. ¿Compartiste tu prode?" | /compartir/prode |

### 9.2 Reglas de antipatrón

- **Máximo 1 push por día** por usuario, salvo M5 (cierre final).
- Las notificaciones in-app NO interrumpen flow activo (no abren modal si el usuario está cargando un score).
- Centro de notificaciones (`/notificaciones`) acumula histórico. Se marcan leídas al verlas.
- Usuario puede deshabilitar canales granulares en `/perfil/configuracion`.

### 9.3 Prioridades
1. **Crítico (siempre):** N04 (resultado), N07 (logro), N11 (cierre).
2. **Alto (default on, opt-out):** N02 (próximo partido), N05/N06 (social).
3. **Medio (default on):** N03, N08, N10.
4. **Bajo (default off):** N09, N12.

---

## 10. Sistema de Gamificación

### 10.1 Filosofía
La gamificación NO se basa en dopamina cheap (puntos arbitrarios + animaciones ruidosas). Se basa en **señales de competencia legítimas**: rachas, aciertos finos, constancia, sociabilidad.

### 10.2 Achievements (logros) — categorías

#### Categoría: Aciertos (skill)
| ID | Logro | Trigger |
|---|---|---|
| A01 | El que sabe | Acertar 5 resultados exactos seguidos |
| A02 | Visionario | Acertar campeón antes del torneo |
| A03 | Mufa controlada | Acertar un upset (no-favorito gana) |
| A04 | Pleno | Acertar TODOS los partidos de un grupo |
| A05 | Eliminator | Acertar todos los cruces de octavos |

#### Categoría: Constancia (dedication)
| ID | Logro | Trigger |
|---|---|---|
| C01 | Constante | 7 días seguidos con predicción cargada |
| C02 | Maratonista | 21 días seguidos |
| C03 | Todoterreno | Cargaste el 100% del torneo |
| C04 | Madrugador | Cargaste un grupo completo el 1er día disponible |

#### Categoría: Social (community)
| ID | Logro | Trigger |
|---|---|---|
| S01 | Inicio fuerte | Primer post en el muro |
| S02 | Popular | 10 reacciones en un solo post |
| S03 | Embajador | Compartiste 5 prodes externamente |
| S04 | Conector | Comentaste en 10 posts distintos |
| S05 | Tribu | Tus 3 mejores amigos del gym también activaron la app |

#### Categoría: Posición (competition)
| ID | Logro | Trigger |
|---|---|---|
| P01 | Top 10 | Llegaste al top 10 |
| P02 | Podio | Llegaste al top 3 |
| P03 | Líder | Liderás el ranking |
| P04 | Remontada | Subiste >10 posiciones en una semana |
| P05 | Campeón | Ganador final del torneo |

### 10.3 Visualización
- Logros tienen 3 estados: **bloqueado** (silueta + interrogante), **en progreso** (con barra), **desbloqueado** (en color + fecha).
- Modal de celebración SOLO en desbloqueo. No es interrumpido por logros menores (filtro por nivel de impacto).
- Tab `/perfil/logros` muestra todos, agrupados por categoría.

### 10.4 Niveles del socio (progresión global)
| Nivel | Nombre | Umbral |
|---|---|---|
| 1 | Rookie | 0-50 pts |
| 2 | Aplicado | 51-150 pts |
| 3 | Pro | 151-300 pts |
| 4 | Crack | 301-500 pts |
| 5 | Leyenda O2 | 501+ pts |

El nivel se muestra en el avatar (badge sutil) y en el perfil.

---

## 11. Lógica de Predicciones Compartidas (Viral)

Cada vez que un socio comparte algo, se genera una **card visual con metadata** que incluye:

- Tipo de share: `prode_inicial | prode_actual | partido_individual | ranking | logro`
- Marca de tiempo
- Identidad del usuario (foto + nombre + nivel)
- Branding O2 sutil pero presente
- Hashtag #PRODEMUNDIALO2
- URL corta `o2prode.app/u/[id]` (futuro, no MVP) que lleva al perfil público del socio

Esta card es el artefacto viral. El Agente 5 detalla el diseño visual.

---

## 12. Reglas de Diseño Comunes (a respetar por todos los agentes downstream)

### Sobre la información
1. Lo importante a la izquierda y arriba (en pantalla LTR).
2. Números grandes son señal de estatus → tipografía Bebas/Anton para puntos, posiciones, scores.
3. Iconografía consistente: una sola familia (Lucide, recomendado).

### Sobre la interacción
4. Toda acción crítica tiene confirmación visual (toast, animación, badge).
5. Toda interacción debe responder en < 100ms con feedback visual (incluso si la respuesta del servidor tarda).
6. Cero modales bloqueantes salvo en logros desbloqueados (M5 y similares).

### Sobre la accesibilidad
7. Tap targets ≥ 44x44 px.
8. Contraste mínimo WCAG AA (Agente 12 audita).
9. Ningún flujo crítico depende solo de color (siempre hay un texto o ícono que lo respalda).
10. Soporte motion-reduce: animaciones cinéticas se reducen a fade.

---

## 13. Decisiones que Cierra Este Documento

| # | Decisión cerrada | Implicancia downstream |
|---|---|---|
| UX-D1 | Bottom nav de 5 ítems, todos los dominios principales son tabs | Agente 7 implementa layout `/app` con tab bar fijo |
| UX-D2 | Auto-save sin botón "Guardar" en score input | Agente 4 diseña numpad sticky bottom; Agente 9 implementa debounce de 600ms |
| UX-D3 | Predicciones especiales (campeón/goleador) son one-shot pre-torneo | Agente 8 modela `SpecialPrediction` aparte; UI distinta |
| UX-D4 | Scoring AGRESIVO: exacto 8 / ganador 3 / empate 1 / bonus diferencia +2 / multiplicadores x1→x5 / penalización suave -2 por inactividad semanal | Agente 9 implementa con tests unitarios extensivos. La final vale 40 pts exactos, define el podio. |
| UX-D5 | Sistema de niveles 1-5 (Rookie a Leyenda O2) | Agente 11 implementa thresholds; Agente 4 diseña badge |
| UX-D6 | Achievements en 4 categorías (Skill / Constancia / Social / Posición) | Agente 11 implementa; Agente 4 diseña tarjetas de logro |
| UX-D7 | 12 notificaciones inventariadas con copy de referencia | Agente 13 finaliza copy; Agente 7 implementa edge functions de push |
| UX-D8 | Locks de partido a 1h del kickoff (no al kickoff exacto) | Agente 9 implementa cutoff time |
| UX-D9 | Sin threads anidados en comentarios (1 nivel max) | Agente 10 simplifica data model |
| UX-D10 | Imagen viral generada server-side, no client-side | Agente 7 prepara endpoint; Agente 5 diseña templates SVG/Canvas |

---

## 14. Hipótesis a validar antes del Agente 4

Reitero del Agente 1 + agrego una nueva:
- **H1 (del A1):** Preferencia por ranking interno del gym vs global.
- **H4 (del A1):** Batch prediction de grupo entero vs partido-por-partido.
- **H5 (nueva):** El multiplicador x1.5/x2/x2.5/x3 se entiende intuitivamente o necesita explicación en cada fase.
- **H6 (nueva):** Los logros importan a los socios o son ruido para ellos.

Recomendación: validar con 5 socios antes de UI.

---

## 15. Próximo paso

**Agente 3 — Design System** recibe este documento como input y produce:
- Design tokens (color, type, spacing, radius, shadow, motion)
- Tailwind config
- Inventario de componentes primitivos y compuestos
- Reglas de composición y casos de uso

---

*Fin Agente 2 — Listo para checkpoint del usuario.*
