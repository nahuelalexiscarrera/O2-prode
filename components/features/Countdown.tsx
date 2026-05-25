"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

function formatMs(ms: number): string {
  if (ms <= 0) return "En curso";
  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

interface CountdownProps {
  kickoffAt: string;
  prefix?: string;
  className?: string;
}

export function Countdown({ kickoffAt, prefix = "Faltan", className }: CountdownProps) {
  const [remaining, setRemaining] = useState<number>(
    () => new Date(kickoffAt).getTime() - Date.now()
  );

  useEffect(() => {
    const tick = () => setRemaining(new Date(kickoffAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  const label = remaining <= 0 ? "En curso" : `${prefix} ${formatMs(remaining)}`;

  return <span className={cn("tabular-nums", className)}>{label}</span>;
}
