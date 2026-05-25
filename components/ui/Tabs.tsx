"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ─── Context ─────────────────────────────────────────────────────────

interface TabsCtxValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsCtx = createContext<TabsCtxValue | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("<Tab> must be inside <Tabs>");
  return ctx;
}

// ─── Tabs (root) ─────────────────────────────────────────────────────

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsCtx.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

// ─── TabList ─────────────────────────────────────────────────────────

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div role="tablist" className={cn("flex border-b border-border", className)}>
      {children}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────

interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  rightElement?: ReactNode; // badge, lock icon, etc.
  className?: string;
}

export function Tab({ value, children, disabled, rightElement, className }: TabProps) {
  const { value: selected, onChange } = useTabsCtx();
  const isActive = selected === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-2",
        "h-11 px-4 text-body-sm font-semibold",
        "border-b-2 -mb-px transition-colors duration-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isActive
          ? "text-primary border-primary"
          : "text-text-muted border-transparent hover:text-text",
        className
      )}
    >
      {children}
      {rightElement}
    </button>
  );
}

// ─── TabPanel ────────────────────────────────────────────────────────

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { value: selected } = useTabsCtx();
  if (selected !== value) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
