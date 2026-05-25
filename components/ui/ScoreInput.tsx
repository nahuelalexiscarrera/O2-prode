"use client";

import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { scoreInputFocus, scoreInputValue } from "@/lib/motion/variants";
import { Icon } from "./Icon";
import { Tag } from "./Tag";
import { BottomSheet } from "./Modal";

// ─── Types ────────────────────────────────────────────────────────────

export type ScoreStatus = "default" | "locked" | "live" | "settled";
type ActiveSlot = "home" | "away";

interface ScoreDraft {
  home: number | null;
  away: number | null;
}

// ─── ScoreInput (exported) ────────────────────────────────────────────

interface ScoreInputProps {
  homeValue: number | null;
  awayValue: number | null;
  homeLabel: string; // team code (ARG) or name
  awayLabel: string;
  status?: ScoreStatus;
  onHomeChange?: (val: number | null) => void;
  onAwayChange?: (val: number | null) => void;
  /** Called once on confirm with the final home + away values */
  onSave?: (home: number | null, away: number | null) => void;
  homeCorrect?: boolean; // settled state
  awayCorrect?: boolean;
  lockoutLabel?: string; // e.g. "Cierra en 2h 14m"
  className?: string;
}

export function ScoreInput({
  homeValue,
  awayValue,
  homeLabel,
  awayLabel,
  status = "default",
  onHomeChange,
  onAwayChange,
  onSave,
  homeCorrect,
  awayCorrect,
  lockoutLabel,
  className,
}: ScoreInputProps) {
  const [open, setOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>("home");
  const [draft, setDraft] = useState<ScoreDraft>({ home: null, away: null });

  const canEdit = status === "default" || status === "live";

  const openNumpad = (slot: ActiveSlot) => {
    if (!canEdit) return;
    setDraft({ home: homeValue, away: awayValue });
    setActiveSlot(slot);
    setOpen(true);
  };

  const handleDigit = useCallback(
    (digit: number) => {
      setDraft((prev) => {
        const cur = activeSlot === "home" ? prev.home : prev.away;
        const next = cur === null ? digit : Math.min(99, cur * 10 + digit);
        return activeSlot === "home" ? { ...prev, home: next } : { ...prev, away: next };
      });
    },
    [activeSlot]
  );

  const handleBackspace = useCallback(() => {
    setDraft((prev) => {
      if (activeSlot === "home") {
        const v = prev.home;
        return { ...prev, home: v === null || v < 10 ? null : Math.floor(v / 10) };
      }
      const v = prev.away;
      return { ...prev, away: v === null || v < 10 ? null : Math.floor(v / 10) };
    });
  }, [activeSlot]);

  const handleConfirm = () => {
    onHomeChange?.(draft.home);
    onAwayChange?.(draft.away);
    onSave?.(draft.home, draft.away);
    setOpen(false);
  };

  return (
    <>
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {/* Live badge */}
        {status === "live" && <Tag variant="live" />}

        {/* Score slots */}
        <div className="flex items-center gap-6">
          <ScoreSlot
            value={homeValue}
            label={homeLabel}
            status={status}
            correct={homeCorrect}
            onClick={() => openNumpad("home")}
          />

          <span className="text-heading-lg text-text-muted font-display select-none">—</span>

          <ScoreSlot
            value={awayValue}
            label={awayLabel}
            status={status}
            correct={awayCorrect}
            onClick={() => openNumpad("away")}
          />
        </div>

        {/* Lockout hint */}
        {status === "locked" && lockoutLabel && (
          <p className="text-body-xs text-text-muted text-center">{lockoutLabel}</p>
        )}
      </div>

      {/* Numpad bottom sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${homeLabel} vs ${awayLabel}`}
      >
        <NumpadContent
          draft={draft}
          homeLabel={homeLabel}
          awayLabel={awayLabel}
          activeSlot={activeSlot}
          onSwitchSlot={setActiveSlot}
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onConfirm={handleConfirm}
        />
      </BottomSheet>
    </>
  );
}

// ─── ScoreSlot (internal) ─────────────────────────────────────────────

interface ScoreSlotProps {
  value: number | null;
  label: string;
  status: ScoreStatus;
  correct?: boolean;
  onClick: () => void;
}

function ScoreSlot({ value, label, status, correct, onClick }: ScoreSlotProps) {
  const [focused, setFocused] = useState(false);
  const isLocked = status === "locked";
  const isSettled = status === "settled";
  const canEdit = status === "default" || status === "live";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        variants={scoreInputFocus}
        initial="idle"
        animate={focused && canEdit ? "focused" : "idle"}
        onClick={onClick}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={!canEdit}
        aria-label={`${label}: ${value ?? "sin ingresar"}`}
        className={cn(
          "relative flex items-center justify-center w-16 h-20 rounded-lg bg-card border",
          "transition-colors",
          !canEdit && "cursor-default",
          isLocked && "opacity-60 border-border",
          isSettled && correct === true && "border-success/40 bg-success-bg/30",
          isSettled && correct === false && "border-error/40 bg-error-bg/30",
          !isLocked && !isSettled && "border-border"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={String(value)}
            variants={scoreInputValue}
            initial="initial"
            animate="animate"
            className={cn(
              "font-display text-numeric-lg tabular",
              value === null && "text-text-disabled",
              value !== null && !isSettled && "text-text",
              isSettled && correct === true && "text-success",
              isSettled && correct === false && "text-error"
            )}
          >
            {value === null ? "—" : value}
          </motion.span>
        </AnimatePresence>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg">
            <Icon name="lock" size={14} className="text-text-disabled" />
          </div>
        )}

        {/* Settled result indicator */}
        {isSettled && correct !== undefined && (
          <div
            className={cn(
              "absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full",
              correct ? "bg-success" : "bg-error"
            )}
          >
            <Icon name={correct ? "check" : "x-mark"} size={10} className="text-text-inverse" />
          </div>
        )}
      </motion.button>

      <span className="text-body-xs text-text-muted uppercase tracking-[0.06em] font-semibold">
        {label}
      </span>
    </div>
  );
}

// ─── NumpadContent (internal) ─────────────────────────────────────────

interface NumpadContentProps {
  draft: ScoreDraft;
  homeLabel: string;
  awayLabel: string;
  activeSlot: ActiveSlot;
  onSwitchSlot: (slot: ActiveSlot) => void;
  onDigit: (d: number) => void;
  onBackspace: () => void;
  onConfirm: () => void;
}

const ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
] as const;

function NumpadContent({
  draft,
  homeLabel,
  awayLabel,
  activeSlot,
  onSwitchSlot,
  onDigit,
  onBackspace,
  onConfirm,
}: NumpadContentProps) {
  return (
    <div className="px-6 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Draft score preview — tap slot to switch active */}
      <div className="flex items-center justify-center gap-8 py-4">
        <SlotPreview
          value={draft.home}
          label={homeLabel}
          active={activeSlot === "home"}
          onClick={() => onSwitchSlot("home")}
        />
        <span className="text-heading-lg text-text-muted font-display">—</span>
        <SlotPreview
          value={draft.away}
          label={awayLabel}
          active={activeSlot === "away"}
          onClick={() => onSwitchSlot("away")}
        />
      </div>

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {ROWS.flat().map((d) => (
          <button
            key={d}
            onClick={() => onDigit(d)}
            className="h-14 rounded-xl bg-elevated text-heading-md font-display text-text active:bg-border transition-colors"
          >
            {d}
          </button>
        ))}

        {/* Bottom row: backspace · 0 · confirm */}
        <button
          onClick={onBackspace}
          aria-label="Borrar"
          className="h-14 rounded-xl bg-elevated flex items-center justify-center active:bg-border transition-colors"
        >
          <Icon name="arrow-left" size={20} className="text-text" />
        </button>

        <button
          onClick={() => onDigit(0)}
          className="h-14 rounded-xl bg-elevated text-heading-md font-display text-text active:bg-border transition-colors"
        >
          0
        </button>

        <button
          onClick={onConfirm}
          aria-label="Confirmar resultado"
          className="h-14 rounded-xl bg-primary flex items-center justify-center active:bg-primary-pressed transition-colors"
        >
          <Icon name="check" size={22} className="text-text-inverse" />
        </button>
      </div>
    </div>
  );
}

function SlotPreview({
  value,
  label,
  active,
  onClick,
}: {
  value: number | null;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-5 py-2 rounded-xl border transition-colors",
        active ? "border-primary bg-primary/10" : "border-border"
      )}
    >
      <span className="font-display text-numeric-lg tabular text-text">
        {value === null ? "—" : value}
      </span>
      <span className="text-body-xs text-text-muted uppercase tracking-[0.06em]">{label}</span>
    </button>
  );
}
