"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { modalBackdrop, modalSlide, modalFade } from "@/lib/motion/variants";
import { IconButton } from "./IconButton";

// ─── BottomSheet ──────────────────────────────────────────────────────
// Slides up from bottom. Used for numpad, filters, action sheets.

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      prevFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-modal bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            variants={modalSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-modal bg-card rounded-t-2xl shadow-lg",
              "max-w-[480px] mx-auto",
              className
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-2">
                <h2 className="text-heading-sm text-text">{title}</h2>
                <IconButton icon="close" label="Cerrar" size="sm" onClick={onClose} />
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Dialog (center modal) ────────────────────────────────────────────
// Centered overlay. Used for confirmations, alerts.

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      prevFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-modal bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-modal flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              variants={modalFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                "pointer-events-auto w-full max-w-sm bg-card rounded-2xl shadow-lg p-6",
                className
              )}
            >
              {title && <h2 className="text-heading-md text-text mb-4">{title}</h2>}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
