import type { MatchShareData, ShareFormat } from "@/lib/share/templates";

const C = {
  bg: "#0a0a0c",
  primary: "#FF6A00",
  gold: "#FFB300",
  muted: "#888888",
  text: "#FFFFFF",
};

export function T03_Match({ data, format }: { data: MatchShareData; format: ShareFormat }) {
  const h = format === "story" ? 1920 : 1080;
  const scoreFontSize = format === "story" ? 300 : 220;

  const kickoff = new Date(data.kickoffISO);
  const dateLabel = kickoff.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = kickoff.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: h,
        background: `linear-gradient(135deg, ${C.bg} 0%, #1a1410 50%, ${C.bg} 100%)`,
        fontFamily: "Inter",
        padding: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "80px 80px 72px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 28, letterSpacing: "0.2em", color: C.muted, fontWeight: 700 }}>
            MI PREDICCIÓN
          </span>
          <span style={{ fontSize: 64, fontFamily: "Anton", color: C.primary, textShadow: `0 0 32px rgba(255,106,0,0.6)` }}>
            O2
          </span>
        </div>

        {/* Match header */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 48 }}>
          <span style={{ fontFamily: "Anton", fontSize: format === "story" ? 88 : 64, color: C.text, lineHeight: 1 }}>
            PRÓXIMO PARTIDO
          </span>
          <span style={{ fontSize: 32, color: C.gold, fontWeight: 700, marginTop: 12 }}>
            {data.phase.toUpperCase()} · {dateLabel.toUpperCase()} {timeLabel}
          </span>
        </div>

        {/* Teams */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={{ fontFamily: "Anton", fontSize: format === "story" ? 56 : 44, color: C.text }}>
            {data.home.country.toUpperCase()}
          </span>
          <span style={{ fontSize: 28, color: C.muted, fontWeight: 700 }}>VS</span>
          <span style={{ fontFamily: "Anton", fontSize: format === "story" ? 56 : 44, color: C.text }}>
            {data.away.country.toUpperCase()}
          </span>
        </div>

        {/* Score prediction */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: scoreFontSize,
                color: C.text,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {data.predictedScore[0]}
            </span>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: scoreFontSize * 0.5,
                color: C.primary,
                lineHeight: 1,
              }}
            >
              —
            </span>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: scoreFontSize,
                color: C.text,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {data.predictedScore[1]}
            </span>
          </div>
          <span style={{ fontSize: 28, letterSpacing: "0.2em", color: C.muted, fontWeight: 700, marginTop: 16 }}>
            MI PREDICCIÓN
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 28, letterSpacing: "0.14em", color: C.gold, fontWeight: 700 }}>
            #PRODEMUNDIALO2
          </span>
          <span style={{ fontSize: 24, color: C.muted }}>
            {data.userName.split(" ")[0]} · #{data.userPosition}
          </span>
        </div>
      </div>
    </div>
  );
}
