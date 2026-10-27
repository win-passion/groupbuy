"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Skeleton } from "../components/ui";
import Icon from "../components/shell/Icon";
import {
  describeNotification,
  formatRelative,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsFor,
  useDb,
  useNow,
  useSessionUser,
} from "../lib/store";

export default function NotificationsPage() {
  const router = useRouter();
  const db = useDb();
  const user = useSessionUser();
  const at = useNow(60_000);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const items = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    return notificationsFor(db, user.id).map((notification) => ({
      notification,
      view: describeNotification(db, notification, user.role),
    }));
  }, [db, user]);

  const unread = (items ?? []).filter((item) => !item.notification.readAt).length;
  const visible = (items ?? []).filter((item) => !unreadOnly || !item.notification.readAt);

  function open(id: string, href: string) {
    markNotificationRead(id);
    router.push(href);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="INBOX" title="Notifications" text={unread ? `${unread} unread` : "You're all caught up."}>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:border-brand-400"
          >
            Mark all as read
          </button>
        )}
      </PageHeader>

      <div role="tablist" className="mt-8 flex gap-2">
        {[false, true].map((only) => (
          <button
            key={String(only)}
            type="button"
            role="tab"
            aria-selected={unreadOnly === only}
            onClick={() => setUnreadOnly(only)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              unreadOnly === only ? "bg-ink text-white" : "bg-surface text-muted-strong hover:text-ink"
            }`}
          >
            {only ? `Unread ${unread}` : "All"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {!items ? (
          <Skeleton className="h-64" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="bell"
            title={unreadOnly ? "No unread notifications" : "No notifications yet"}
            text="Price locks, payment requests, shipping updates and more show up here."
          />
        ) : (
          <ul className="overflow-hidden rounded-sheet bg-surface shadow-sm">
            {visible.map(({ notification, view }, index) => {
              const isUnread = !notification.readAt;
              return (
                <li
                  key={notification.id}
                  className={`motion-safe:animate-rise ${index > 0 ? "border-t border-line" : ""}`}
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => open(notification.id, view.href)}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-surface-subtle ${isUnread ? "bg-brand-50/60" : ""}`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isUnread ? "bg-brand-500 text-white shadow-md shadow-brand-200" : "bg-surface-muted text-muted-strong"
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name={view.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`font-bold ${isUnread ? "text-ink" : "text-ink-soft"}`}>{view.title}</span>
                        <span className="shrink-0 text-xs text-subtle">
                          {at ? formatRelative(notification.createdAt, at) : ""}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-6 text-muted">{view.body}</span>
                    </span>
                    {isUnread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
