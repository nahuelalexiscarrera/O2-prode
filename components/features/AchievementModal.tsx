"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { ShareButton } from "@/components/features/ShareButton";
import {
  achievementBackdrop,
  achievementIcon,
  achievementTitle,
  achievementName,
  achievementCTAs,
} from "@/lib/motion/variants";
import type { IconName } from "@/components/ui/Icon";

export interface UnlockedAchievement {
  id: string;
  name: string;
  iconRef: string;
  pointsBonus: number;
  impact: string;
}

interface AchievementModalProps {
  achievements: UnlockedAchievement[];
  userId: string;
  onClose: () => void;
}

export function AchievementModal({ achievements, userId, onClose }: AchievementModalProps) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = achievements.length > 0 ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [achievements.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current = achievements[index];
  if (!mounted || !current) return null;

  function handleNext() {
    if (index < achievements.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }

  const isLast = index === achievements.length - 1;
  const isValidIcon = (name: string): name is IconName => {
    const valid = new Set([
      "target","flame","check","medal","crown","ball","clock","comment","heart",
      "share","nav-user","nav-chart","arrow-up","world-trophy","star",
    ]);
    return valid.has(name);
  };
  const iconName: IconName = isValidIcon(current.iconRef) ? current.iconRef : "star";

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={achievementBackdrop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(10,6,8,0.92)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Logro desbloqueado"
      >
        <div className="flex flex-col items-center gap-6 px-8 text-center max-w-sm w-full">
          {/* Icon */}
          <motion.div
            variants={achievementIcon}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center w-40 h-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(217,255,63,0.25) 0%, transparent 70%)",
              border: "2px solid rgba(217,255,63,0.4)",
            }}
          >
            <Icon name={iconName} size={64} className="text-[#D9FF3F] drop-shadow-[0_0_20px_rgba(217,255,63,0.6)]" />
          </motion.div>

          {/* Label */}
          <motion.span
            variants={achievementTitle}
            initial="hidden"
            animate="visible"
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted"
          >
            Logro desbloqueado
          </motion.span>

          {/* Name + bonus */}
          <motion.div
            variants={achievementName}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-1"
          >
            <span className="font-display text-heading-md text-[#D9FF3F] uppercase">
              {current.name}
            </span>
            <span className="text-body-sm text-primary font-bold">
              +{current.pointsBonus} pts
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={achievementCTAs}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3 w-full"
          >
            <ShareButton
              template="achievement"
              userId={userId}
              contextId={current.id}
              label="Compartir logro"
              className="w-full justify-center"
            />
            <Button variant="ghost" size="sm" onClick={handleNext}>
              {isLast ? "Cerrar" : "Siguiente logro"}
            </Button>
          </motion.div>

          {/* Queue indicator */}
          {achievements.length > 1 && (
            <div className="flex gap-1.5">
              {achievements.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i === index ? "#D9FF3F" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
