/**
 * O2 PRODE — Button primitive
 * Spec: Agente 3 §9.1, Agente 6 M01 (tap variants)
 */

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { tapVariants, tapPrimaryVariants } from "@/lib/motion/variants";
import { Icon, type IconName } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-body-sm font-semibold",
  md: "h-12 px-6 text-body-md font-semibold",
  lg: "h-14 px-8 text-body-lg font-bold",
};

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-primary text-text-inverse rounded-full",
  secondary: "bg-transparent text-text border border-border-strong rounded-md hover:bg-surface",
  ghost: "bg-transparent text-text rounded-md hover:bg-surface",
  danger: "bg-error text-text rounded-full",
  link: "bg-transparent text-primary underline-offset-4 hover:underline",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leftIcon,
    rightIcon,
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  const variants = variant === "primary" ? tapPrimaryVariants : tapVariants;
  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;

  return (
    <motion.button
      ref={ref}
      variants={variants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        sizeMap[size],
        variantMap[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={iconSize} />}
          {children}
          {rightIcon && <Icon name={rightIcon} size={iconSize} />}
        </>
      )}
    </motion.button>
  );
});
