"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import { podiumContainer, podiumChild, podiumFirstPlace } from "@/lib/motion/variants";
import type { UserLevel } from "@/types/domain";

export interface PodiumEntry {
  position: 1 | 2 | 3;
  userId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: UserLevel;
  points: number;
}

interface PodiumCardProps {
  entries: PodiumEntry[];
  myUserId?: string;
}

const PODIUM_H = { 1: 96, 2: 72, 3: 60 } as const;
const PODIUM_COLORS = {
  1: "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]",
  2: "bg-[#C0C0C0]/10 border-[#C0C0C0]/30 text-[#C0C0C0]",
  3: "bg-[#CD7F32]/10 border-[#CD7F32]/30 text-[#CD7F32]",
};

function PodiumColumn({
  entry,
  isMe,
  variants,
}: {
  entry: PodiumEntry;
  isMe: boolean;
  variants: typeof podiumChild;
}) {
  const firstName = entry.name.split(" ")[0] ?? entry.name;
  const avatarSize = entry.position === 1 ? ("lg" as const) : ("md" as const);

  return (
    <motion.div variants={variants} className="flex flex-col items-center gap-2 flex-1">
      <Avatar
        name={entry.name}
        initials={entry.initials}
        avatarUrl={entry.avatarUrl}
        size={avatarSize}
        levelBadge={entry.level}
        crownBadge={entry.position === 1}
        className={cn(isMe && "ring-2 ring-primary ring-offset-1 ring-offset-base")}
      />
      <div className="flex flex-col items-center gap-0.5 px-1">
        <span
          className={cn(
            "font-semibold text-text truncate w-full text-center",
            entry.position === 1 ? "text-[13px]" : "text-[11px]"
          )}
        >
          {firstName}
        </span>
        <span className="text-[10px] text-text-muted">{entry.points} pts</span>
      </div>
      <div
        className={cn(
          "w-full rounded-t-lg border flex items-center justify-center",
          "font-display font-bold",
          entry.position === 1 ? "text-heading-sm" : "text-body-sm",
          PODIUM_COLORS[entry.position]
        )}
        style={{ height: PODIUM_H[entry.position] }}
      >
        #{entry.position}
      </div>
    </motion.div>
  );
}

export function PodiumCard({ entries, myUserId }: PodiumCardProps) {
  const first = entries.find((e) => e.position === 1);
  const second = entries.find((e) => e.position === 2);
  const third = entries.find((e) => e.position === 3);

  if (!first && !second && !third) return null;

  return (
    <motion.div
      variants={podiumContainer}
      initial="hidden"
      animate="visible"
      className="flex items-end justify-center gap-2 px-4 py-4"
    >
      {second && (
        <PodiumColumn
          entry={second}
          isMe={second.userId === myUserId}
          variants={podiumChild}
        />
      )}
      {first && (
        <PodiumColumn
          entry={first}
          isMe={first.userId === myUserId}
          variants={podiumFirstPlace}
        />
      )}
      {third && (
        <PodiumColumn
          entry={third}
          isMe={third.userId === myUserId}
          variants={podiumChild}
        />
      )}
    </motion.div>
  );
}
