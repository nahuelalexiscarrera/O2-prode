"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { tapVariants } from "@/lib/motion/variants";
import { Icon, type IconName } from "./Icon";

export type IconButtonVariant = "filled" | "outlined" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  icon: IconName;
  label: string; // required — used as aria-label
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const sizeMap: Record<IconButtonSize, { btn: string; icon: number }> = {
  sm: { btn: "h-9 w-9", icon: 16 },
  md: { btn: "h-11 w-11", icon: 20 },
  lg: { btn: "h-14 w-14", icon: 24 },
};

const variantMap: Record<IconButtonVariant, string> = {
  filled: "bg-surface text-text hover:bg-elevated",
  outlined: "border border-border text-text hover:border-border-strong",
  ghost: "bg-transparent text-text hover:bg-surface",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "ghost", size = "md", className, disabled, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      variants={tapVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md",
        "transition-colors duration-base",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Ensure minimum 44×44 touch target even if visual is smaller
        "min-w-[44px] min-h-[44px]",
        sizeMap[size].btn,
        variantMap[variant],
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={sizeMap[size].icon} />
    </motion.button>
  );
});
