/**
 * O2 PRODE — Render HTML del reporte de fase (brief §5, §7, §8).
 *
 * Función PURA: PhaseMetrics + O2_BRAND + copy → string HTML autocontenido.
 * Todos los gráficos son SVG inline (cero deps externas / cero CDN).
 *
 * Reglas §7 (bloqueadas): 3 tamaños de letra, un acento + grises,
 * verde para subas / gris para bajas — NUNCA rojo (material a CEO).
 * A11y §8: SVG con role="img"+aria-label, KPIs como <article>/<h3>/<p>,
 * flecha del delta aria-hidden con el significado en el texto.
 */

import { REPORTS } from "@/lib/i18n/reports";
import { O2_BRAND } from "./branding";
import type { KpiDelta, PhaseMetrics, WeekBucket } from "./types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );

const intEs = (n: number) => Math.round(n).toLocaleString("es-AR");
const decEs = (n: number) => n.toFixed(1).replace(".", ",");

/** Delta: verde si sube, gris si baja/neutro. Nunca rojo. Flecha aria-hidden. */
function deltaBadge(k: KpiDelta): string {
  if (k.delta === null) return "";
  const up = k.delta > 0;
  const color = up ? "var(--ok)" : "var(--muted)";
  const arrow = up ? "▲" : k.delta < 0 ? "▼" : "•";
  const label =
    k.delta === 0 ? "sin cambios" : `${up ? "subió" : "bajó"} ${intEs(Math.abs(k.delta))}`;
  const sign = up ? "+" : k.delta < 0 ? "−" : "";
  return `<span class="delta" style="color:${color}"><span aria-hidden="true">${arrow} ${sign}${intEs(
    Math.abs(k.delta)
  )}</span><span class="sr-only"> (${label})</span></span>`;
}

function kpiCard(label: string, value: string, k: KpiDelta): string {
  return `<article class="kpi">
    <h3 class="kpi-num">${value}</h3>
    <p class="kpi-label">${esc(label)}</p>
    ${deltaBadge(k)}
  </article>`;
}

/** Gráfico de barras SVG inline. Verde no aplica: barras siempre en el acento. */
function barChart(buckets: WeekBucket[], ariaLabel: string): string {
  const W = 640;
  const H = 180;
  const pad = 28;
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const n = Math.max(1, buckets.length);
  const bw = Math.min(72, (W - pad * 2) / n - 12);
  const bars = buckets
    .map((b, i) => {
      const x = pad + i * ((W - pad * 2) / n) + ((W - pad * 2) / n - bw) / 2;
      const h = Math.round(((H - pad * 2) * b.value) / max);
      const y = H - pad - h;
      return `<rect x="${x.toFixed(1)}" y="${y}" width="${bw.toFixed(
        1
      )}" height="${h}" rx="3" fill="var(--accent)"/>
      <text x="${(x + bw / 2).toFixed(1)}" y="${y - 6}" text-anchor="middle" class="svg-val">${intEs(
        b.value
      )}</text>
      <text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="svg-lbl">${esc(
        b.weekLabel
      )}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}" class="chart">
    <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="var(--border)" stroke-width="1"/>
    ${bars}
  </svg>`;
}

function winnersBlock(m: PhaseMetrics, copy = REPORTS.phase): string {
  if (m.winners.length === 0) return "";
  const rows = m.winners
    .map(
      (w) => `<tr>
      <td class="w-pos">${w.position}</td>
      <td>${esc(w.name)}</td>
      <td class="w-prize">${esc(w.prize)}</td>
    </tr>`
    )
    .join("");
  return `<section class="block">
    <h2 class="block-title">${esc(copy.sections.winners)}</h2>
    <table class="winners"><tbody>${rows}</tbody></table>
    <p class="context">${esc(copy.contextPhrases.winnersProof)}</p>
  </section>`;
}

function secondaryBlock(m: PhaseMetrics, copy = REPORTS.phase): string {
  const ut = m.userTypeBreakdown;
  const branch =
    m.branchBreakdown.length > 0
      ? m.branchBreakdown
          .map(
            (b) =>
              `<li>${esc(b.branch)}: <strong>${intEs(b.count)}</strong> (${decEs(b.percent)}%)</li>`
          )
          .join("")
      : "";
  return `<section class="block">
    <h2 class="block-title">${esc(copy.sections.secondary)}</h2>
    <ul class="secondary">
      <li>Acierto de la fase: <strong>${decEs(m.accuracyPercent)}%</strong></li>
      <li>Nuevos: <strong>${intEs(ut.new)}</strong> · Recurrentes: <strong>${intEs(
        ut.recurrent
      )}</strong> · Power: <strong>${intEs(ut.power)}</strong></li>
      ${branch}
    </ul>
  </section>`;
}

export function renderHTML(m: PhaseMetrics, brand = O2_BRAND, copy = REPORTS.phase): string {
  const title = copy.titleTemplate.replace("{phaseLabel}", m.phaseLabel);
  const period = copy.periodTemplate
    .replace("{phaseLabel}", m.phaseLabel)
    .replace("{periodStart}", m.weekLabel)
    .replace("{periodEnd}", "");

  const interactionAria = `${copy.sections.interaction}: ${m.weeklyInteraction
    .map((b) => `${b.weekLabel} ${intEs(b.value)} usuarios`)
    .join(", ")}`;
  const predictionsAria = `${copy.sections.predictions}: ${m.weeklyPredictions
    .map((b) => `${b.weekLabel} ${intEs(b.value)}`)
    .join(", ")}`;
  const newUsersAria = `${copy.sections.newUsers}: ${m.weeklyNewUsers
    .map((b) => `${b.weekLabel} ${intEs(b.count)} (acumulado ${intEs(b.cumulative)})`)
    .join(", ")}`;

  const newUsersChart = barChart(
    m.weeklyNewUsers.map((b) => ({ weekLabel: b.weekLabel, value: b.count })),
    newUsersAria
  );

  // regla §7: exactamente 3 tamaños → --fs-lg (48) · --fs-md (18) · --fs-sm (13)
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<style>
:root{
  --accent:${brand.accentColor}; --ok:${brand.okColor}; --bg:${brand.bgColor};
  --card:${brand.cardColor}; --text:${brand.textColor}; --muted:${brand.mutedColor};
  --border:${brand.borderColor};
  --fs-lg:48px; --fs-md:18px; --fs-sm:13px; /* §7: solo 3 tamaños */
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;
  font-size:var(--fs-sm);line-height:1.5;padding:32px 20px;max-width:760px;margin:0 auto}
.display{font-family:Anton,"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.02em}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
header img{height:34px;width:auto}
.brand{font-family:Anton,"Arial Narrow",sans-serif;font-size:var(--fs-md);text-transform:uppercase;letter-spacing:.06em}
h1{font-family:Anton,"Arial Narrow",sans-serif;font-size:var(--fs-lg);line-height:1.02;text-transform:uppercase;margin-top:8px}
.period{color:var(--muted);font-size:var(--fs-sm);margin-top:6px}
.headline{font-family:Anton,"Arial Narrow",sans-serif;font-size:var(--fs-md);color:var(--accent);
  text-transform:uppercase;margin:20px 0 24px;line-height:1.15}
.kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:28px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px}
.kpi-num{font-family:Anton,"Arial Narrow",sans-serif;font-size:var(--fs-lg);color:var(--accent);line-height:1}
.kpi-label{color:var(--muted);margin-top:4px}
.delta{display:inline-block;margin-top:6px;font-weight:700;font-size:var(--fs-sm)}
.block{margin-bottom:28px}
.block-title{font-family:Anton,"Arial Narrow",sans-serif;font-size:var(--fs-md);text-transform:uppercase;
  letter-spacing:.02em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.context{color:var(--muted);margin-top:10px}
.chart{width:100%;height:auto;display:block}
.svg-val{fill:var(--text);font-size:12px;font-weight:700}
.svg-lbl{fill:var(--muted);font-size:11px}
.winners{width:100%;border-collapse:collapse}
.winners td{padding:10px 8px;border-bottom:1px solid var(--border)}
.w-pos{font-family:Anton,"Arial Narrow",sans-serif;color:var(--accent);width:36px}
.w-prize{color:var(--muted);text-align:right}
.secondary{list-style:none;display:flex;flex-direction:column;gap:8px}
.secondary strong{color:var(--text)}
.closing{background:var(--card);border:1px solid var(--border);border-left:3px solid var(--accent);
  border-radius:8px;padding:16px;margin:8px 0 24px;color:var(--text)}
footer{color:var(--muted);text-align:center;padding-top:16px;border-top:1px solid var(--border)}
.avg{color:var(--muted);margin-top:10px}
</style>
</head>
<body>
<header>
  <img src="${brand.logoPath}" alt="${esc(brand.productName)}"/>
  <span class="brand">${esc(brand.productName)}</span>
</header>

<h1>${esc(title)}</h1>
<p class="period">${esc(period.trim())}</p>

<p class="headline">${esc(m.headlineSummary)}</p>

<div class="kpis">
  ${kpiCard(copy.kpiLabels.activeUsers, intEs(m.kpis.activeUsers.current), m.kpis.activeUsers)}
  ${kpiCard(copy.kpiLabels.predictionsLoaded, intEs(m.kpis.predictionsLoaded.current), m.kpis.predictionsLoaded)}
  ${kpiCard(copy.kpiLabels.newUsers, intEs(m.kpis.newUsers.current), m.kpis.newUsers)}
  ${kpiCard(copy.kpiLabels.participation, `${decEs(m.kpis.participation.current)}%`, m.kpis.participation)}
</div>

<section class="block">
  <h2 class="block-title">${esc(copy.sections.interaction)}</h2>
  ${barChart(m.weeklyInteraction, interactionAria)}
  <p class="context">${esc(copy.contextPhrases.interaction[m.interactionTrend])}</p>
</section>

<section class="block">
  <h2 class="block-title">${esc(copy.sections.newUsers)}</h2>
  ${newUsersChart}
  <p class="context">${esc(copy.contextPhrases.newUsersRegistration)}</p>
</section>

<section class="block">
  <h2 class="block-title">${esc(copy.sections.predictions)}</h2>
  ${barChart(m.weeklyPredictions, predictionsAria)}
  <p class="avg">Promedio por activo: <strong>${decEs(m.avgPredictionsPerActive)}</strong></p>
  <p class="context">${esc(copy.contextPhrases.predictionsUsage)}</p>
</section>

${winnersBlock(m, copy)}

${secondaryBlock(m, copy)}

<div class="closing">${esc(m.closingText)}</div>

<footer>${esc(brand.footerLabel)}</footer>
</body>
</html>`;
}
