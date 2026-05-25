/**
 * O2 PRODE — Motion Variants Catalog
 * Agente 6 · Motion Designer
 *
 * Source of truth for all Framer Motion variants used in the product.
 * Import and apply — never define motion inline in components.
 *
 * Usage:
 *   import { tapVariants, fadeVariants, modalSlide } from "@/lib/motion/variants";
 *   <motion.button variants={tapVariants} whileTap="tap" whileHover="hover">…</motion.button>
 */

import type { Variants, Transition } from "framer-motion";

// ─── Duration tokens (ms) ───────────────────────────────────────────
export const duration = {
  fast: 0.12,
  base: 0.2,
  medium: 0.32,
  slow: 0.48,
  epic: 0.8,
} as const;

// ─── Easing curves ──────────────────────────────────────────────────
export const ease = {
  standard: [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0, 1] as const,
  accelerate: [0.4, 0, 1, 1] as const,
  linear: "linear" as const,
} as const;

// ─── Springs ────────────────────────────────────────────────────────
export const springs: Record<string, Transition> = {
  tap: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
  bounce: { type: "spring", stiffness: 380, damping: 22, mass: 0.8 },
  modal: { type: "spring", stiffness: 280, damping: 30 },
  counter: { type: "spring", stiffness: 100, damping: 20 },
};

// ─── M01: Tap feedback ──────────────────────────────────────────────
export const tapVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: duration.base, ease: ease.standard } },
  tap: { scale: 0.96, transition: springs.tap },
};

export const tapPrimaryVariants: Variants = {
  rest: { scale: 1, boxShadow: "0 0 0 rgba(255,106,0,0)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 0 24px rgba(255,106,0,0.4)",
    transition: { duration: duration.base, ease: ease.standard },
  },
  tap: { scale: 0.96, transition: springs.tap },
};

// ─── M02: Page transitions ──────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.medium, ease: ease.decelerate } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.base, ease: ease.accelerate } },
};

// ─── M03: Modal / bottom sheet ──────────────────────────────────────
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.standard } },
  exit: { opacity: 0, transition: { duration: duration.base, ease: ease.accelerate } },
};

export const modalSlide: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: springs.modal },
  exit: { y: "100%", transition: { duration: duration.base, ease: ease.accelerate } },
};

export const modalFade: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.medium, ease: ease.decelerate },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.base, ease: ease.accelerate } },
};

// ─── M04: Toast appear / dismiss ────────────────────────────────────
export const toastSlide: Variants = {
  hidden: { y: -32, opacity: 0, scale: 0.92 },
  visible: { y: 0, opacity: 1, scale: 1, transition: springs.bounce },
  exit: { y: -16, opacity: 0, transition: { duration: duration.base, ease: ease.accelerate } },
};

// ─── M07: Bottom nav tab ────────────────────────────────────────────
export const bottomNavTab: Variants = {
  inactive: { scale: 1, color: "var(--text-muted)" },
  active: {
    scale: 1,
    color: "var(--brand-primary)",
    transition: { duration: duration.base, ease: ease.standard },
  },
  tap: { scale: 0.92, transition: springs.tap },
};

// ─── M08: Score input focus ─────────────────────────────────────────
export const scoreInputFocus: Variants = {
  idle: {
    scale: 1,
    borderColor: "var(--color-border)",
    boxShadow: "0 0 0 rgba(255,106,0,0)",
  },
  focused: {
    scale: 1.05,
    borderColor: "var(--brand-primary)",
    boxShadow: "0 0 24px rgba(255,106,0,0.35)",
    transition: { duration: duration.base, ease: ease.decelerate },
  },
};

export const scoreInputValue: Variants = {
  initial: { y: 12, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: duration.fast, ease: ease.standard } },
};

// ─── M10: Phase unlock (orchestrated) ───────────────────────────────
// Uses useAnimate() controls; this is the keyframe definition for reference.
export const phaseUnlockKeyframes = {
  scale: [1, 1.2, 1.2, 1],
  filter: [
    "drop-shadow(0 0 0px transparent)",
    "drop-shadow(0 0 0px transparent)",
    "drop-shadow(0 0 32px rgba(255,106,0,0.5))",
    "drop-shadow(0 0 32px rgba(255,106,0,0.5))",
  ],
  transition: {
    duration: duration.epic,
    times: [0, 0.25, 0.6, 1],
    ease: ease.standard,
  },
};

// ─── M11: Podium reveal (stagger children) ──────────────────────────
export const podiumContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

export const podiumChild: Variants = {
  hidden: { y: 40, opacity: 0, scale: 0.92 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springs.bounce,
  },
};

export const podiumFirstPlace: Variants = {
  hidden: { y: 80, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { ...springs.bounce, delay: 0.4 },
  },
};

export const crownEntry: Variants = {
  hidden: { scale: 0, rotate: -20, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { ...springs.bounce, delay: 0.6 },
  },
};

// ─── M13: Heart pop (reaction) ──────────────────────────────────────
export const heartPop: Variants = {
  idle: { scale: 1 },
  active: {
    scale: [1, 1.4, 1],
    transition: { duration: 0.4, times: [0, 0.5, 1], ease: ease.standard },
  },
};

// Ghost heart that floats up
export const heartGhost: Variants = {
  hidden: { y: 0, opacity: 0, scale: 1 },
  visible: {
    y: -40,
    opacity: [1, 1, 0],
    scale: 1.6,
    transition: { duration: 0.6, ease: ease.decelerate, times: [0, 0.4, 1] },
  },
};

// ─── M16: Achievement unlock (orchestrated) ─────────────────────────
export const achievementBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: duration.medium, ease: ease.decelerate },
  },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: duration.base } },
};

export const achievementIcon: Variants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: [0, 1.2, 1],
    rotate: 0,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.6,
      ease: ease.standard,
      times: [0, 0.7, 1],
    },
  },
};

export const achievementTitle: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.5, duration: duration.medium, ease: ease.decelerate },
  },
};

export const achievementName: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.7, duration: duration.medium, ease: ease.decelerate },
  },
};

export const achievementCTAs: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.9, duration: duration.medium, ease: ease.decelerate },
  },
};

// ─── M17: FAB scroll contraction ────────────────────────────────────
export const fabContract: Variants = {
  expanded: { width: 200, transition: { duration: duration.medium, ease: ease.standard } },
  contracted: { width: 56, transition: { duration: duration.medium, ease: ease.standard } },
};

// ─── Generic fade ───────────────────────────────────────────────────
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.standard } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.accelerate } },
};

export const slideUp: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: duration.medium, ease: ease.decelerate },
  },
  exit: { y: 16, opacity: 0, transition: { duration: duration.base, ease: ease.accelerate } },
};

// ─── Home dashboard orchestration ───────────────────────────────────
export const homeContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.0,
    },
  },
};

export const homeChild: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: duration.medium, ease: ease.decelerate },
  },
};

// ─── Utility: reduced-motion-safe variant resolver ──────────────────
/**
 * Returns a variant object that respects prefers-reduced-motion.
 * Use with `useReducedMotion()` hook from framer-motion.
 *
 * @example
 *   const reduced = useReducedMotion();
 *   <motion.div variants={withReducedMotion(slideUp, fadeVariants, reduced)} />
 */
export function withReducedMotion<T extends Variants>(
  full: T,
  reduced: Variants,
  isReduced: boolean | null
): Variants {
  return isReduced ? reduced : full;
}
