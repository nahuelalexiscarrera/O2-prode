"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { tapVariants } from "@/lib/motion/variants";
import { Icon, type IconName } from "./Icon";
import type { ReactNode } from "react";

interface ChipProps {
  active?: boolean;
  leftIcon?: IconName;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({ active, leftIcon, children, onClick, disabled, className }: ChipProps) {
  return (
    <motion.button
      variants={tapVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full",
        "text-body-sm font-semibold transition-colors duration-base",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-primary text-text-inverse"
          : "border border-border text-text-muted hover:border-border-strong hover:text-text",
        className
      )}
    >
      {leftIcon && <Icon name={leftIcon} size={14} />}
      {children}
    </motion.button>
  );
}
