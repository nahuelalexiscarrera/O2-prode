import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Link
      href="/app/notificaciones"
      aria-label={
        unreadCount > 0
          ? `Notificaciones (${unreadCount} sin leer)`
          : "Notificaciones"
      }
      className="relative flex items-center justify-center w-9 h-9 rounded-full text-text-muted hover:text-text transition-colors"
    >
      <Icon name="bell" size={22} />
      {unreadCount > 0 && (
        <span
          className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-[3px] rounded-full bg-primary text-[9px] font-bold text-text-inverse leading-none"
          aria-hidden="true"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
