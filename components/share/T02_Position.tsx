import type { PositionShareData, ShareFormat } from "@/lib/share/templates";

/**
 * T02 — "Mi posición" (viral share, estética athletic/Stitch).
 * Número de ranking gigante + glow, percentil ("superó al X%"), logo O2 y
 * hashtag #WAZEXPERIENCE. Story 1080×1920 / square 1080×1080.
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

export function T02_Position({
  data,
  format,
  origin = "",
}: {
  data: PositionShareData;
  format: ShareFormat;
  origin?: string;
}) {
  const story = format === "story";
  const H = story ? 1920 : 1080;
  const padH = 96;

  const rankStr = `#${data.position}`;
  const digits = String(data.position).length;
  // tamaño adaptativo del número gigante
  const numSize = (story ? 760 : 520) - (digits - 1) * (story ? 150 : 110);
  const hashSize = Math.round(numSize * 0.3);
  const firstName = (data.userName.split(" ")[0] ?? data.userName).toUpperCase();
  const nameSize = story ? 150 : 118;
  const percentile = data.totalSocios > 1
    ? Math.max(0, Math.round(((data.totalSocios - data.position) / data.totalSocios) * 100))
    : 0;

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
        padding: `${story ? 110 : 70}px ${padH}px ${story ? 90 : 64}px`,
      }}
    >
      {/* Glow detrás del número */}
      <div
        style={{
          position: "absolute",
          top: story ? 480 : 300,
          left: 0,
          width: 1080,
          height: 760,
          display: "flex",
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${C.accentRGB},0.16) 0%, transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 30, letterSpacing: "0.22em", color: C.ghost, fontWeight: 700 }}>
          MI POSICIÓN
        </span>
        <span style={{ fontSize: 30, letterSpacing: "0.18em", color: C.ghost, fontWeight: 700 }}>
          SEMANA {data.weekNumber}
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
        {/* Número gigante */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: hashSize,
              color: C.accent,
              opacity: 0.7,
              marginTop: Math.round(numSize * 0.14),
            }}
          >
            #
          </span>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: numSize,
              color: C.accent,
              lineHeight: 0.9,
              textShadow: `0 0 70px rgba(${C.accentRGB},0.45), 0 0 140px rgba(${C.accentRGB},0.2)`,
            }}
          >
            {String(data.position)}
          </span>
        </div>

        {/* Nombre */}
        <span
          style={{
            fontFamily: "Anton",
            fontSize: nameSize,
            color: C.white,
            lineHeight: 0.92,
            letterSpacing: "0.02em",
            marginTop: 8,
          }}
        >
          {firstName}
        </span>

        {/* Hairline */}
        <div style={{ display: "flex", width: 80, height: 4, background: C.border, margin: "44px 0 40px" }} />

        {/* Status (nivel) */}
        <div
          style={{
            display: "flex",
            border: `2px solid ${C.border}`,
            borderRadius: 6,
            padding: "14px 40px",
            fontSize: 34,
            letterSpacing: "0.18em",
            color: C.accent,
            fontWeight: 700,
          }}
        >
          {data.userLevelName.toUpperCase()}
        </div>

        {/* Percentil */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: story ? 80 : 56 }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: C.white, letterSpacing: "0.04em" }}>
            <span>SUPERÓ AL&nbsp;</span>
            <span style={{ color: C.accent }}>{percentile}%</span>
          </div>
          <span style={{ fontSize: 30, letterSpacing: "0.16em", color: C.dim, marginTop: 16, fontWeight: 600 }}>
            DE LOS PARTICIPANTES
          </span>
        </div>

        {/* Meta */}
        <span style={{ fontSize: 30, letterSpacing: "0.16em", color: C.ghost, marginTop: 40, fontWeight: 600 }}>
          {data.totalSocios} SOCIOS · {data.points} PTS
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
