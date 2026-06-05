import type { MatchShareData, ShareFormat } from "@/lib/share/templates";

/**
 * T03 — "Mi predicción" (viral share). Marcador predicho gigante + glow,
 * equipos, fase, logo O2 y hashtag #WAZEXPERIENCE.
 */

const C = {
  bg: "#080808",
  accent: "#FF6A00",
  accentRGB: "255,106,0",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.42)",
  ghost: "rgba(255,255,255,0.18)",
  border: "rgba(255,106,0,0.35)",
};

export function T03_Match({
  data,
  format,
  origin = "",
}: {
  data: MatchShareData;
  format: ShareFormat;
  origin?: string;
}) {
  const story = format === "story";
  const H = story ? 1920 : 1080;
  const scoreSize = story ? 460 : 320;

  const kickoff = new Date(data.kickoffISO);
  const dateLabel = kickoff
    .toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    .toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: H,
        background: C.bg,
        fontFamily: "Inter",
        padding: `${story ? 110 : 70}px 96px ${story ? 90 : 64}px`,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: story ? 560 : 320,
          left: 0,
          width: 1080,
          height: 700,
          display: "flex",
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${C.accentRGB},0.16) 0%, transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 30, letterSpacing: "0.22em", color: C.ghost, fontWeight: 700 }}>
          MI PREDICCIÓN
        </span>
        <span style={{ fontSize: 30, letterSpacing: "0.16em", color: C.ghost, fontWeight: 700 }}>
          {data.phase.toUpperCase()} · {dateLabel}
        </span>
      </div>

      {/* Hero */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Equipos */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "Anton", fontSize: story ? 72 : 54, color: C.white, letterSpacing: "0.02em" }}>
            {data.home.country.toUpperCase()}
          </span>
          <span style={{ fontSize: story ? 40 : 30, color: C.accent, fontWeight: 800, margin: "0 28px" }}>
            VS
          </span>
          <span style={{ fontFamily: "Anton", fontSize: story ? 72 : 54, color: C.white, letterSpacing: "0.02em" }}>
            {data.away.country.toUpperCase()}
          </span>
        </div>

        {/* Marcador gigante */}
        <div style={{ display: "flex", alignItems: "center", marginTop: story ? 60 : 36 }}>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: scoreSize,
              color: C.accent,
              lineHeight: 0.9,
              textShadow: `0 0 70px rgba(${C.accentRGB},0.45), 0 0 140px rgba(${C.accentRGB},0.2)`,
            }}
          >
            {data.predictedScore[0]}
          </span>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: scoreSize * 0.42,
              color: C.dim,
              margin: `0 ${story ? 40 : 28}px`,
            }}
          >
            –
          </span>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: scoreSize,
              color: C.accent,
              lineHeight: 0.9,
              textShadow: `0 0 70px rgba(${C.accentRGB},0.45), 0 0 140px rgba(${C.accentRGB},0.2)`,
            }}
          >
            {data.predictedScore[1]}
          </span>
        </div>

        <span style={{ fontSize: 30, letterSpacing: "0.2em", color: C.ghost, marginTop: story ? 40 : 24, fontWeight: 700 }}>
          MI MARCADOR
        </span>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 30, letterSpacing: "0.12em", color: C.dim, fontWeight: 700 }}>
          #WAZEXPERIENCE
        </span>
        {origin ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${origin}/logo.png`} width={132} height={120} alt="O2" />
        ) : null}
      </div>
    </div>
  );
}
