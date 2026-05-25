"use client";

import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils/cn";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

interface GroupChipBarProps {
  activeGroup: string;
  className?: string;
}

export function GroupChipBar({ activeGroup, className }: GroupChipBarProps) {
  const router = useRouter();

  return (
    <div
      role="tablist"
      aria-label="Grupos"
      className={cn("flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide", className)}
    >
      {GROUPS.map((g) => (
        <Chip
          key={g}
          active={g === activeGroup.toUpperCase()}
          onClick={() => router.push(`/app/prode/grupos/${g.toLowerCase()}`)}
          className="shrink-0"
        >
          {g}
        </Chip>
      ))}
    </div>
  );
}
