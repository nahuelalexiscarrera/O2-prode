# PHASE REPORT BRIEF — Workflow automatizado de reporte de actividad por fase

> Brief auto-contenido para implementar. Incluye motor de métricas, endpoint, trigger por cierre de fase, generación de imagen PNG y envío por email al staff O2. **Solo O2** en esta primera iteración; los 5 tokens de marca quedan como constante para migrar a `brand_config` cuando llegue un segundo cliente.
>
> Decisión cerrada el 2026-06-28 con Nahuel, sobre el guión `guion_reporte_eliminatorias.pdf`. Cadencia: al cierre de cada fase del Mundial (no semanal calendar). Distribución: email al staff con cuerpo HTML + imagen del reporte adjunta. Ganadores de premios: nueva tabla admin `prize_award`.

---

## 1. Qué se construye

Un workflow que, cuando el último match de una fase (grupos, octavos, cuartos, semis, final) queda con `match_result`, calcula todas las métricas del período de esa fase, renderiza un reporte HTML+PNG siguiendo el guión ejecutivo (≤1 minuto de lectura, 8 bloques, 5 tokens de marca) y lo envía por email al equipo O2. Solo O2 por ahora; multi-marca queda parametrizado para más adelante.

---

## 2. Decisión arquitectónica

**¿Por qué disparar por cierre de fase y no cron time-based?**
Nahuel eligió esta cadencia porque las fases del Mundial son los hitos naturales del producto — un reporte semanal fijo mandaría 6-8 reportes y muchos con poca variación. Un reporte por cierre de fase manda ~5 reportes en total, cada uno con un ΔKPIs significativo.

**¿Por qué email y no dashboard admin?**
Nahuel pidió "email al equipo con contenido de texto e imagen para consumo rápido". El staff O2 no vive en el panel admin — vive en el mail. Empujar a bandeja de entrada > pull desde admin. El HTML persiste en Supabase Storage para consulta posterior, pero el punto de contacto principal es el mail.

**¿Por qué `@vercel/og` para el PNG y no Puppeteer?**
El stack ya tiene `@vercel/og` para las share cards del muro. Es Satori + Resvg, corre en Edge Runtime, arranca en milisegundos y no requiere Chrome headless. Puppeteer sería overkill y agrega un lambda pesada. Reusamos el motor de share, con un template más grande.

**Alternativas descartadas:**
- **Cron semanal fijo:** demasiados reportes con poca variación entre semanas de la misma fase (grupos dura 3 semanas).
- **Puppeteer + Chromium:** lambda gorda, cold start alto, exceso técnico para un PNG.
- **Solo dashboard admin:** el staff no entra al admin regularmente. El mail es el touchpoint.
- **Multi-marca desde el arranque:** confirmado por Nahuel que se posterga.

---

## 3. Componentes

### `supabase/migrations/YYYYMMDD_prize_award.sql`

Nueva tabla admin-only para registrar premios entregados. Referenciada por el bloque 6 del reporte.

```sql
CREATE TABLE public.prize_award (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase       tournament_phase NOT NULL,             -- enum ya existente
  position    smallint NOT NULL CHECK (position BETWEEN 1 AND 10),
  user_id     uuid NOT NULL REFERENCES public.user(id),
  prize_label text NOT NULL,                          -- ej. "1 mes O2 gratis"
  awarded_at  timestamptz NOT NULL DEFAULT now(),
  awarded_by  uuid REFERENCES auth.users(id),
  notes       text
);

ALTER TABLE public.prize_award ENABLE ROW LEVEL SECURITY;

-- Solo admins leen/escriben
CREATE POLICY "prize_award_admin_all" ON public.prize_award
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

CREATE INDEX prize_award_phase_idx ON public.prize_award (phase, position);
```

### `lib/reports/phase/branding.ts`

Los 5 tokens del §6 del guión, hardcodeados para O2. Cuando llegue el segundo cliente se migra a tabla `brand_config`.

```ts
export const O2_BRAND = {
  accentColor: "#FF6A00",        // Naranja O2 del DS
  bgColor: "#0B0B0D",             // dark mode
  displayFont: "Anton",           // ya cargada via next/font
  bodyFont: "Inter",              // ya cargada
  logoUrl: "/design/logo-o2.svg", // en public/
  productName: "PRODE O2",
  footerLabel: "PRODE O2 · Mundial 2026",
} as const;

export type BrandTokens = typeof O2_BRAND;
```

### `lib/reports/phase/computeMetrics.ts`

Función pura server-side. Recibe la fase a reportar; devuelve un objeto tipado con todos los datos del reporte. Consulta directa a Supabase read-only.

```ts
export interface PhaseMetrics {
  phase: TournamentPhase;
  phaseLabel: string;                      // "Fase de grupos" | "Octavos" | ...
  periodStart: string;                     // ISO date primer match de la fase
  periodEnd: string;                       // ISO date último settle
  weekLabel: string;                       // "del 11 al 27 de junio"
  headlineSummary: string;                 // "Fase de grupos cerrada con 55,9% de acierto."

  // Bloque 2 — KPIs con delta vs fase anterior
  kpis: {
    activeUsers: { current: number; delta: number };        // delta absoluto
    predictionsLoaded: { current: number; delta: number };
    newUsers: { current: number; delta: number };
    participation: { current: number; delta: number };       // %
  };

  // Bloque 3 — Interacción semana a semana dentro de la fase
  weeklyInteraction: Array<{ weekLabel: string; activeUsers: number }>;

  // Bloque 4 — Nuevos usuarios por semana + acumulado del torneo
  weeklyNewUsers: Array<{ weekLabel: string; count: number; cumulative: number }>;

  // Bloque 5 — Predicciones por semana + promedio por activo
  weeklyPredictions: Array<{ weekLabel: string; count: number }>;
  avgPredictionsPerActive: number;

  // Bloque 6 — Ganadores (viene de prize_award)
  winners: Array<{
    position: number; name: string; prize: string; phaseLabel: string;
  }>;

  // Bloque 7 — Secundarios
  accuracyPercent: number;                 // % de acierto total en la fase
  userTypeBreakdown: {
    new: number; recurrent: number; power: number;         // conteos absolutos
  };
  branchBreakdown: Array<{ branch: string; count: number; percent: number }>;

  // Bloque 8 — Cierre (deriva de la fase actual, ver renderHTML)
  nextPhaseLabel: string | null;           // "cierre de octavos" | null si es final
}
```

Reglas de derivación:
- `userTypeBreakdown.new`: `joined_at` dentro del período de la fase
- `userTypeBreakdown.recurrent`: activo en la fase + `joined_at` antes del inicio
- `userTypeBreakdown.power`: predicciones acumuladas >= P90 del torneo
- `avgPredictionsPerActive`: `predicciones_del_período / activos_del_período`
- `headlineSummary`: string armada con reglas simples (tercera fase consecutiva con crecimiento en X, cierre de octavos con Y participación, etc.). Ver `docs/PHASE_REPORT_HEADLINES.md` — TODO: crear archivo con las 5 headlines por fase pre-escritas o generadas con template.
- Los deltas se calculan contra la fase anterior; para la primera fase (grupos) los deltas son `null` y no se renderiza el ▲/▼.

### `lib/reports/phase/renderHTML.ts`

Templating puro que consume `PhaseMetrics` + `BrandTokens` y devuelve el HTML final. **Todos los gráficos en SVG inline** — no depender de CDN externo, como en `reporte-metricas-2026-06-28.html`.

Regla estricta: **verde `--ok` para deltas positivos, gris `--muted` para deltas neutros/negativos**. Nunca rojo (regla del §2 del guión — "material a CEO").

### `lib/reports/phase/renderPNG.ts`

Usa `@vercel/og` (`ImageResponse` de Next.js) para producir un PNG del reporte a partir del mismo objeto `PhaseMetrics` + `BrandTokens`. El PNG es una versión compactada (1200×630, formato Twitter/OG card) enfocada en KPIs + headline + gráfico principal. **No es una captura del HTML** — es un layout Satori diseñado para preview rápido en cliente de mail.

Motivo: el HTML completo es largo para leer en preview de mail; la imagen resume los 3 datos que enganchan (activos, delta, headline) y sirve como thumbnail. El link al HTML completo va en el cuerpo del mail.

### `app/api/admin/phase-report/route.ts`

Endpoint POST, protegido con `Bearer CRON_SECRET`. Acepta body `{ phase: "groups" | "r16" | "qf" | "sf" | "final" }`.

Pipeline:
1. Llama `computeMetrics(phase)` → obtiene `PhaseMetrics`
2. Llama `renderHTML(metrics, O2_BRAND)` → obtiene string HTML
3. Llama `renderPNG(metrics, O2_BRAND)` → obtiene `Buffer` PNG
4. Sube el HTML a `supabase.storage.reports/phase/${phase}-${period}.html`
5. Sube el PNG a `supabase.storage.reports/phase/${phase}-${period}.png`
6. Manda mail al staff con:
   - Subject: `Reporte O2 PRODE — {phaseLabel} cerrada`
   - Body HTML: KPIs principales renderizados como texto (para clientes que bloquean imágenes) + PNG embebido inline + link al HTML completo
7. Registra el envío en tabla `phase_report_log` (crear como parte de la migration del punto anterior — timestamps + phase + recipients + success/error)

### `lib/reports/phase/triggerCheck.ts`

Función que corre dentro del cron ya existente de `settle-matches` (según los commits que vi en Vercel, ya hay un cron que evalúa resultados). Al cerrar un match, chequea: **¿este era el último match de una fase?** Si sí, dispara el endpoint del punto anterior.

```ts
export async function maybeTriggerPhaseReport(justSettledMatch: Match) {
  const phase = justSettledMatch.phase;
  const remaining = await countPendingMatches(phase);
  if (remaining === 0) {
    const alreadySent = await getPhaseReportLog(phase);
    if (!alreadySent) {
      await fetch(`${process.env.APP_URL}/api/admin/phase-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({ phase }),
      });
    }
  }
}
```

Idempotencia: `phase_report_log` es el gate. Si ya se mandó el reporte de esa fase, no se remanda.

### `app/(admin)/premios/page.tsx`

UI mínima para que el staff cargue premios entregados en `prize_award`. Un form con: fase (select), posición (número), user (autocomplete por nombre), prize_label (texto), notes (opcional). Tabla debajo con los premios ya cargados de esa fase.

Sin refinamientos: es admin-only, no necesita polish.

---

## 4. Integración

### En el cron existente de settle

```ts
// app/api/cron/settle-matches/route.ts (ya existente)
import { maybeTriggerPhaseReport } from "@/lib/reports/phase/triggerCheck";

// ... después del bloque que hace el settle:
if (settledMatch) {
  await maybeTriggerPhaseReport(settledMatch);
}
```

### En el bottom nav del admin

Agregar item "Premios" al menú del admin panel (si no existe uno, crearlo con `Reportes | Premios | Config`).

---

## 5. Secondary entry points

- **Dashboard admin — Reportes:** una lista de reportes generados (leyendo desde `phase_report_log` + storage), con link a HTML de cada uno. Vive en `/admin/reportes`. Trigger manual "Regenerar" por fase (útil si hay bug o cargaron premios después).
- **Home admin:** un banner con el último reporte generado ("Reporte de octavos disponible → Ver").

---

## 6. Copy

Cargar en `lib/i18n/es-AR.json` bajo key `reports.phase`:

```json
{
  "reports": {
    "phase": {
      "productName": "PRODE O2",
      "titleTemplate": "Reporte de actividad — {phaseLabel}",
      "periodTemplate": "{phaseLabel} · {periodStart} al {periodEnd}",
      "footer": "PRODE O2 · Mundial 2026",
      "kpiLabels": {
        "activeUsers": "Usuarios activos",
        "predictionsLoaded": "Predicciones cargadas",
        "newUsers": "Nuevos usuarios",
        "participation": "Participación"
      },
      "sections": {
        "interaction": "Interacción semana a semana",
        "newUsers": "Nuevos usuarios",
        "predictions": "Predicciones",
        "winners": "Ganadores de premios",
        "secondary": "Datos secundarios"
      },
      "contextPhrases": {
        "interactionGrowth": "La actividad creció todas las semanas desde el arranque de las eliminatorias.",
        "newUsersRegistration": "El registro sigue abierto y suma socios fecha a fecha.",
        "predictionsUsage": "No solo se registran: vuelven cada fecha a jugar.",
        "winnersProof": "Premios entregados, comunidad activa: la prueba de que el juego mueve gente."
      },
      "closing": {
        "afterGroups": "Seguimos optimizando la experiencia fecha a fecha. Próxima entrega: cierre de octavos.",
        "afterR16": "Seguimos optimizando la experiencia fecha a fecha. Próxima entrega: cierre de cuartos.",
        "afterQF": "Seguimos optimizando la experiencia fecha a fecha. Próxima entrega: cierre de semifinales.",
        "afterSF": "Seguimos optimizando la experiencia fecha a fecha. Próxima entrega: reporte final del torneo.",
        "afterFinal": "Cierre del Mundial 2026. Gracias por acompañar el torneo."
      },
      "email": {
        "subjectTemplate": "Reporte O2 PRODE — {phaseLabel} cerrada",
        "greeting": "Hola equipo,",
        "bodyIntro": "Cerró {phaseLabel} y ya está disponible el reporte de actividad.",
        "kpiIntro": "Titulares de la fase:",
        "linkLabel": "Ver reporte completo",
        "signOff": "PRODE O2"
      }
    }
  }
}
```

---

## 7. Reglas de oro (copy y comportamiento bloqueados)

Estas vienen del §0 del guión y no se improvisan:

> **Tono ejecutivo: confianza total y mejora continua. Sin condicionales ni "esperamos que".**
>
> **Verde para subas, neutro para bajas. Nunca rojo de "alarma" en material a CEO.**
>
> **Máximo 3 tamaños de letra por pantalla.**
>
> **Un color de acento + grises. Nada de arcoíris.**
>
> **Ninguna sección puede tener más de 1 idea. Si necesitás dos frases, sobra la segunda.**

Estas reglas viven en el guión y se referencian desde el CSS del renderHTML (comentario `// regla §0: solo 3 tamaños`) y desde el renderPNG.

---

## 8. Accesibilidad

Aplica al HTML (no al PNG, que es solo imagen):

- Los gráficos SVG llevan `role="img"` + `aria-label` con la lectura del dato ("Actividad de la semana 1: 1240 usuarios, subió 18%").
- Los KPI cards son `<article>` con `<h3>` para el número y `<p>` para la etiqueta.
- El delta ▲/▼ tiene `aria-hidden="true"` visualmente y su significado se codifica en el label textual ("subió 18%" / "sin cambios").
- Contraste: los tokens del DS ya cumplen WCAG AA. No inventar variantes.
- El email debe funcionar en Outlook/Gmail modo dark y light — usar tabla HTML clásica en el cuerpo, PNG como fallback visual.

---

## 9. Tests

Sobrio, no over-prescribir:

- **Vitest unit** en `computeMetrics.ts`: fixture de DB en memoria con datos conocidos → verificar los KPIs, deltas y `userTypeBreakdown` calculan bien.
- **Vitest snapshot** en `renderHTML.ts`: metrics fixture → HTML output snapshot. Para detectar cambios de copy involuntarios.
- **Playwright e2e** contra el endpoint: POST con `Bearer CRON_SECRET` → verificar que devuelve 200, que el HTML se subió a storage, que el mock del mail se disparó.
- **Test manual antes de release:** correr `phase-report` para `groups` (fase ya cerrada), verificar el mail que llega al staff.

---

## 10. Lo que NO se hace

- ❌ **Cron time-based semanal.** El trigger es por cierre de fase, no por calendario.
- ❌ **Puppeteer / Chromium headless.** Se usa `@vercel/og` (Satori).
- ❌ **Multi-marca ahora.** Los 5 tokens quedan hardcodeados en `O2_BRAND`. `TODO` para migrar a `brand_config` cuando llegue segundo cliente.
- ❌ **Dashboard con métricas en tiempo real.** El reporte es un artefacto estático por fase, no un tablero live.
- ❌ **Rojo para caídas.** El guión lo prohíbe explícitamente en material a CEO.
- ❌ **Ganadores de premios calculados automáticamente.** Los carga el staff en `prize_award` — coherente con el brief de premios (`docs/PRIZES_BRIEF.md`): "el staff O2 coordina la entrega por sus redes sociales". El reporte solo lee.
- ❌ **Envío por WhatsApp/Slack en esta iteración.** Solo email. WhatsApp queda para v2.
- ❌ **Enviar el reporte antes del cierre de la fase.** El trigger sólo dispara cuando `remaining === 0` matches pending en esa fase.
- ❌ **Reporte del cierre del torneo con hedging.** El copy del cierre del final es cierre en pasado, no "esperamos que".

---

## 11. Sprint y estimación

Encaja como **feature nueva post-Sprint 8** (beta cerrada ya lanzada). Estimación: **6–8 horas** de implementación + test manual con la fase de grupos (ya cerrada) antes de esperar la de octavos.

Pasos sugeridos en orden:

1. Migration `prize_award` + `phase_report_log` (30 min)
2. `lib/reports/phase/branding.ts` + `computeMetrics.ts` con tests de fixture (2 h)
3. `renderHTML.ts` con SVG inline siguiendo `reporte-metricas-2026-06-28.html` como base (1.5 h)
4. `renderPNG.ts` con `@vercel/og` (1 h)
5. `app/api/admin/phase-report/route.ts` con envío por Resend/SendGrid (según lo que ya use el proyecto) (1 h)
6. `triggerCheck.ts` + integración en cron de settle (30 min)
7. `app/(admin)/premios/page.tsx` UI mínima (1 h)
8. Test manual con fase groups: correr el endpoint, verificar HTML+PNG en storage, verificar mail (30 min)
9. Setear env var `REPORT_RECIPIENTS` (comma-separated) antes del primer disparo

**Pre-requisitos que no bloquean código pero sí el primer disparo:**
- Definir con el staff O2 la lista de emails que reciben el reporte
- Confirmar el provider de email que ya usa el proyecto (Resend, SendGrid, etc.)
- Confirmar dónde vive el logo de O2 en producción para embeberlo en el HTML+PNG

---

## 12. Prompt para arrancar

> Implementá el workflow del reporte de actividad por fase siguiendo `docs/PHASE_REPORT_BRIEF.md` al pie. El copy ya está en `lib/i18n/es-AR.json#reports.phase`. Empezá por la migration de `prize_award` + `phase_report_log`, después `computeMetrics.ts` con tests contra datos reales, después `renderHTML.ts` (mirar `reporte-metricas-2026-06-28.html` como referencia visual del estilo — SVG inline, cero deps externas). Cuando tengas HTML+PNG andando, integrá el trigger en el cron de settle existente y probá manual con la fase groups que ya está cerrada.

---

*Brief cerrado 2026-06-28 — listo para Claude Code.*
