import type { AchievementShareData, ShareFormat } from "@/lib/share/templates";
import { ShareIcon } from "./ShareIcon";

const C = {
  bg: "#0a0a0c",
  lime: "#D9FF3F",
  gold: "#FFB300",
  muted: "#888888",
  text: "#FFFFFF",
};

const CAT_LABELS: Record<string, string> = {
  skill: "SKILL",
  consistency: "CONSTANCIA",
  social: "SOCIAL",
  position: "POSICIÓN",
};

export function T04_Achievement({
  data,
  format,
}: {
  data: AchievementShareData;
  format: ShareFormat;
}) {
  const h = format === "story" ? 1920 : 1080;
  const circleSize = format === "story" ? 480 : 360;
  const catLabel = CAT_LABELS[data.achievementCategory] ?? data.achievementCategory.toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: h,
        background: `linear-gradient(180deg, ${C.bg} 0%, #0e1206 60%, ${C.bg} 100%)`,
        fontFamily: "Inter",
        padding: 0,
      }}
    >
      {/* Lime spotlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, rgba(217,255,63,0.18) 0%, transparent 70%)`,
          display: "flex",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "80px 80px 72px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 28, letterSpacing: "0.2em", color: C.muted, fontWeight: 700 }}>
            LOGRO DESBLOQUEADO
          </span>
          <span
            style={{
              fontSize: 64,
              fontFamily: "Anton",
              color: "#FF6A00",
              textShadow: `0 0 32px rgba(255,106,0,0.6)`,
            }}
          >
            O2
          </span>
        </div>

        {/* Icon circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: circleSize,
            height: circleSize,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, rgba(217,255,63,0.22) 0%, transparent 70%)`,
            border: `2px solid rgba(217,255,63,0.4)`,
            alignSelf: "center",
            marginBottom: 48,
          }}
        >
          <ShareIcon name={data.iconRef} size={circleSize * 0.46} color={C.lime} />
        </div>

        {/* Category + Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: format === "story" ? 120 : 88,
              color: C.muted,
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            {catLabel}
          </span>
          <span
            style={{
              fontFamily: "Anton",
              fontSize: format === "story" ? 100 : 72,
              color: C.lime,
              lineHeight: 1,
              textShadow: `0 0 40px rgba(217,255,63,0.4)`,
            }}
          >
            {data.achievementName}
          </span>
          <span
            style={{
              fontSize: 32,
              color: C.muted,
              lineHeight: 1.4,
              marginTop: 8,
              maxWidth: 840,
            }}
          >
            {data.achievementDescription}
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 28, letterSpacing: "0.14em", color: C.gold, fontWeight: 700 }}>
            #PRODEMUNDIALO2
          </span>
          <span style={{ fontSize: 24, color: C.muted }}>{data.userName.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}
