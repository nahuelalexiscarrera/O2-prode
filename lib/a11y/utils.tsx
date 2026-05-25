/**
 * O2 PRODE — Accessibility Utilities
 * Agente 12 · Accessibility Auditor
 *
 * Pure helpers + React hooks for ARIA, focus management, contrast.
 */

import { useEffect, useRef } from "react";

// ─── Contrast ratio (WCAG) ───────────────────────────────────────────

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  const raw = m[1]!;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Returns WCAG contrast ratio between two hex colors (1 to 21).
 * AA normal text: ≥ 4.5  ·  AA large text: ≥ 3  ·  AAA: ≥ 7
 */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAA(fg: string, bg: string, isLargeText = false): boolean {
  const ratio = contrastRatio(fg, bg);
  return ratio >= (isLargeText ? 3 : 4.5);
}

export function meetsAAA(fg: string, bg: string, isLargeText = false): boolean {
  const ratio = contrastRatio(fg, bg);
  return ratio >= (isLargeText ? 4.5 : 7);
}

// ─── Modal: Escape to close ──────────────────────────────────────────

export function useModalEscape(onClose: () => void, isOpen = true): void {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);
}

// ─── Focus trap ──────────────────────────────────────────────────────

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Traps focus within a container ref while the modal is open.
 * Returns focus to `restoreTo` (if provided) when closed.
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  isOpen: boolean,
  restoreTo?: HTMLElement | null
): void {
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = restoreTo ?? (document.activeElement as HTMLElement | null);

    // Focus first focusable
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables[0]?.focus();

    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const elements = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (elements.length === 0) return;
      const first = elements[0]!;
      const last = elements[elements.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onTab);
    return () => {
      container.removeEventListener("keydown", onTab);
      previouslyFocused?.focus();
    };
  }, [containerRef, isOpen, restoreTo]);
}

// ─── Announce to screen reader (politely) ────────────────────────────

export function useAnnouncer() {
  const ref = useRef<HTMLDivElement | null>(null);

  function announce(message: string, assertive = false) {
    if (!ref.current) return;
    ref.current.setAttribute("aria-live", assertive ? "assertive" : "polite");
    // Clear then set to ensure re-announce of same message
    ref.current.textContent = "";
    requestAnimationFrame(() => {
      if (ref.current) ref.current.textContent = message;
    });
  }

  function AnnouncerRegion() {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    );
  }

  return { announce, AnnouncerRegion };
}

// ─── ARIA helpers ────────────────────────────────────────────────────

/**
 * Builds a stable, unique id for ARIA relationships (aria-labelledby, aria-describedby).
 * Uses React's useId under the hood when available.
 */
export function ariaId(prefix: string, suffix?: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return suffix ? `${prefix}-${suffix}-${random}` : `${prefix}-${random}`;
}

/**
 * Helper for `<time>` in es-AR with both relative and absolute formats.
 * Returns the props for a `<time>` element.
 */
export function timeProps(isoDate: string, relative: string) {
  return {
    dateTime: isoDate,
    title: new Date(isoDate).toLocaleString("es-AR"),
    children: relative,
  } as const;
}

// ─── Reduced motion check ────────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
