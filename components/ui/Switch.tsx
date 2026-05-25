"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { springs } from "@/lib/motion/variants";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, disabled, id, className }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={id}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative h-8 w-14 rounded-full transition-colors duration-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          checked ? "bg-primary" : "bg-border"
        )}
      >
        {/* Thumb */}
        <motion.span
          className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm pointer-events-none"
          animate={{ x: checked ? 24 : 0 }}
          transition={springs.tap}
        />
      </button>

      {label && <span className="text-body-md text-text select-none">{label}</span>}
    </label>
  );
}
