"use client";

import { useState, useId, forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helper?: string;
  errorText?: string;
  state?: "default" | "error" | "disabled";
  leftIcon?: IconName;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helper,
    errorText,
    state = "default",
    leftIcon,
    rightElement,
    className,
    id,
    disabled,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value ?? defaultValue));
  const autoId = useId();
  const inputId = id ?? autoId;

  const isError = state === "error" || Boolean(errorText);
  const isDisabled = state === "disabled" || disabled;
  const isFloating = focused || hasValue || Boolean(value);

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Floating label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "absolute pointer-events-none select-none transition-all duration-base",
              leftIcon ? "left-10" : "left-4",
              isFloating
                ? "top-2 text-body-xs text-text-muted"
                : "top-1/2 -translate-y-1/2 text-body-md text-text-muted"
            )}
          >
            {label}
          </label>
        )}

        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Icon name={leftIcon} size={18} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={isDisabled}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            onChange?.(e);
          }}
          className={cn(
            // text-body-lg = 16px: evita el auto-zoom de iOS al enfocar (a11y C1)
            "w-full h-14 rounded-md bg-surface border text-text text-body-lg px-4",
            "transition-colors duration-base outline-none",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            label && "pt-4",
            leftIcon && "pl-10",
            rightElement && "pr-10",
            isError
              ? "border-error focus:ring-1 focus:ring-error"
              : focused
                ? "border-primary shadow-[0_0_0_1px_var(--brand-primary)]"
                : "border-border hover:border-border-strong"
          )}
          {...rest}
        />

        {/* Right element (icon button, toggle, etc.) */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper or error text */}
      {(errorText ?? helper) && (
        <p className={cn("mt-1.5 text-body-xs", isError ? "text-error" : "text-text-muted")}>
          {errorText ?? helper}
        </p>
      )}
    </div>
  );
});
