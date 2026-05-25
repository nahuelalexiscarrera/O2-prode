import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface NavRowProps {
  href: string;
  label: string;
  badge?: ReactNode;
  className?: string;
}

export function NavRow({ href, label, badge, className }: NavRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-4 py-3.5",
        "border-b border-border last:border-b-0",
        "text-body-sm text-text hover:bg-elevated/50 transition-colors",
        className
      )}
    >
      <span>{label}</span>
      <div className="flex items-center gap-2">
        {badge}
        <Icon name="arrow-right" size={16} className="text-text-muted" />
      </div>
    </Link>
  );
}
