import type { PositionShareData, ShareFormat } from "@/lib/share/templates";

const C = {
  bg: "#0a0a0c",
  primary: "#FF6A00",
  lime: "#D9FF3F",
  gold: "#FFB300",
  muted: "#888888",
  text: "#FFFFFF",
};

export function T02_Position({ data, format }: { data: PositionShareData; format: ShareFormat }) {
  const h = format === "story" ? 1920 : 1080;
  const frameSize = format === "story" ? 760 : 560;
  const rankFontSize = format === "story" ? 320 : 240;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: h,
        background: `linear-gradient(180deg, ${C.bg} 0%, #1b1410 100%)`,
        fontFamily: "Inter",
        padding: 0,
      }}
    >
      {/* Bottom glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(255,106,0,0.22) 0%, transparent 70%)`,
          display: "flex",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "80px 80px 72px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 28, letterSpacing: "0.2em", color: C.muted, fontWeight: 700 }}>
            MI POSICIÓN
          </span>
          <span
            style={{
              fontSize: 64,
              fontFamily: "Anton",
              color: C.primary,
              textShadow: `0 0 32px rgba(255,106,0,0.6)`,
            }}
          >
            O2
          </span>
        </div>

        {/* Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 48 }}>
          <span style={{ fontFamily: "Anton", fontSize: format === "story" ? 100 : 72, color: C.text, lineHeight: 1 }}>
            EN EL RANKING
          </span>
          <span style={{ fontSize: 32, color: C.muted, marginTop: 12 }}>
            {data.totalSocios} socios compitiendo
          </span>
        </div>

        {/* Rank frame */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: frameSize,
            height: frameSize,
            borderRadius: 80,
            border: `2px solid ${C.primary}`,
            background: `linear-gradient(180deg, rgba(255,106,0,0.15) 0%, rgba(255,106,0,0.04) 100%)`,
            flexDirection: "column",
            alignSelf: "center",
          }}
        >
          <span style={{ fontSize: 22, letterSpacing: "0.2em", color: C.muted, fontWeight: 700 }}>
            MI PUESTO
          </span>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: rankFontSize,
              color: C.primary,
              lineHeight: 1,
              textShadow: `0 0 80px rgba(255,106,0,0.5)`,
            }}
          >
            #{data.position}
          </span>
          <span style={{ fontFamily: "Anton", fontSize: 72, color: C.text, lineHeight: 1 }}>
            {data.userName.split(" ")[0]?.toUpperCase() ?? data.userName.toUpperCase()}
          </span>
          <span style={{ fontSize: 32, color: C.lime, fontWeight: 700, marginTop: 8 }}>
            {data.points} PTS · {data.userLevelName.toUpperCase()}
          </span>
        </div>

        {/* Stats below frame */}
        {data.deltaPosition !== 0 && (
          <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
            <MiniStat
              label={data.deltaPosition > 0 ? `SUBÍ +${data.deltaPosition}` : `BAJÉ ${data.deltaPosition}`}
              color={data.deltaPosition > 0 ? "#22C55E" : "#EF4444"}
            />
            <MiniStat label={`SEMANA +${data.weekPoints} PTS`} color={C.lime} />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 28, letterSpacing: "0.14em", color: C.gold, fontWeight: 700 }}>
            #PRODEMUNDIALO2
          </span>
          <span style={{ fontSize: 24, color: C.muted }}>Semana {data.weekNumber}</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 32, fontWeight: 700, color }}>{label}</span>
  );
}
