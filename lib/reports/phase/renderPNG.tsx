/**
 * O2 PRODE — Render PNG del reporte de fase (brief §5 renderPNG).
 *
 * Versión compacta 1200×630 (OG card) para preview en cliente de mail: headline
 * + 4 KPIs + gráfico principal. NO es captura del HTML — layout Satori propio.
 * Reglas §7: un acento + grises, verde en subas, nunca rojo.
 *
 * Devuelve los bytes PNG (Uint8Array) para subir a Storage / adjuntar al mail.
 */

import { ImageResponse } from "@vercel/og";
import { type BrandTokens, O2_BRAND } from "./branding";
import type { KpiDelta, PhaseMetrics } from "./types";

async function loadFont(origin: string, path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${origin}${path}`);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

const intEs = (n: number) => Math.round(n).toLocaleString("es-AR");
const decEs = (n: number) => n.toFixed(1).replace(".", ",");

function deltaText(k: KpiDelta, brand: BrandTokens): { text: string; color: string } | null {
  if (k.delta === null) return null;
  const up = k.delta > 0;
  const arrow = up ? "▲" : k.delta < 0 ? "▼" : "•";
  const sign = up ? "+" : k.delta < 0 ? "−" : "";
  return {
    text: `${arrow} ${sign}${intEs(Math.abs(k.delta))}`,
    color: up ? brand.okColor : brand.mutedColor,
  };
}

function kpiCard(label: string, value: string, k: KpiDelta, brand: BrandTokens) {
  const d = deltaText(k, brand);
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: brand.cardColor,
        border: `1px solid ${brand.borderColor}`,
        borderRadius: 12,
        padding: "18px 16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontFamily: "Anton", fontSize: 46, color: brand.accentColor, lineHeight: 1 },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 16, color: brand.mutedColor, marginTop: 6 },
            children: label,
          },
        },
        d
          ? {
              type: "div",
              props: {
                style: { fontSize: 16, color: d.color, marginTop: 6, fontWeight: 700 },
                children: d.text,
              },
            }
          : null,
      ],
    },
  };
}

function bars(m: PhaseMetrics, brand: BrandTokens) {
  const data = m.weeklyInteraction.length ? m.weeklyInteraction : [{ weekLabel: "—", value: 0 }];
  const max = Math.max(1, ...data.map((b) => b.value));
  return {
    type: "div",
    props: {
      style: { display: "flex", alignItems: "flex-end", gap: 18, height: 150, marginTop: 8 },
      children: data.map((b) => ({
        type: "div",
        props: {
          style: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
          children: [
            {
              type: "div",
              props: {
                style: { fontSize: 15, color: brand.textColor, marginBottom: 4, fontWeight: 700 },
                children: intEs(b.value),
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: "100%",
                  maxWidth: 90,
                  height: Math.max(4, Math.round((110 * b.value) / max)),
                  background: brand.accentColor,
                  borderRadius: 4,
                },
              },
            },
            {
              type: "div",
              props: {
                style: { fontSize: 13, color: brand.mutedColor, marginTop: 6 },
                children: b.weekLabel,
              },
            },
          ],
        },
      })),
    },
  };
}

export async function renderPNG(
  m: PhaseMetrics,
  origin: string,
  brand: BrandTokens = O2_BRAND
): Promise<Uint8Array> {
  const [anton, inter] = await Promise.all([
    loadFont(origin, brand.fontAnton),
    loadFont(origin, brand.fontInter),
  ]);
  const fonts: NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"] = [];
  if (anton) fonts.push({ name: "Anton", data: anton, style: "normal", weight: 400 });
  if (inter) fonts.push({ name: "Inter", data: inter, style: "normal", weight: 700 });

  const element = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        background: brand.bgColor,
        color: brand.textColor,
        fontFamily: "Inter",
        padding: 56,
      },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Anton",
                    fontSize: 26,
                    letterSpacing: 2,
                    color: brand.textColor,
                  },
                  children: brand.productName,
                },
              },
              {
                type: "div",
                props: { style: { fontSize: 18, color: brand.mutedColor }, children: m.weekLabel },
              },
            ],
          },
        },
        // Title + headline
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Anton",
              fontSize: 58,
              marginTop: 18,
              textTransform: "uppercase",
              color: brand.textColor,
            },
            children: m.phaseLabel,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Anton",
              fontSize: 30,
              marginTop: 10,
              color: brand.accentColor,
              textTransform: "uppercase",
            },
            children: m.headlineSummary,
          },
        },
        // KPIs
        {
          type: "div",
          props: {
            style: { display: "flex", gap: 16, marginTop: 26 },
            children: [
              kpiCard(
                "Usuarios activos",
                intEs(m.kpis.activeUsers.current),
                m.kpis.activeUsers,
                brand
              ),
              kpiCard(
                "Predicciones",
                intEs(m.kpis.predictionsLoaded.current),
                m.kpis.predictionsLoaded,
                brand
              ),
              kpiCard("Nuevos", intEs(m.kpis.newUsers.current), m.kpis.newUsers, brand),
              kpiCard(
                "Participación",
                `${decEs(m.kpis.participation.current)}%`,
                m.kpis.participation,
                brand
              ),
            ],
          },
        },
        // Chart
        bars(m, brand),
      ],
    },
  };

  // @ts-expect-error — árbol de elementos plano compatible con Satori (mismo patrón que las share cards)
  const res = new ImageResponse(element, { width: 1200, height: 630, fonts });
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
