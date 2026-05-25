"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { toastSlide } from "@/lib/motion/variants";
import { Icon, type IconName } from "./Icon";

// ─── Types ────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
}

// ─── Context ─────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("<ToastProvider> is missing from the tree");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...opts, id }]);
    const ttl = opts.variant === "error" ? 4000 : 2500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttl);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}

      {/* Portal-like container at the top of the viewport */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          "fixed left-0 right-0 z-toast pointer-events-none",
          "flex flex-col items-center gap-2",
          "pt-[calc(1rem+env(safe-area-inset-top))] px-4",
          "top-0 max-w-[480px] mx-auto"
        )}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastBubble
              key={t.id}
              toast={t}
              onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ─── ToastBubble (internal) ───────────────────────────────────────────

const config: Record<ToastVariant, { icon: IconName; accent: string }> = {
  success: { icon: "check", accent: "text-success" },
  error: { icon: "x-mark", accent: "text-error" },
  info: { icon: "info", accent: "text-info" },
  warning: { icon: "alert", accent: "text-warning" },
};

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const { icon, accent } = config[toast.variant];

  return (
    <motion.div
      layout
      variants={toastSlide}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-live="assertive"
      onClick={onDismiss}
      className={cn(
        "pointer-events-auto w-full",
        "flex items-center gap-3 px-4 py-3",
        "bg-elevated border border-border-strong rounded-lg shadow-md",
        "cursor-pointer"
      )}
    >
      <Icon name={icon} size={18} className={cn("flex-shrink-0", accent)} />

      <span className="flex-1 text-body-sm text-text">{toast.message}</span>

      {toast.action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.action!.onClick();
            onDismiss();
          }}
          className="text-body-sm font-semibold text-primary shrink-0 ml-1"
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );
}
