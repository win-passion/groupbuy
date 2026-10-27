"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { unreadCount, useDb, useSessionUser } from "../../lib/store";
import Icon from "./Icon";

/** Bell with an unread badge; links to the inbox. Renders nothing when signed out. */
export default function NotificationBell({ className = "" }: { className?: string }) {
  const db = useDb();
  const user = useSessionUser();
  const pathname = usePathname();
  const count = useMemo(() => (db && user ? unreadCount(db, user.id) : 0), [db, user]);

  if (!user) {
    return null;
  }

  const active = pathname === "/notifications";

  return (
    <Link
      href="/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex rounded-xl p-2 ${active ? "text-brand-500" : "text-subtle hover:text-brand-500"} ${className}`}
    >
      <Icon name="bell" className="h-6 w-6" />
      {count > 0 && (
        <span
          key={count}
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-surface motion-safe:animate-pop"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
