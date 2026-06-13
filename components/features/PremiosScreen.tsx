"use client";

import { useRef, useState, useEffect, useCallback, type CSSProperties } from "react";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { PRIZES } from "@/lib/i18n/prizes";

// ─── Datos de slides ──────────────────────────────────────────────────────────

interface Slide {
  phase: string;
  rankLabel?: string;
  prizeNumber: string;
  prizeUnit: string;
  paseName: string;
  paseMembership: string;
  criterion: string;
  metalBorder?: string;
  isChampion?: boolean;
}

const SLIDES: Slide[] = [
  { phase: "Fase de grupos",   prizeNumber: "1", prizeUnit: "MES",   paseName: "PASE LIBRE",  paseMembership: "MEMBRESÍA OFICIAL · 1 MES",   criterion: "Mayor puntaje de la fase." },
  { phase: "Octavos de final", prizeNumber: "1", prizeUnit: "MES",   paseName: "PASE LIBRE",  paseMembership: "MEMBRESÍA OFICIAL · 1 MES",   criterion: "Líder acumulado hasta esta instancia." },
  { phase: "Cuartos de final", prizeNumber: "2", prizeUnit: "MESES", paseName: "PASE DOBLE",  paseMembership: "MEMBRESÍA OFICIAL · 2 MESES",  criterion: "Líder acumulado." },
  { phase: "Semifinales",      prizeNumber: "3", prizeUnit: "MESES", paseName: "PASE TRIPLE", paseMembership: "MEMBRESÍA OFICIAL · 3 MESES",  criterion: "Líder acumulado." },
  { phase: "Final", rankLabel: "Campeón del PRODE", prizeNumber: "1", prizeUnit: "AÑO",    paseName: "PASE TOTAL", paseMembership: "MEMBRESÍA OFICIAL · 1 AÑO",   criterion: "Campeón del PRODE.",      metalBorder: "#D4AF37", isChampion: true },
  { phase: "Final", rankLabel: "Subcampeón",        prizeNumber: "6", prizeUnit: "MESES", paseName: "GRAN PASE",  paseMembership: "MEMBRESÍA OFICIAL · 6 MESES", criterion: "Subcampeón del PRODE.",   metalBorder: "#A8A9AD" },
  { phase: "Final", rankLabel: "Tercer puesto",     prizeNumber: "3", prizeUnit: "MESES", paseName: "PASE PLUS",  paseMembership: "MEMBRESÍA OFICIAL · 3 MESES", criterion: "Tercer puesto del PRODE.", metalBorder: "#CD7F32" },
];

const STEPPER_NODES = [
  { code: "G", label: "Grupos" },
  { code: "O", label: "Octavos" },
  { code: "C", label: "Cuartos" },
  { code: "S", label: "Semis" },
  { code: "F", label: "Final" },
];

const BARCODE_WIDTHS = [3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 3];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SlideStatus = "done" | "active" | "locked";

function getSlideStatus(idx: number, activePhaseIndex: number): SlideStatus {
  const slidePhase = idx <= 3 ? idx : 4;
  if (slidePhase < activePhaseIndex) return "done";
  if (slidePhase === activePhaseIndex) return "active";
  return "locked";
}

function getNodeStatus(nodeIdx: number, activePhaseIndex: number): "done" | "active" | "locked" {
  if (nodeIdx < activePhaseIndex) return "done";
  if (nodeIdx === activePhaseIndex) return "active";
  return "locked";
}

function getCardBg(): string {
  return "radial-gradient(circle at 50% 28%, rgba(255,106,0,0.12) 0%, transparent 55%), #07070a";
}

function getHairlineColor(slide: Slide, status: SlideStatus): string {
  if (slide.metalBorder) return slide.metalBorder;
  if (status === "active") return "#FF6A00";
  return "rgba(255,106,0,0.25)";
}

function getPrizeNumberColor(): string {
  return "#FF6A00";
}

function getCardBorder(slide: Slide, status: SlideStatus): CSSProperties {
  if (slide.metalBorder) {
    return {
      border: `1px solid ${slide.metalBorder}`,
      boxShadow: `0 24px 60px -20px ${slide.metalBorder}33`,
    };
  }
  if (status === "active") {
    return {
      border: "1px solid #FF6A00",
      boxShadow: "0 0 0 1px rgba(255,106,0,0.12), 0 24px 60px -20px rgba(255,106,0,0.35)",
    };
  }
  return { border: "1px solid rgba(255,255,255,0.06)" };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Barcode() {
  return (
    <div className="flex items-end gap-px h-[26px] opacity-65" aria-hidden>
      {BARCODE_WIDTHS.map((w, i) =>
        i % 2 === 0 ? (
          <div key={i} style={{ width: w * 2, height: "100%", background: "rgba(255,255,255,0.82)", borderRadius: 0.5 }} />
        ) : (
          <div key={i} style={{ width: w * 2 }} />
        )
      )}
    </div>
  );
}

function PassWidget({ paseName, paseMembership }: { paseName: string; paseMembership: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1.5px dashed rgba(255,255,255,0.14)",
        background: "rgba(6,6,8,0.88)",
      }}
    >
      {/* Header naranja */}
      <div
        className="flex items-center justify-between px-3.5 py-1.5"
        style={{ background: "#FF6A00" }}
      >
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 13, color: "#0a0a0a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          O2 WELLNESS CLUB
        </span>
        <span style={{ fontSize: 9, color: "rgba(10,10,10,0.65)", fontFamily: "inherit" }}>
          PRODE MUNDIAL 26
        </span>
      </div>

      {/* Separador perforado */}
      <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.12)" }} />

      {/* Cuerpo del ticket */}
      <div className="px-3.5 pt-2 pb-2.5 flex flex-col gap-1.5">
        <span
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: 22,
            color: "#F5F7FA",
            textTransform: "uppercase",
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {paseName}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#5A5F69",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontFamily: "inherit",
          }}
        >
          {paseMembership}
        </span>
        <Barcode />
      </div>
    </div>
  );
}

function SlideCard({
  slide,
  status,
  dataIndex,
}: {
  slide: Slide;
  status: SlideStatus;
  dataIndex: number;
}) {
  const VIGNETTE =
    "linear-gradient(180deg, rgba(5,5,6,0.12) 0%, transparent 28%, rgba(5,5,6,0.72) 60%, rgba(4,4,5,0.98) 100%)";
  const hairlineColor = getHairlineColor(slide, status);
  const prizeColor = getPrizeNumberColor();
  const borderStyle = getCardBorder(slide, status);

  return (
    <div
      data-slide
      data-index={dataIndex}
      className="relative flex-shrink-0 rounded-[18px] overflow-hidden flex flex-col"
      style={{
        width: "calc(100% - 40px)",
        height: 468,
        scrollSnapAlign: "center",
        background: getCardBg(),
        ...borderStyle,
      }}
    >
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: VIGNETTE, zIndex: 1 }} />

      {/* Hairline top */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${hairlineColor}, transparent)`,
          zIndex: 2,
        }}
      />

      {/* Marca de agua — logo O2 original */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          width: 220,
          opacity: 0.055,
          mixBlendMode: "screen",
          right: -14,
          top: "8%",
          zIndex: 1,
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col h-full px-[18px] pt-4 pb-[18px] justify-between">
        {/* Top: fase + badge */}
        <div className="flex flex-col gap-1.5">
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#9CA3AF",
              fontFamily: "inherit",
            }}
          >
            {slide.phase}{slide.rankLabel ? ` · ${slide.rankLabel}` : ""}
          </p>

          {status === "active" && !slide.metalBorder && (
            <div className="flex items-center gap-1" style={{ color: "#FF6A00" }}>
              <Icon name="flame" size={12} />
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                En curso
              </span>
            </div>
          )}
          {slide.isChampion && (
            <div className="flex items-center gap-1" style={{ color: "rgba(255,210,80,0.90)" }}>
              <Icon name="crown" size={12} />
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Premio mayor
              </span>
            </div>
          )}
        </div>

        {/* Centro: número grande + gratis */}
        <div className="flex flex-col gap-0">
          <div className="flex items-end gap-2 leading-none">
            <span
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: 96,
                lineHeight: 0.85,
                color: prizeColor,
                textTransform: "uppercase",
              }}
            >
              {slide.prizeNumber}
            </span>
            <span
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: 36,
                color: "#F5F7FA",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {slide.prizeUnit}
            </span>
          </div>
          <span
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: 17,
              color: "#C7CCD4",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            GRATIS
          </span>
        </div>

        {/* Bottom: ticket + criterio */}
        <div className="flex flex-col gap-3">
          <PassWidget paseName={slide.paseName} paseMembership={slide.paseMembership} />
          <p style={{ fontSize: 11.5, color: "#9CA3AF", lineHeight: 1.4, fontFamily: "inherit" }}>
            {slide.criterion}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper compacto ─────────────────────────────────────────────────────────

function StepperCompact({ activePhaseIndex }: { activePhaseIndex: number }) {
  const filledPct = activePhaseIndex === 0 ? 0 : (activePhaseIndex / (STEPPER_NODES.length - 1)) * 100;

  return (
    <div className="px-4 py-3">
      <div className="relative flex items-center justify-between">
        {/* Base line */}
        <div
          className="absolute left-0 right-0"
          style={{ top: 19, height: 2, background: "#333333", zIndex: 0 }}
        />
        {/* Progress line */}
        <div
          className="absolute left-0"
          style={{
            top: 19,
            height: 2,
            width: `${filledPct}%`,
            background: "rgba(255,106,0,0.55)",
            zIndex: 1,
            transition: "width 400ms ease",
          }}
        />

        {STEPPER_NODES.map((node, i) => {
          const status = getNodeStatus(i, activePhaseIndex);
          const nodeStyle: CSSProperties =
            status === "active"
              ? {
                  background: "#FF6A00",
                  color: "#0B0B0D",
                  boxShadow: "0 0 0 4px rgba(255,106,0,0.12), 0 8px 22px -8px rgba(255,106,0,0.35)",
                  border: "none",
                }
              : status === "done"
              ? { background: "#242424", border: "1px solid #FF6A00", color: "#FF6A00" }
              : { background: "#1a1a1a", border: "1px solid #454545", color: "#9CA3AF" };

          return (
            <div key={node.code} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 38, height: 38, ...nodeStyle }}
              >
                <span style={{ fontFamily: "Anton, sans-serif", fontSize: 15, textTransform: "uppercase" }}>
                  {node.code}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export function PremiosScreen({ activePhaseIndex }: { activePhaseIndex: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Detectar el slide visible con IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveSlide(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    const slides = container.querySelectorAll("[data-slide]");
    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSlide = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const slide = container.querySelector<HTMLElement>(`[data-index="${idx}"]`);
    if (!slide) return;
    // Centro del slide dentro del contenedor
    const offset = slide.offsetLeft - (container.offsetWidth - slide.offsetWidth) / 2;
    container.scrollTo({ left: offset, behavior: "smooth" });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]"
    >
      <ScreenHeader title="Premios del Mundial" />

      {/* Stepper compacto */}
      <StepperCompact activePhaseIndex={activePhaseIndex} />

      {/* Galería horizontal snap-scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 px-5 overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {SLIDES.map((slide, i) => (
          <SlideCard
            key={slide.paseName + i}
            slide={slide}
            status={getSlideStatus(i, activePhaseIndex)}
            dataIndex={i}
          />
        ))}
        {/* Spacer para que el último slide también pueda centrarse */}
        <div className="flex-shrink-0 w-5" aria-hidden />
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir al premio ${i + 1}`}
            onClick={() => scrollToSlide(i)}
            style={{
              height: 5,
              width: activeSlide === i ? 18 : 5,
              borderRadius: 3,
              background: activeSlide === i ? "#FF6A00" : "#454545",
              transition: "all 280ms cubic-bezier(0.2,0,0,1)",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Avisos */}
      <div className="flex flex-col gap-3 px-4 mt-6">
        <div
          className="rounded-xl p-4"
          style={{ background: "#1a1a1a", border: "1px solid #333333" }}
        >
          <p style={{ color: "#FF6A00", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
            {PRIZES.ruleTitle}
          </p>
          <p style={{ color: "#C7CCD4", fontSize: 12.5, marginTop: 6, lineHeight: 1.5, fontFamily: "inherit" }}>
            {PRIZES.ruleBody}
          </p>
        </div>
        <p style={{ color: "#9CA3AF", fontSize: 12, fontStyle: "italic", fontFamily: "inherit" }}>
          {PRIZES.coordinationNote}
        </p>
      </div>
    </div>
  );
}
